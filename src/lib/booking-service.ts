import "./inherit-runtime";
import { formDefinition, type FormValues } from "./form-definition";
import { getCalendarProvider, describeCalendar } from "./providers";
import { getStore } from "./sqlite-store";
import type { Actor, BookingRecord } from "./store";
import { formatSlotRange } from "./time";
import { getWorkflow } from "./workflows/registry";
import { getInheritRuntime } from "./runtime-ref";
import { mergeProvenance, StaleSessionError, validateAll } from "@inherit/core";
import type { SessionRecord } from "@inherit/core";

function nowIso() {
  return new Date().toISOString();
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function bumpSession(
  session: SessionRecord,
  patch: Partial<SessionRecord>,
  expectedVersion?: number,
) {
  return getInheritRuntime().bumpSession(session, patch, expectedVersion);
}

function ensureSession(sessionId?: string | null, workflowId?: string | null) {
  return getInheritRuntime().ensureSession(sessionId, workflowId);
}

function getWorkflowState(sessionId?: string | null, workflowId?: string | null) {
  return getInheritRuntime().getState(sessionId, workflowId);
}

function recordActivity(input: Parameters<ReturnType<typeof getInheritRuntime>["recordActivity"]>[0]) {
  return getInheritRuntime().recordActivity(input);
}

export { ensureSession, getWorkflowState, StaleSessionError };

export function getFormState(sessionId?: string | null, workflowId?: string | null) {
  return getWorkflowState(sessionId, workflowId);
}

export function submitStep(
  sessionId: string | undefined,
  stepId: string,
  values: Record<string, string | boolean | undefined>,
) {
  return getInheritRuntime().submitStep({
    sessionId,
    stepId,
    values,
    actor: "human",
  });
}

export async function listAvailableSlots(input?: { from?: string; to?: string }) {
  const calendar = getCalendarProvider();
  const slots = await calendar.listSlots({
    from: input?.from || undefined,
    to: input?.to || undefined,
  });
  return {
    provider: calendar.name,
    timezone: formDefinition.timezone,
    durationMinutes: formDefinition.durationMinutes,
    slots: slots.filter((slot) => slot.remaining > 0),
    allSlots: slots,
  };
}

export async function bookSlot(input: {
  sessionId?: string;
  slotId: string;
  values?: Record<string, string | boolean | undefined>;
  actor?: Actor;
  expectedVersion?: number;
  toolName?: string;
}) {
  const store = getStore();
  const calendar = getCalendarProvider();
  const actor = input.actor ?? "human";
  const session = ensureSession(input.sessionId);
  const values: FormValues = {
    ...session.values,
    service: session.values.service || input.values?.service || "first_consult",
    format: session.values.format || input.values?.format || "video",
    ...input.values,
    slotId: input.slotId,
    consent: input.values?.consent ?? session.values.consent ?? true,
  };

  if (session.recordId) {
    const existing = store.getBooking(session.recordId);
    if (existing?.status === "confirmed" && existing.slotId === input.slotId) {
      return {
        ok: true as const,
        errors: [],
        booking: { ...existing, label: formatSlotRange(existing.start, existing.end) },
        state: getWorkflowState(session.id),
      };
    }
    if (existing?.status === "confirmed") {
      return {
        ok: false as const,
        errors: [{ fieldId: "slotId", message: "This session already has a booking. Reschedule it instead." }],
        state: getWorkflowState(session.id),
      };
    }
  }

  const errors = validateAll({ ...values, consent: values.consent ?? true }, formDefinition);
  const identityErrors = errors.filter((error) => ["name", "email", "slotId"].includes(error.fieldId));
  if (identityErrors.length) {
    return { ok: false as const, errors: identityErrors, state: getWorkflowState(session.id) };
  }

  const slot = await calendar.getSlot(input.slotId);
  if (!slot) {
    return {
      ok: false as const,
      errors: [{ fieldId: "slotId", message: "That slot is not on the calendar." }],
      state: getWorkflowState(session.id),
    };
  }
  if (slot.remaining <= 0) {
    return {
      ok: false as const,
      errors: [{ fieldId: "slotId", message: "That slot is full. Pick another time." }],
      state: getWorkflowState(session.id),
    };
  }

  const bookingId = `bk_${crypto.randomUUID()}`;
  const createdAt = nowIso();
  const event = await calendar.createEvent({
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    title: `${formDefinition.title} · ${asString(values.name)}`,
    description: asString(values.notes),
    attendeeEmail: asString(values.email),
    attendeeName: asString(values.name),
  });

  const booking: BookingRecord = {
    id: bookingId,
    sessionId: session.id,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    name: asString(values.name),
    email: asString(values.email),
    phone: asString(values.phone) || null,
    values,
    calendarEventId: event.id,
    calendarProvider: calendar.name,
    status: "confirmed",
    createdAt,
    updatedAt: createdAt,
  };

  store.createBooking(booking);
  bumpSession(
    session,
    {
      values,
      currentStepId: "confirm",
      completedStepIds: formDefinition.steps.map((step) => step.id),
      recordId: bookingId,
      proposal: null,
      provenance: mergeProvenance(session, { slotId: slot.id }, actor, input.toolName ? "tool" : "input"),
    },
    input.expectedVersion,
  );
  recordActivity({
    sessionId: session.id,
    actor,
    action: "book_slot",
    toolName: input.toolName,
    field: "slotId",
    nextValue: slot.label,
    summary: `${actor === "agent" ? "ChatGPT" : "You"} booked ${slot.label}`,
  });

  return {
    ok: true as const,
    errors: [],
    booking: {
      ...booking,
      label: formatSlotRange(booking.start, booking.end),
    },
    state: getWorkflowState(session.id),
  };
}

export async function rescheduleBooking(input: {
  sessionId: string;
  slotId: string;
  actor?: Actor;
  expectedVersion?: number;
  toolName?: string;
}) {
  const store = getStore();
  const calendar = getCalendarProvider();
  const actor = input.actor ?? "human";
  const session = ensureSession(input.sessionId);
  if (!session.recordId) {
    return {
      ok: false as const,
      errors: [{ fieldId: "booking", message: "There is no active booking to reschedule." }],
      state: getWorkflowState(session.id),
    };
  }
  const booking = store.getBooking(session.recordId);
  if (!booking || booking.status !== "confirmed") {
    return {
      ok: false as const,
      errors: [{ fieldId: "booking", message: "There is no active booking to reschedule." }],
      state: getWorkflowState(session.id),
    };
  }

  const slot = await calendar.getSlot(input.slotId);
  if (!slot) {
    return {
      ok: false as const,
      errors: [{ fieldId: "slotId", message: "That slot is not on the calendar." }],
      state: getWorkflowState(session.id),
    };
  }
  if (slot.id !== booking.slotId && slot.remaining <= 0) {
    return {
      ok: false as const,
      errors: [{ fieldId: "slotId", message: "That slot is full. Pick another time." }],
      state: getWorkflowState(session.id),
    };
  }

  const previousLabel = formatSlotRange(booking.start, booking.end);
  await calendar.updateEvent({
    id: booking.calendarEventId,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    title: `${formDefinition.title} · ${booking.name}`,
    attendeeEmail: booking.email,
    attendeeName: booking.name,
  });

  const updated: BookingRecord = {
    ...booking,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    values: { ...booking.values, slotId: slot.id },
    updatedAt: nowIso(),
  };
  store.updateBooking(updated);
  bumpSession(
    session,
    {
      values: { ...session.values, slotId: slot.id },
      proposal: null,
      provenance: mergeProvenance(session, { slotId: slot.id }, actor, input.toolName ? "tool" : "input"),
    },
    input.expectedVersion,
  );
  recordActivity({
    sessionId: session.id,
    actor,
    action: "reschedule_booking",
    toolName: input.toolName,
    field: "slotId",
    previousValue: previousLabel,
    nextValue: slot.label,
    summary:
      actor === "agent"
        ? `ChatGPT rescheduled ${previousLabel} → ${slot.label}`
        : `You moved the booking to ${slot.label}`,
  });

  return {
    ok: true as const,
    errors: [],
    booking: { ...updated, label: slot.label, previousLabel },
    state: getWorkflowState(session.id),
  };
}

export async function cancelBooking(input: {
  sessionId: string;
  actor?: Actor;
  expectedVersion?: number;
  toolName?: string;
}) {
  const store = getStore();
  const actor = input.actor ?? "human";
  const session = ensureSession(input.sessionId);
  if (!session.recordId) {
    return {
      ok: false as const,
      errors: [{ fieldId: "booking", message: "There is no booking to cancel." }],
      state: getWorkflowState(session.id),
    };
  }
  const booking = store.getBooking(session.recordId);
  if (!booking || booking.status !== "confirmed") {
    return {
      ok: false as const,
      errors: [{ fieldId: "booking", message: "There is no active booking to cancel." }],
      state: getWorkflowState(session.id),
    };
  }

  const updated: BookingRecord = {
    ...booking,
    status: "cancelled",
    updatedAt: nowIso(),
  };
  store.updateBooking(updated);
  const calendar = getCalendarProvider();
  await calendar.cancelEvent(booking.calendarEventId);
  bumpSession(session, { proposal: null }, input.expectedVersion);
  recordActivity({
    sessionId: session.id,
    actor,
    action: "cancel_booking",
    toolName: input.toolName,
    summary: actor === "agent" ? "ChatGPT cancelled the booking" : "You cancelled the booking",
  });

  return {
    ok: true as const,
    errors: [],
    booking: { ...updated, label: formatSlotRange(updated.start, updated.end) },
    state: getWorkflowState(session.id),
  };
}

export function getBookingStatus(query: { email?: string; bookingId?: string }) {
  if (!query.email && !query.bookingId) {
    return {
      ok: false as const,
      error: "Provide email or bookingId.",
      bookings: [],
    };
  }
  const bookings = getStore()
    .findBookings(query)
    .map((booking) => ({
      ...booking,
      label: formatSlotRange(booking.start, booking.end),
    }));
  return {
    ok: true as const,
    bookings,
  };
}

export function suggestBriefDeliverable(input: {
  sessionId: string;
  actor?: Actor;
  expectedVersion?: number;
  toolName?: string;
}) {
  const actor = input.actor ?? "agent";
  const session = ensureSession(input.sessionId, "brief");
  const goal = asString(session.values.goal).toLowerCase();
  let deliverable = "landing_page";
  let label = "Landing page";
  if (goal.includes("system") || goal.includes("token") || goal.includes("component")) {
    deliverable = "design_system";
    label = "Design system";
  } else if (goal.includes("proto") || goal.includes("flow") || goal.includes("click")) {
    deliverable = "prototype";
    label = "Prototype";
  } else if (goal.includes("brand") || goal.includes("identity") || goal.includes("voice")) {
    deliverable = "brand_refresh";
    label = "Brand refresh";
  }

  const proposal = {
    id: `pr_${crypto.randomUUID()}`,
    action: "suggest_deliverables" as const,
    toolName: input.toolName,
    actor,
    summary: `ChatGPT suggested ${label}`,
    payload: { deliverable, label },
    status: "pending" as const,
    createdAt: nowIso(),
  };
  bumpSession(session, { proposal }, input.expectedVersion);
  recordActivity({
    sessionId: session.id,
    actor,
    action: "propose",
    toolName: input.toolName,
    field: "deliverable",
    nextValue: label,
    summary: proposal.summary,
  });
  return { ok: true as const, errors: [], proposal, state: getWorkflowState(session.id) };
}

export function submitProjectBrief(input: {
  sessionId: string;
  values?: Record<string, string | boolean | undefined>;
  actor?: Actor;
  expectedVersion?: number;
  toolName?: string;
}) {
  const actor = input.actor ?? "human";
  const session = ensureSession(input.sessionId, "brief");
  const workflow = getWorkflow("brief");
  const merged = { ...session.values, ...input.values, ready: true, submitted: true };
  const required = validateAll(merged, workflow.form);
  if (required.length) {
    return { ok: false as const, errors: required, state: getWorkflowState(session.id) };
  }

  bumpSession(
    session,
    {
      values: merged,
      currentStepId: "review",
      completedStepIds: workflow.form.steps.map((step) => step.id),
      proposal: null,
      provenance: mergeProvenance(session, merged, actor, input.toolName ? "tool" : "input"),
    },
    input.expectedVersion,
  );
  recordActivity({
    sessionId: session.id,
    actor,
    action: "submit_project_brief",
    toolName: input.toolName,
    summary: actor === "agent" ? "ChatGPT submitted the project brief" : "You submitted the project brief",
  });
  return { ok: true as const, errors: [], state: getWorkflowState(session.id) };
}

export { describeCalendar };

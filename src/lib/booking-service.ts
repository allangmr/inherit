import { FORM_ID } from "./config";
import { formDefinition, nextStepId, validateAll, validateStep } from "./form-definition";
import { getCalendarProvider, describeCalendar } from "./providers";
import { getStore } from "./sqlite-store";
import type { BookingRecord, SessionRecord } from "./store";
import { formatSlotRange } from "./time";

function nowIso() {
  return new Date().toISOString();
}

export function emptySession(id: string): SessionRecord {
  return {
    id,
    formId: FORM_ID,
    currentStepId: formDefinition.steps[0].id,
    values: {},
    completedStepIds: [],
    bookingId: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function ensureSession(sessionId?: string | null) {
  const store = getStore();
  const id = sessionId?.trim() || crypto.randomUUID();
  return store.getSession(id) ?? store.upsertSession(emptySession(id));
}

export function getFormState(sessionId?: string | null) {
  const session = ensureSession(sessionId);
  const booking = session.bookingId ? getStore().getBooking(session.bookingId) : null;
  return {
    form: {
      id: formDefinition.id,
      title: formDefinition.title,
      description: formDefinition.description,
      durationMinutes: formDefinition.durationMinutes,
      timezone: formDefinition.timezone,
      location: formDefinition.location,
      steps: formDefinition.steps.map((step, index) => ({
        id: step.id,
        index,
        title: step.title,
        subtitle: step.subtitle,
        fields: step.fields.map((field) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          hint: field.hint,
          placeholder: field.placeholder,
          options: field.options,
          validation: field.rules,
        })),
      })),
    },
    session: {
      id: session.id,
      currentStepId: session.currentStepId,
      values: session.values,
      completedStepIds: session.completedStepIds,
      bookingId: session.bookingId,
      status: booking ? "booked" : "in_progress",
    },
    booking,
    calendar: describeCalendar(),
  };
}

export function saveDraft(
  sessionId: string,
  values: Record<string, string | boolean | undefined>,
) {
  const store = getStore();
  const session = ensureSession(sessionId);
  const next = {
    ...session,
    values: { ...session.values, ...values },
    updatedAt: nowIso(),
  };
  store.upsertSession(next);
  return getFormState(session.id);
}

export function submitStep(
  sessionId: string | undefined,
  stepId: string,
  values: Record<string, string | boolean | undefined>,
) {
  const session = ensureSession(sessionId);
  const merged = { ...session.values, ...values };
  const errors = validateStep(stepId, merged);
  if (errors.length) {
    return {
      ok: false as const,
      errors,
      state: getFormState(session.id),
    };
  }

  const completed = new Set(session.completedStepIds);
  completed.add(stepId);
  const upcoming = nextStepId(stepId);
  getStore().upsertSession({
    ...session,
    values: merged,
    completedStepIds: [...completed],
    currentStepId: upcoming ?? stepId,
    updatedAt: nowIso(),
  });

  return {
    ok: true as const,
    errors: [],
    advancedTo: upcoming,
    completed: !upcoming,
    state: getFormState(session.id),
  };
}

export async function listAvailableSlots(input?: { from?: string; to?: string }) {
  const calendar = getCalendarProvider();
  const slots = await calendar.listSlots(input);
  return {
    provider: calendar.name,
    timezone: formDefinition.timezone,
    durationMinutes: formDefinition.durationMinutes,
    slots: slots.filter((slot) => slot.remaining > 0),
    allSlots: slots,
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function bookSlot(input: {
  sessionId?: string;
  slotId: string;
  values?: Record<string, string | boolean | undefined>;
}) {
  const store = getStore();
  const calendar = getCalendarProvider();
  const session = ensureSession(input.sessionId);
  const values: Record<string, string | boolean | undefined> = {
    ...session.values,
    ...input.values,
    slotId: input.slotId,
  };

  const errors = validateAll({ ...values, consent: values.consent ?? true });
  const identityErrors = errors.filter((error) =>
    ["name", "email", "slotId"].includes(error.fieldId),
  );
  if (identityErrors.length) {
    return { ok: false as const, errors: identityErrors, state: getFormState(session.id) };
  }

  const slot = await calendar.getSlot(input.slotId);
  if (!slot) {
    return {
      ok: false as const,
      errors: [{ fieldId: "slotId", message: "That slot is not on the calendar." }],
      state: getFormState(session.id),
    };
  }
  if (slot.remaining <= 0) {
    return {
      ok: false as const,
      errors: [{ fieldId: "slotId", message: "That slot is full. Pick another time." }],
      state: getFormState(session.id),
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
  };

  store.createBooking(booking);
  store.upsertSession({
    ...session,
    values,
    currentStepId: "confirm",
    completedStepIds: formDefinition.steps.map((step) => step.id),
    bookingId,
    updatedAt: createdAt,
  });

  return {
    ok: true as const,
    errors: [],
    booking: {
      ...booking,
      label: formatSlotRange(booking.start, booking.end),
    },
    state: getFormState(session.id),
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

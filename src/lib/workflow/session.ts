import { formatSlotRange } from "@/lib/time";
import type { Actor, FieldProvenance, SessionRecord } from "@/lib/store";
import { getStore } from "@/lib/sqlite-store";
import { projectForm, type FormValues } from "@/lib/form-definition";
import { getAvailableTools, capabilityNames } from "./capabilities";
import { snapshotFrom, type WorkflowDefinition } from "./types";
import { StaleSessionError } from "./stale";
import { getWorkflow } from "@/lib/workflows/registry";
import { describeCalendar } from "@/lib/providers";

function nowIso() {
  return new Date().toISOString();
}

function redact(value: unknown) {
  if (typeof value !== "string") return value;
  if (value.includes("@") && value.includes(".")) return "[email]";
  return value;
}

export function spokenActor(actor: Actor) {
  if (actor === "agent") return "ChatGPT";
  if (actor === "system") return "System";
  return "You";
}

export function emptySession(id: string, workflow: WorkflowDefinition): SessionRecord {
  return {
    id,
    workflowId: workflow.id,
    formId: workflow.form.id,
    currentStepId: workflow.form.steps[0].id,
    values: {},
    completedStepIds: [],
    bookingId: null,
    version: 1,
    provenance: {},
    proposal: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function ensureSession(sessionId?: string | null, workflowId?: string | null) {
  const store = getStore();
  const workflow = getWorkflow(workflowId);
  const id = sessionId?.trim() || crypto.randomUUID();
  const existing = store.getSession(id);
  if (existing) return existing;
  return store.upsertSession(emptySession(id, workflow));
}

function persistSession(next: SessionRecord, expectedVersion?: number) {
  const store = getStore();
  if (expectedVersion !== undefined) {
    const written = store.compareAndSetSession(next, expectedVersion);
    if (!written) {
      const current = store.getSession(next.id);
      throw new StaleSessionError(expectedVersion, current?.version ?? expectedVersion);
    }
    return written;
  }
  return store.upsertSession(next);
}

export function bumpSession(
  session: SessionRecord,
  patch: Partial<SessionRecord>,
  expectedVersion?: number,
) {
  const next: SessionRecord = {
    ...session,
    ...patch,
    version: session.version + 1,
    updatedAt: nowIso(),
  };
  return persistSession(next, expectedVersion ?? session.version);
}

export function recordActivity(input: {
  sessionId: string;
  actor: Actor;
  action: string;
  summary: string;
  field?: string;
  previousValue?: unknown;
  nextValue?: unknown;
  toolName?: string;
}) {
  return getStore().appendActivity({
    id: `act_${crypto.randomUUID()}`,
    timestamp: nowIso(),
    ...input,
    previousValue: redact(input.previousValue),
    nextValue: redact(input.nextValue),
  });
}

export function mergeProvenance(
  session: SessionRecord,
  values: FormValues,
  actor: Actor,
  source: FieldProvenance["source"],
) {
  const at = nowIso();
  const provenance = { ...session.provenance };
  for (const [field, value] of Object.entries(values)) {
    if (session.values[field] === value) continue;
    provenance[field] = { actor, at, source };
  }
  return provenance;
}

export function getWorkflowState(sessionId?: string | null, workflowId?: string | null) {
  const store = getStore();
  const session = ensureSession(sessionId, workflowId);
  const workflow = getWorkflow(session.workflowId);
  const booking = session.bookingId ? store.getBooking(session.bookingId) : null;
  const snapshot = snapshotFrom(session, booking);
  const capabilities = getAvailableTools(workflow, snapshot);
  return {
    workflow: {
      id: workflow.id,
      version: workflow.version,
      title: workflow.title,
      description: workflow.description,
    },
    form: projectForm(workflow.form),
    session: {
      id: session.id,
      workflowId: session.workflowId,
      currentStepId: session.currentStepId,
      values: session.values,
      completedStepIds: session.completedStepIds,
      bookingId: session.bookingId,
      version: session.version,
      provenance: session.provenance,
      status:
        booking?.status === "confirmed"
          ? "booked"
          : booking?.status === "cancelled"
            ? "cancelled"
            : session.values.submitted === true
              ? "submitted"
              : "in_progress",
    },
    booking: booking
      ? {
          ...booking,
          label: formatSlotRange(booking.start, booking.end),
        }
      : null,
    proposal: session.proposal,
    capabilities,
    capabilityNames: capabilityNames(capabilities),
    activity: store.listActivity(session.id),
    calendar: describeCalendar(),
  };
}

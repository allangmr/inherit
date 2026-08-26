import {
  createWorkflowRuntime,
  spokenActor,
  type Actor,
  type FormValues,
  type ProposalRecord,
  type SessionRecord,
  type WorkflowState,
  type WorkflowStore,
} from "@inherit/core";
import { getStore } from "./sqlite-store";
import { getWorkflow } from "./workflows/registry";
import { describeCalendar } from "./providers";
import { formatSlotRange, labelFromSlotId } from "./time";
import { createDemoHandlers } from "./demo/action-handlers";
import { setInheritRuntime, getInheritRuntime } from "./runtime-ref";
import type { BookingRecord } from "./store";

export type AppWorkflowState = WorkflowState & {
  session: WorkflowState["session"] & {
    bookingId: string | null;
  };
  booking: (BookingRecord & { label: string }) | null;
  calendar: ReturnType<typeof describeCalendar>;
};

function recordStatusOf(booking: BookingRecord | null) {
  if (!booking) return "none" as const;
  return booking.status === "cancelled" ? ("cancelled" as const) : ("confirmed" as const);
}

function snapshot(session: SessionRecord) {
  const booking = session.recordId ? getStore().getBooking(session.recordId) : null;
  return {
    workflowId: session.workflowId,
    currentStepId: session.currentStepId,
    values: session.values,
    completedStepIds: session.completedStepIds,
    recordStatus: recordStatusOf(booking),
    hasProposal: Boolean(session.proposal),
  };
}

function decorateState(state: WorkflowState): WorkflowState {
  const booking = state.session.recordId ? getStore().getBooking(state.session.recordId) : null;
  const status =
    booking?.status === "confirmed"
      ? "booked"
      : booking?.status === "cancelled"
        ? "cancelled"
        : state.session.status;
  const decorated: AppWorkflowState = {
    ...state,
    session: {
      ...state.session,
      bookingId: state.session.recordId,
      status,
    },
    booking: booking
      ? {
          ...booking,
          label: formatSlotRange(booking.start, booking.end),
        }
      : null,
    calendar: describeCalendar(),
  };
  return decorated;
}

function applyProposalValues(proposal: ProposalRecord) {
  if (proposal.action === "propose_slot") {
    const slotId = String(proposal.payload.slotId ?? "");
    return {
      values: { slotId } satisfies FormValues,
      field: "slotId",
      nextValue: slotId,
      summary: `${spokenActor("human")} accepted the proposed time`,
    };
  }
  if (proposal.action === "suggest_deliverables") {
    const deliverable = String(proposal.payload.deliverable ?? "");
    return {
      values: { deliverable } satisfies FormValues,
      field: "deliverable",
      nextValue: deliverable,
      summary: `${spokenActor("human")} accepted the suggested deliverable`,
    };
  }
  return null;
}

const store: WorkflowStore = {
  getSession: (id) => getStore().getSession(id),
  upsertSession: (session) => getStore().upsertSession(session),
  compareAndSetSession: (session, expectedVersion) =>
    getStore().compareAndSetSession(session, expectedVersion),
  appendActivity: (entry) => getStore().appendActivity(entry),
  listActivity: (sessionId, limit) => getStore().listActivity(sessionId, limit),
};

setInheritRuntime(
  createWorkflowRuntime({
    store,
    workflows: { get: getWorkflow },
    snapshot,
    decorateState,
    formatDraftValue: (field, value) =>
      field === "slotId" ? labelFromSlotId(String(value ?? "")) : value,
    shouldRecordDraftField: (field) =>
      field === "slotId" || field === "service" || field === "deliverable",
    applyProposalValues,
    getHandlers: createDemoHandlers,
  }),
);

export { getInheritRuntime };

export function getWorkflowState(sessionId?: string | null, workflowId?: string | null) {
  return getInheritRuntime().getState(sessionId, workflowId) as AppWorkflowState;
}

export function ensureSession(sessionId?: string | null, workflowId?: string | null) {
  return getInheritRuntime().ensureSession(sessionId, workflowId);
}

export function saveDraft(input: {
  sessionId: string;
  values: FormValues;
  actor: Actor;
  expectedVersion?: number;
}) {
  return getInheritRuntime().saveDraft(input) as AppWorkflowState;
}

export function submitWorkflowStep(input: {
  sessionId?: string;
  workflowId?: string;
  stepId: string;
  values: FormValues;
  actor: Actor;
  toolName?: string;
  expectedVersion?: number;
}) {
  const result = getInheritRuntime().submitStep(input);
  return { ...result, state: result.state as AppWorkflowState };
}

export function dispatchAction(input: {
  sessionId?: string;
  workflowId?: string;
  action: string;
  payload?: Record<string, unknown>;
  actor: Actor;
  toolName?: string;
  expectedVersion?: number;
}) {
  return getInheritRuntime().executeAction(input);
}

export const executeAction = dispatchAction;
export { spokenActor };

import {
  nextStepId,
  previousStepId,
  validateAll,
  validateStep,
  type FieldError,
  type FormValues,
} from "@/lib/form-definition";
import type { Actor, ProposalRecord, SessionRecord } from "@/lib/store";
import {
  bookSlot,
  cancelBooking,
  getBookingStatus,
  listAvailableSlots,
  rescheduleBooking,
  suggestBriefDeliverable,
  submitProjectBrief,
} from "@/lib/booking-service";
import { getAvailableTools } from "./capabilities";
import { snapshotFrom } from "./types";
import {
  bumpSession,
  ensureSession,
  getWorkflowState,
  mergeProvenance,
  recordActivity,
  spokenActor,
} from "./session";
import { getWorkflow } from "@/lib/workflows/registry";
import { getStore } from "@/lib/sqlite-store";
import { labelFromSlotId } from "@/lib/time";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function saveDraft(input: {
  sessionId: string;
  values: FormValues;
  actor: Actor;
  expectedVersion?: number;
}) {
  const session = ensureSession(input.sessionId);
  const changed = Object.entries(input.values).filter(
    ([key, value]) => session.values[key] !== value,
  );
  if (!changed.length) return getWorkflowState(session.id);

  const nextValues = { ...session.values, ...input.values };
  const proposedSlot =
    session.proposal?.action === "propose_slot" ? String(session.proposal.payload.slotId ?? "") : "";
  const humanSlot = typeof input.values.slotId === "string" ? input.values.slotId : "";
  const dropProposal = Boolean(proposedSlot && humanSlot && humanSlot !== proposedSlot);

  bumpSession(
    session,
    {
      values: nextValues,
      proposal: dropProposal ? null : session.proposal,
      provenance: mergeProvenance(session, input.values, input.actor, "input"),
    },
    input.expectedVersion,
  );
  for (const [field, value] of changed) {
    if (field === "slotId" || field === "service" || field === "deliverable") {
      const pretty = field === "slotId" ? labelFromSlotId(String(value ?? "")) : value;
      recordActivity({
        sessionId: session.id,
        actor: input.actor,
        action: "select_field",
        field,
        previousValue: session.values[field],
        nextValue: pretty,
        summary:
          field === "slotId"
            ? `${spokenActor(input.actor)} selected ${pretty}`
            : `${spokenActor(input.actor)} set ${field}`,
      });
    }
  }
  return getWorkflowState(session.id);
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
  const session = ensureSession(input.sessionId, input.workflowId);
  const workflow = getWorkflow(session.workflowId);
  const merged = { ...session.values, ...input.values };
  const errors = validateStep(input.stepId, merged, workflow.form);
  if (errors.length) {
    return { ok: false as const, errors, state: getWorkflowState(session.id) };
  }
  const completed = new Set(session.completedStepIds);
  completed.add(input.stepId);
  const upcoming = nextStepId(input.stepId, workflow.form);
  bumpSession(
    session,
    {
      values: merged,
      completedStepIds: [...completed],
      currentStepId: upcoming ?? input.stepId,
      provenance: mergeProvenance(session, input.values, input.actor, input.toolName ? "tool" : "input"),
    },
    input.expectedVersion,
  );
  const step = workflow.form.steps.find((item) => item.id === input.stepId);
  recordActivity({
    sessionId: session.id,
    actor: input.actor,
    action: "submit_step",
    toolName: input.toolName,
    summary: `${spokenActor(input.actor)} submitted ${step?.title ?? input.stepId}`,
  });
  return {
    ok: true as const,
    errors: [] as FieldError[],
    advancedTo: upcoming,
    completed: !upcoming,
    state: getWorkflowState(session.id),
  };
}

function createProposal(
  session: SessionRecord,
  input: {
    action: string;
    actor: Actor;
    summary: string;
    payload: Record<string, unknown>;
    toolName?: string;
    expectedVersion?: number;
  },
) {
  const proposal: ProposalRecord = {
    id: `pr_${crypto.randomUUID()}`,
    action: input.action,
    toolName: input.toolName,
    actor: input.actor,
    summary: input.summary,
    payload: input.payload,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  bumpSession(session, { proposal }, input.expectedVersion);
  recordActivity({
    sessionId: session.id,
    actor: input.actor,
    action: "propose",
    toolName: input.toolName,
    summary: input.summary,
  });
  return { ok: true as const, errors: [], proposal, state: getWorkflowState(session.id) };
}

type ActionOutcome = {
  ok: boolean;
  errors: FieldError[];
  state?: ReturnType<typeof getWorkflowState>;
  proposal?: ProposalRecord | null;
  [key: string]: unknown;
};

async function executeNamedAction(input: {
  session: SessionRecord;
  action: string;
  payload: Record<string, unknown>;
  actor: Actor;
  toolName?: string;
  expectedVersion?: number;
}): Promise<ActionOutcome> {
  const { session, action, payload, actor, toolName, expectedVersion } = input;
  const values = (payload.values as FormValues | undefined) ?? {};

  switch (action) {
    case "get_available_slots": {
      const listed = await listAvailableSlots({
        from: asString(payload.from),
        to: asString(payload.to),
      });
      if (actor === "agent") {
        recordActivity({
          sessionId: session.id,
          actor,
          action: "get_available_slots",
          toolName,
          summary: `ChatGPT checked ${listed.slots.length} available slots`,
        });
      }
      return {
        ok: true as const,
        errors: [],
        ...listed,
        state: getWorkflowState(session.id),
      };
    }
    case "get_booking_status": {
      const status = getBookingStatus({
        email: asString(payload.email) || String(session.values.email ?? ""),
        bookingId: asString(payload.bookingId) || session.bookingId || undefined,
      });
      return {
        ...status,
        errors: [],
        state: getWorkflowState(session.id),
      };
    }
    case "propose_slot": {
      const slotId = asString(payload.slotId);
      if (!slotId) {
        return {
          ok: false as const,
          errors: [{ fieldId: "slotId", message: "slotId is required." }],
          state: getWorkflowState(session.id),
        };
      }
      const listed = await listAvailableSlots();
      const slot = listed.slots.find((item) => item.id === slotId);
      if (!slot) {
        return {
          ok: false as const,
          errors: [{ fieldId: "slotId", message: "That slot is not available." }],
          state: getWorkflowState(session.id),
        };
      }
      return createProposal(session, {
        action: "propose_slot",
        actor,
        toolName,
        expectedVersion,
        payload: { slotId, label: slot.label },
        summary: `${spokenActor(actor)} proposed ${slot.label}`,
      });
    }
    case "book_slot": {
      const sessionSlot = String(session.values.slotId ?? "");
      const payloadSlot = asString(payload.slotId);
      const slotId = actor === "agent" ? sessionSlot || payloadSlot : payloadSlot || sessionSlot;
      return bookSlot({
        sessionId: session.id,
        slotId,
        values: { ...session.values, ...values },
        actor,
        expectedVersion,
        toolName,
      });
    }
    case "reschedule_booking":
      return rescheduleBooking({
        sessionId: session.id,
        slotId: asString(payload.slotId),
        actor,
        expectedVersion,
        toolName,
      });
    case "cancel_booking":
      return cancelBooking({
        sessionId: session.id,
        actor,
        expectedVersion,
        toolName,
      });
    case "suggest_deliverables":
      return suggestBriefDeliverable({ sessionId: session.id, actor, expectedVersion, toolName });
    case "identify_missing_information": {
      const workflow = getWorkflow(session.workflowId);
      const errors = validateAll(session.values, workflow.form);
      return {
        ok: true as const,
        errors: [],
        missing: errors.map((error) => error.fieldId),
        messages: errors.map((error) => error.message),
        state: getWorkflowState(session.id),
      };
    }
    case "submit_project_brief":
      return submitProjectBrief({
        sessionId: session.id,
        values,
        actor,
        expectedVersion,
        toolName,
      });
    case "get_brief_status":
      return { ok: true as const, errors: [], state: getWorkflowState(session.id) };
    case "commit_proposal":
      return commitProposal({ sessionId: session.id, actor, expectedVersion, toolName });
    case "reject_proposal": {
      if (!session.proposal) {
        return {
          ok: false as const,
          errors: [{ fieldId: "proposal", message: "No pending proposal." }],
          state: getWorkflowState(session.id),
        };
      }
      bumpSession(session, { proposal: null }, expectedVersion);
      recordActivity({
        sessionId: session.id,
        actor,
        action: "reject_proposal",
        toolName,
        summary: `${spokenActor(actor)} dismissed the proposal`,
      });
      return { ok: true as const, errors: [], state: getWorkflowState(session.id) };
    }
    default:
      return {
        ok: false as const,
        errors: [{ fieldId: "action", message: `Unknown action: ${action}` }],
        state: getWorkflowState(session.id),
      };
  }
}

export async function dispatchAction(input: {
  sessionId?: string;
  workflowId?: string;
  action: string;
  payload?: Record<string, unknown>;
  actor: Actor;
  toolName?: string;
  expectedVersion?: number;
}) {
  const session = ensureSession(input.sessionId, input.workflowId);
  const workflow = getWorkflow(session.workflowId);
  const store = getStore();
  const booking = session.bookingId ? store.getBooking(session.bookingId) : null;
  const payload = input.payload ?? {};
  const previewValues = {
    ...session.values,
    ...((payload.values as FormValues | undefined) ?? {}),
    ...(typeof payload.slotId === "string" ? { slotId: payload.slotId } : {}),
  };
  const snapshot = snapshotFrom({ ...session, values: previewValues }, booking);
  const tools = getAvailableTools(workflow, snapshot);
  const capability = tools.find((tool) => tool.name === input.action);
  if (!capability) {
    return {
      ok: false as const,
      errors: [
        {
          fieldId: "action",
          message: `${input.action} is not available in the current workflow state.`,
        },
      ],
      state: getWorkflowState(session.id),
    };
  }

  if (capability.requiresConfirmation && input.actor === "agent" && input.action !== "commit_proposal") {
    return createProposal(session, {
      action: input.action,
      actor: input.actor,
      toolName: input.toolName ?? input.action,
      expectedVersion: input.expectedVersion,
      payload,
      summary: `Agent wants to ${input.action.replaceAll("_", " ")}`,
    });
  }

  return executeNamedAction({
    session,
    action: input.action,
    payload,
    actor: input.actor,
    toolName: input.toolName ?? input.action,
    expectedVersion: input.expectedVersion,
  });
}

export async function commitProposal(input: {
  sessionId: string;
  actor: Actor;
  expectedVersion?: number;
  toolName?: string;
}): Promise<ActionOutcome> {
  const session = ensureSession(input.sessionId);
  const proposal = session.proposal;
  if (!proposal) {
    return {
      ok: false as const,
      errors: [{ fieldId: "proposal", message: "No pending proposal." }],
      state: getWorkflowState(session.id),
    };
  }

  if (proposal.action === "propose_slot") {
    const slotId = String(proposal.payload.slotId ?? "");
    const next = bumpSession(
      session,
      {
        proposal: null,
        values: { ...session.values, slotId },
        provenance: mergeProvenance(session, { slotId }, "agent", "proposal"),
      },
      input.expectedVersion,
    );
    recordActivity({
      sessionId: next.id,
      actor: input.actor,
      action: "accept_proposal",
      toolName: input.toolName,
      field: "slotId",
      nextValue: slotId,
      summary: `${spokenActor(input.actor)} accepted the proposed time`,
    });
    return { ok: true as const, errors: [], state: getWorkflowState(next.id) };
  }

  if (proposal.action === "suggest_deliverables") {
    const deliverable = String(proposal.payload.deliverable ?? "");
    bumpSession(
      session,
      {
        proposal: null,
        values: { ...session.values, deliverable },
        provenance: mergeProvenance(session, { deliverable }, "agent", "proposal"),
      },
      input.expectedVersion,
    );
    recordActivity({
      sessionId: session.id,
      actor: input.actor,
      action: "accept_proposal",
      field: "deliverable",
      nextValue: deliverable,
      summary: `${spokenActor(input.actor)} accepted the suggested deliverable`,
    });
    return { ok: true as const, errors: [], state: getWorkflowState(session.id) };
  }

  const cleared = bumpSession(session, { proposal: null }, input.expectedVersion);
  return executeNamedAction({
    session: cleared,
    action: proposal.action,
    payload: proposal.payload,
    actor: input.actor,
    toolName: input.toolName ?? proposal.toolName,
  });
}

export function previousStep(session: SessionRecord) {
  const workflow = getWorkflow(session.workflowId);
  return previousStepId(session.currentStepId, workflow.form);
}

export { getWorkflowState, ensureSession, spokenActor };

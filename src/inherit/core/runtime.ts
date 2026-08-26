import { nextStepId, validateStep, type FormValues } from "./form";
import type { Actor, ProposalRecord, SessionRecord } from "./models";
import { emptySession, mergeProvenance, nowIso, redact } from "./session";
import { getAvailableActions, capabilityNames } from "./capabilities";
import { StaleSessionError } from "./stale";
import { spokenActor } from "./actor";
import { projectForm } from "./form";
import type {
  ActionHandler,
  ActionResult,
  ActivityInput,
  CapabilitySnapshot,
  WorkflowRuntimeConfig,
  WorkflowState,
} from "./types";
import type { WorkflowStore } from "./store";

export class WorkflowRuntime {
  private readonly store: WorkflowStore;
  private readonly config: WorkflowRuntimeConfig;

  constructor(config: WorkflowRuntimeConfig) {
    this.store = config.store;
    this.config = config;
  }

  getWorkflow(workflowId?: string | null) {
    return this.config.workflows.get(workflowId);
  }

  getSession(id: string) {
    return this.store.getSession(id);
  }

  ensureSession(sessionId?: string | null, workflowId?: string | null) {
    const workflow = this.getWorkflow(workflowId);
    const id = sessionId?.trim() || crypto.randomUUID();
    const existing = this.store.getSession(id);
    if (existing) return existing;
    return this.store.upsertSession(emptySession(id, workflow));
  }

  bumpSession(
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
    return this.persistSession(next, expectedVersion ?? session.version);
  }

  recordActivity(input: ActivityInput) {
    return this.store.appendActivity({
      id: `act_${crypto.randomUUID()}`,
      timestamp: nowIso(),
      ...input,
      previousValue: redact(input.previousValue),
      nextValue: redact(input.nextValue),
    });
  }

  getActivity(sessionId: string, limit?: number) {
    return this.store.listActivity(sessionId, limit);
  }

  snapshot(session: SessionRecord): CapabilitySnapshot {
    return this.config.snapshot(session);
  }

  getAvailableActions(session: SessionRecord, extra?: CapabilitySnapshot) {
    return getAvailableActions(this.getWorkflow(session.workflowId), extra ?? this.snapshot(session));
  }

  getAvailableTools(session: SessionRecord, extra?: CapabilitySnapshot) {
    return this.getAvailableActions(session, extra);
  }

  validateAction(name: string, session: SessionRecord, extra?: CapabilitySnapshot) {
    const capability = this.getAvailableActions(session, extra).find((item) => item.name === name);
    if (!capability) {
      return { ok: false as const, error: `${name} is not available in the current workflow state.` };
    }
    return { ok: true as const, capability };
  }

  getState(sessionId?: string | null, workflowId?: string | null): WorkflowState {
    const session = this.ensureSession(sessionId, workflowId);
    const workflow = this.getWorkflow(session.workflowId);
    const capabilities = this.getAvailableActions(session);
    const state: WorkflowState = {
      workflow: {
        id: workflow.id,
        version: workflow.version,
        title: workflow.title,
        description: workflow.description,
        schemaToolName: workflow.schemaToolName,
        submitToolName: workflow.submitToolName,
      },
      form: projectForm(workflow.form),
      session: {
        id: session.id,
        workflowId: session.workflowId,
        currentStepId: session.currentStepId,
        values: session.values,
        completedStepIds: session.completedStepIds,
        recordId: session.recordId,
        version: session.version,
        provenance: session.provenance,
        status: session.values.submitted === true ? "submitted" : "in_progress",
      },
      proposal: session.proposal,
      capabilities,
      capabilityNames: capabilityNames(capabilities),
      activity: this.store.listActivity(session.id),
    };
    return this.config.decorateState ? this.config.decorateState(state) : state;
  }

  saveDraft(input: {
    sessionId: string;
    values: FormValues;
    actor: Actor;
    expectedVersion?: number;
  }) {
    const session = this.ensureSession(input.sessionId);
    const changed = Object.entries(input.values).filter(
      ([key, value]) => session.values[key] !== value,
    );
    if (!changed.length) return this.getState(session.id);

    const nextValues = { ...session.values, ...input.values };
    const proposal = session.proposal;
    const dropProposal = Boolean(
      proposal &&
        changed.some(([key, value]) => {
          if (!(key in proposal.payload)) return false;
          return String(proposal.payload[key] ?? "") !== String(value ?? "");
        }),
    );

    this.bumpSession(
      session,
      {
        values: nextValues,
        proposal: dropProposal ? null : session.proposal,
        provenance: mergeProvenance(session, input.values, input.actor, "input"),
      },
      input.expectedVersion,
    );

    const recordField = this.config.shouldRecordDraftField;
    for (const [field, value] of changed) {
      if (recordField && !recordField(field)) continue;
      const pretty = this.config.formatDraftValue
        ? this.config.formatDraftValue(field, value)
        : value;
      this.recordActivity({
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
    return this.getState(session.id);
  }

  submitStep(input: {
    sessionId?: string;
    workflowId?: string;
    stepId: string;
    values: FormValues;
    actor: Actor;
    toolName?: string;
    expectedVersion?: number;
  }) {
    const session = this.ensureSession(input.sessionId, input.workflowId);
    const workflow = this.getWorkflow(session.workflowId);
    const merged = { ...session.values, ...input.values };
    const errors = validateStep(input.stepId, merged, workflow.form);
    if (errors.length) {
      return { ok: false as const, errors, state: this.getState(session.id) };
    }
    const completed = new Set(session.completedStepIds);
    completed.add(input.stepId);
    const upcoming = nextStepId(input.stepId, workflow.form);
    this.bumpSession(
      session,
      {
        values: merged,
        completedStepIds: [...completed],
        currentStepId: upcoming ?? input.stepId,
        provenance: mergeProvenance(
          session,
          input.values,
          input.actor,
          input.toolName ? "tool" : "input",
        ),
      },
      input.expectedVersion,
    );
    const step = workflow.form.steps.find((item) => item.id === input.stepId);
    this.recordActivity({
      sessionId: session.id,
      actor: input.actor,
      action: "submit_step",
      toolName: input.toolName,
      summary: `${spokenActor(input.actor)} submitted ${step?.title ?? input.stepId}`,
    });
    return {
      ok: true as const,
      errors: [],
      advancedTo: upcoming,
      completed: !upcoming,
      state: this.getState(session.id),
    };
  }

  async executeAction(input: {
    sessionId?: string;
    workflowId?: string;
    action: string;
    payload?: Record<string, unknown>;
    actor: Actor;
    toolName?: string;
    expectedVersion?: number;
  }): Promise<ActionResult> {
    const session = this.ensureSession(input.sessionId, input.workflowId);
    const payload = input.payload ?? {};
    const preview = this.previewSession(session, payload);
    const extra = this.snapshot(preview);
    const capability = this.getAvailableActions(session, extra).find(
      (item) => item.name === input.action,
    );
    if (!capability) {
      return {
        ok: false,
        errors: [
          {
            fieldId: "action",
            message: `${input.action} is not available in the current workflow state.`,
          },
        ],
        state: this.getState(session.id),
      };
    }

    if (
      capability.requiresConfirmation &&
      input.actor === "agent" &&
      input.action !== "commit_proposal"
    ) {
      return this.createProposal(session, {
        action: input.action,
        actor: input.actor,
        toolName: input.toolName ?? input.action,
        expectedVersion: input.expectedVersion,
        payload,
        summary: `Agent wants to ${input.action.replaceAll("_", " ")}`,
      });
    }

    if (input.action === "commit_proposal") {
      return this.commitProposal({
        sessionId: session.id,
        actor: input.actor,
        expectedVersion: input.expectedVersion,
        toolName: input.toolName,
      });
    }

    if (input.action === "reject_proposal") {
      return this.rejectProposal({
        sessionId: session.id,
        actor: input.actor,
        expectedVersion: input.expectedVersion,
        toolName: input.toolName,
      });
    }

    const handler = this.config.getHandlers()[input.action];
    if (!handler) {
      return {
        ok: false,
        errors: [{ fieldId: "action", message: `Unknown action: ${input.action}` }],
        state: this.getState(session.id),
      };
    }

    return handler({
      session,
      payload,
      actor: input.actor,
      toolName: input.toolName ?? input.action,
      expectedVersion: input.expectedVersion,
    });
  }

  createProposal(
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
      createdAt: nowIso(),
    };
    this.bumpSession(session, { proposal }, input.expectedVersion);
    this.recordActivity({
      sessionId: session.id,
      actor: input.actor,
      action: "propose",
      toolName: input.toolName,
      summary: input.summary,
    });
    return { ok: true as const, errors: [], proposal, state: this.getState(session.id) };
  }

  async commitProposal(input: {
    sessionId: string;
    actor: Actor;
    expectedVersion?: number;
    toolName?: string;
  }): Promise<ActionResult> {
    const session = this.ensureSession(input.sessionId);
    const proposal = session.proposal;
    if (!proposal) {
      return {
        ok: false,
        errors: [{ fieldId: "proposal", message: "No pending proposal." }],
        state: this.getState(session.id),
      };
    }

    const applied = this.config.applyProposalValues?.(proposal) ?? null;
    if (applied) {
      this.bumpSession(
        session,
        {
          proposal: null,
          values: { ...session.values, ...applied.values },
          provenance: mergeProvenance(session, applied.values, "agent", "proposal"),
        },
        input.expectedVersion,
      );
      this.recordActivity({
        sessionId: session.id,
        actor: input.actor,
        action: "accept_proposal",
        toolName: input.toolName,
        field: applied.field,
        nextValue: applied.nextValue,
        summary: applied.summary,
      });
      return { ok: true, errors: [], state: this.getState(session.id) };
    }

    const cleared = this.bumpSession(session, { proposal: null }, input.expectedVersion);
    return this.runHandler(proposal.action, {
      session: cleared,
      payload: proposal.payload,
      actor: input.actor,
      toolName: input.toolName ?? proposal.toolName,
    });
  }

  rejectProposal(input: {
    sessionId: string;
    actor: Actor;
    expectedVersion?: number;
    toolName?: string;
  }): ActionResult {
    const session = this.ensureSession(input.sessionId);
    if (!session.proposal) {
      return {
        ok: false,
        errors: [{ fieldId: "proposal", message: "No pending proposal." }],
        state: this.getState(session.id),
      };
    }
    this.bumpSession(session, { proposal: null }, input.expectedVersion);
    this.recordActivity({
      sessionId: session.id,
      actor: input.actor,
      action: "reject_proposal",
      toolName: input.toolName,
      summary: `${spokenActor(input.actor)} dismissed the proposal`,
    });
    return { ok: true, errors: [], state: this.getState(session.id) };
  }

  private persistSession(next: SessionRecord, expectedVersion?: number) {
    if (expectedVersion !== undefined) {
      const written = this.store.compareAndSetSession(next, expectedVersion);
      if (!written) {
        const current = this.store.getSession(next.id);
        throw new StaleSessionError(expectedVersion, current?.version ?? expectedVersion);
      }
      return written;
    }
    return this.store.upsertSession(next);
  }

  private previewSession(session: SessionRecord, payload: Record<string, unknown>): SessionRecord {
    const nextValues: FormValues = { ...session.values };
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string" || typeof value === "boolean") {
        nextValues[key] = value;
      }
    }
    const nested = payload.values;
    if (nested && typeof nested === "object") {
      Object.assign(nextValues, nested as FormValues);
    }
    return { ...session, values: nextValues };
  }

  private runHandler(name: string, input: Parameters<ActionHandler>[0]) {
    const handler = this.config.getHandlers()[name];
    if (!handler) {
      return Promise.resolve({
        ok: false,
        errors: [{ fieldId: "action", message: `Unknown action: ${name}` }],
        state: this.getState(input.session.id),
      } satisfies ActionResult);
    }
    return handler(input);
  }
}

export function createWorkflowRuntime(config: WorkflowRuntimeConfig) {
  return new WorkflowRuntime(config);
}

export type { WorkflowRuntimeConfig };

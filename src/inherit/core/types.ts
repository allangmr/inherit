import type { FieldError, FormDefinition, FormValues, ProjectedForm } from "./form";
import type { JsonSchema } from "./json-schema";
import type { ActivityRecord, Actor, FieldProvenance, ProposalRecord, SessionRecord } from "./models";
import type { WorkflowRegistry, WorkflowStore } from "./store";

export type RecordStatus = "none" | "confirmed" | "cancelled";

export type CapabilitySnapshot = {
  workflowId: string;
  currentStepId: string;
  values: FormValues;
  completedStepIds: string[];
  recordStatus: RecordStatus;
  hasProposal: boolean;
};

export type Capability = {
  name: string;
  description: string;
  readOnly: boolean;
  requiresConfirmation: boolean;
  inputSchema: JsonSchema;
};

export type WorkflowAction = {
  name: string;
  description: string;
  readOnly: boolean;
  requiresConfirmation: boolean;
  inputSchema: JsonSchema;
  available: (snapshot: CapabilitySnapshot) => boolean;
};

export type WorkflowDefinition = {
  id: string;
  version: number;
  title: string;
  description: string;
  form: FormDefinition;
  schemaToolName: string;
  schemaToolDescription: string;
  submitToolName: string;
  submitToolDescription: string;
  submitAvailable: (snapshot: CapabilitySnapshot) => boolean;
  actions: WorkflowAction[];
};

export type WorkflowState = {
  workflow: {
    id: string;
    version: number;
    title: string;
    description: string;
    schemaToolName: string;
    submitToolName: string;
  };
  form: ProjectedForm;
  session: {
    id: string;
    workflowId: string;
    currentStepId: string;
    values: FormValues;
    completedStepIds: string[];
    recordId: string | null;
    version: number;
    provenance: Record<string, FieldProvenance>;
    status: string;
  };
  proposal: ProposalRecord | null;
  capabilities: Capability[];
  capabilityNames: string[];
  activity: ActivityRecord[];
};

export type ActionResult = {
  ok: boolean;
  errors: FieldError[];
  proposal?: ProposalRecord | null;
  state?: WorkflowState;
  [key: string]: unknown;
};

export type ActionHandler = (input: {
  session: SessionRecord;
  payload: Record<string, unknown>;
  actor: Actor;
  toolName?: string;
  expectedVersion?: number;
}) => ActionResult | Promise<ActionResult>;

export type ProposalApply = {
  values: FormValues;
  field?: string;
  nextValue?: unknown;
  summary: string;
};

export type WorkflowRuntimeConfig = {
  store: WorkflowStore;
  workflows: WorkflowRegistry;
  snapshot: (session: SessionRecord) => CapabilitySnapshot;
  decorateState?: (state: WorkflowState) => WorkflowState;
  formatDraftValue?: (field: string, value: unknown) => unknown;
  shouldRecordDraftField?: (field: string) => boolean;
  applyProposalValues?: (proposal: ProposalRecord) => ProposalApply | null;
  getHandlers: () => Record<string, ActionHandler>;
};

export type ActivityInput = {
  sessionId: string;
  actor: Actor;
  action: string;
  summary: string;
  field?: string;
  previousValue?: unknown;
  nextValue?: unknown;
  toolName?: string;
};

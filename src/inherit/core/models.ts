import type { FormValues } from "./form";

export type Actor = "human" | "agent" | "system";

export type FieldProvenance = {
  actor: Actor;
  at: string;
  source: "input" | "tool" | "proposal" | "system";
};

export type ProposalRecord = {
  id: string;
  action: string;
  toolName?: string;
  actor: Actor;
  summary: string;
  payload: Record<string, unknown>;
  status: "pending";
  createdAt: string;
};

export type ActivityRecord = {
  id: string;
  sessionId: string;
  timestamp: string;
  actor: Actor;
  action: string;
  field?: string;
  previousValue?: unknown;
  nextValue?: unknown;
  toolName?: string;
  summary: string;
};

export type SessionRecord = {
  id: string;
  workflowId: string;
  formId: string;
  currentStepId: string;
  values: FormValues;
  completedStepIds: string[];
  recordId: string | null;
  version: number;
  provenance: Record<string, FieldProvenance>;
  proposal: ProposalRecord | null;
  createdAt: string;
  updatedAt: string;
};

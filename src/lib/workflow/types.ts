import type { FormDefinition, FormValues, FieldError } from "@/lib/form-definition";
import type { Actor, BookingRecord, ProposalRecord, SessionRecord } from "@/lib/store";
import type { JsonSchema } from "@/types/webmcp";

export type BookingStatus = "none" | "confirmed" | "cancelled";

export type CapabilitySnapshot = {
  workflowId: string;
  currentStepId: string;
  values: FormValues;
  completedStepIds: string[];
  bookingStatus: BookingStatus;
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

export type MutationContext = {
  workflow: WorkflowDefinition;
  session: SessionRecord;
  booking: BookingRecord | null;
  actor: Actor;
  toolName?: string;
  expectedVersion?: number;
  values?: FormValues;
};

export type ActionResult = {
  ok: boolean;
  errors: FieldError[];
  proposal?: ProposalRecord | null;
  state?: unknown;
  [key: string]: unknown;
};

export function bookingStatusOf(booking: BookingRecord | null): BookingStatus {
  if (!booking) return "none";
  return booking.status === "cancelled" ? "cancelled" : "confirmed";
}

export function snapshotFrom(
  session: SessionRecord,
  booking: BookingRecord | null,
): CapabilitySnapshot {
  return {
    workflowId: session.workflowId,
    currentStepId: session.currentStepId,
    values: session.values,
    completedStepIds: session.completedStepIds,
    bookingStatus: bookingStatusOf(booking),
    hasProposal: Boolean(session.proposal),
  };
}

export function hasIdentity(values: FormValues) {
  return String(values.name ?? "").trim().length >= 2 && String(values.email ?? "").includes("@");
}

export function hasPreferences(values: FormValues) {
  return Boolean(values.service) && Boolean(values.format);
}

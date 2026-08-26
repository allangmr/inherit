import type { FormValues } from "./form";
import type { Actor, FieldProvenance, SessionRecord } from "./models";
import type { WorkflowDefinition } from "./types";

export function nowIso() {
  return new Date().toISOString();
}

export function redact(value: unknown) {
  if (typeof value !== "string") return value;
  if (value.includes("@") && value.includes(".")) return "[email]";
  return value;
}

export function emptySession(id: string, workflow: WorkflowDefinition): SessionRecord {
  return {
    id,
    workflowId: workflow.id,
    formId: workflow.form.id,
    currentStepId: workflow.form.steps[0].id,
    values: {},
    completedStepIds: [],
    recordId: null,
    version: 1,
    provenance: {},
    proposal: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
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

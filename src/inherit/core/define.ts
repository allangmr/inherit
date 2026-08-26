import type { WorkflowDefinition } from "./types";

export function defineWorkflow<T extends WorkflowDefinition>(definition: T): T {
  if (!definition.form.steps.length) {
    throw new Error(`Workflow ${definition.id} needs at least one step.`);
  }
  return definition;
}

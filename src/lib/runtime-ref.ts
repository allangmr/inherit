import type { WorkflowRuntime } from "@inherit/core";

let runtime: WorkflowRuntime | undefined;

export function getInheritRuntime(): WorkflowRuntime {
  if (!runtime) {
    throw new Error("Inherit runtime is not initialized.");
  }
  return runtime;
}

export function setInheritRuntime(next: WorkflowRuntime) {
  runtime = next;
}

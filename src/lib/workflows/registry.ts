import { bookingWorkflow } from "./booking";
import { briefWorkflow } from "./brief";
import type { WorkflowDefinition } from "@/lib/workflow/types";

const workflows: Record<string, WorkflowDefinition> = {
  booking: bookingWorkflow,
  brief: briefWorkflow,
};

export function getWorkflow(id: string | null | undefined): WorkflowDefinition {
  if (id && workflows[id]) return workflows[id];
  return bookingWorkflow;
}

export function listWorkflows() {
  return Object.values(workflows).map((workflow) => ({
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
  }));
}

export { bookingWorkflow, briefWorkflow };

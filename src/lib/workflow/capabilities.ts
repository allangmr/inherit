import type { Capability, CapabilitySnapshot, WorkflowDefinition } from "./types";

export function getAvailableTools(
  workflow: WorkflowDefinition,
  snapshot: CapabilitySnapshot,
): Capability[] {
  const tools: Capability[] = [
    {
      name: workflow.schemaToolName,
      description: workflow.schemaToolDescription,
      readOnly: true,
      requiresConfirmation: false,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          sessionId: { type: "string", description: "Existing session id. Omit to use the page session." },
        },
      },
    },
  ];

  if (workflow.submitAvailable(snapshot)) {
    tools.push({
      name: workflow.submitToolName,
      description: workflow.submitToolDescription,
      readOnly: false,
      requiresConfirmation: false,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["stepId", "values"],
        properties: {
          sessionId: { type: "string" },
          stepId: {
            type: "string",
            enum: workflow.form.steps.map((step) => step.id),
          },
          values: { type: "object", additionalProperties: true },
        },
      },
    });
  }

  for (const action of workflow.actions) {
    if (!action.available(snapshot)) continue;
    tools.push({
      name: action.name,
      description: action.description,
      readOnly: action.readOnly,
      requiresConfirmation: action.requiresConfirmation,
      inputSchema: action.inputSchema,
    });
  }

  return tools;
}

export function capabilityNames(tools: Capability[]) {
  return tools.map((tool) => tool.name);
}

export function capabilityDelta(previous: string[], next: string[]) {
  const prev = new Set(previous);
  const upcoming = new Set(next);
  return {
    added: next.filter((name) => !prev.has(name)),
    removed: previous.filter((name) => !upcoming.has(name)),
  };
}

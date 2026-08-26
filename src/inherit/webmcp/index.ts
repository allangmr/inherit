import type { Actor, Capability, JsonSchema } from "@inherit/core";
import type { ModelContext, ModelContextTool } from "@/types/webmcp";

export const INHERIT_STATE_EVENT = "inherit:state";
export const INHERIT_TOOL_EVENT = "inherit:tool";

export type WebMcpStatus = "ready" | "unavailable" | "registering" | "error";

export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const context = document.modelContext ?? navigator.modelContext ?? null;
  if (context && typeof context.registerTool === "function") return context;
  return null;
}

export function getModelContextTesting() {
  if (typeof navigator === "undefined") return null;
  return navigator.modelContextTesting ?? null;
}

export function probeWebMcp() {
  const producer = getModelContext();
  const testing = getModelContextTesting();
  return {
    secureContext: typeof window !== "undefined" && window.isSecureContext,
    documentModelContext: Boolean(typeof document !== "undefined" && document.modelContext),
    navigatorModelContext: Boolean(typeof navigator !== "undefined" && navigator.modelContext),
    registerTool: Boolean(producer && typeof producer.registerTool === "function"),
    getTools: Boolean(producer && typeof producer.getTools === "function"),
    executeTool: Boolean(producer && typeof producer.executeTool === "function"),
    testing: Boolean(testing),
    testingListTools: Boolean(
      testing && (typeof testing.listTools === "function" || typeof testing.getTools === "function"),
    ),
    testingExecuteTool: Boolean(testing && typeof testing.executeTool === "function"),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

export async function listRegisteredTools() {
  const producer = getModelContext();
  if (producer?.getTools) return producer.getTools();
  const testing = getModelContextTesting();
  if (testing?.getTools) return testing.getTools();
  if (testing?.listTools) return testing.listTools();
  return [];
}

export async function executeRegisteredTool(name: string, args: Record<string, unknown> = {}) {
  const input = JSON.stringify(args);
  const testing = getModelContextTesting();
  if (testing?.executeTool) {
    return testing.executeTool(name, input);
  }
  const producer = getModelContext();
  if (producer?.executeTool) {
    const tools = await listRegisteredTools();
    const match = tools.find((tool) => tool.name === name);
    if (!match) throw new Error(`Tool not found: ${name}`);
    return producer.executeTool(match, input);
  }
  throw new Error(
    "Chrome WebMCP consumer API is missing. Enable chrome://flags/#enable-webmcp-testing and relaunch.",
  );
}

export function isSecureContextForWebMcp() {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function broadcastFormState(detail: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INHERIT_STATE_EVENT, { detail }));
}

export type ToolTrace = {
  name: string;
  input: unknown;
  result: unknown;
  durationMs: number;
  actor: Actor;
  timestamp: string;
};

export function broadcastToolTrace(detail: ToolTrace) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INHERIT_TOOL_EVENT, { detail }));
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { signal?: AbortSignal; actor?: Actor } = {},
): Promise<T> {
  const { actor = "human", ...requestInit } = init;
  const response = await fetch(path, {
    ...requestInit,
    headers: {
      "content-type": "application/json",
      "x-inherit-actor": actor,
      ...(requestInit.headers ?? {}),
    },
    signal: requestInit.signal,
  });
  const data = (await response.json()) as T & { error?: string; ok?: boolean; errors?: unknown };
  if (!response.ok) {
    if (Array.isArray(data.errors) && data.errors.length) return data;
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export async function registerTools(
  tools: ModelContextTool[],
  options: { signal?: AbortSignal; exposedTo?: string[] } = {},
) {
  const context = getModelContext();
  if (!context) {
    return { supported: false as const, registered: 0 };
  }
  for (const tool of tools) {
    await context.registerTool(tool, {
      signal: options.signal,
      exposedTo: options.exposedTo,
    });
  }
  return { supported: true as const, registered: tools.length };
}

type SessionGetter = () => string;
type WorkflowGetter = () => string;

export type WebMcpAdapterConfig = {
  getSessionId: SessionGetter;
  getWorkflowId: WorkflowGetter;
  actor?: Actor;
  request?: typeof apiFetch;
};

function asArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function asSignal(extras: unknown) {
  if (extras && typeof extras === "object" && "signal" in extras) {
    return (extras as { signal?: AbortSignal }).signal;
  }
  return undefined;
}

function resultPayload(data: unknown) {
  return JSON.stringify(data);
}

export type WorkflowToolMeta = {
  schemaToolName: string;
  submitToolName: string;
};

const sessionSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: { sessionId: { type: "string" } },
};

const submitSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["stepId", "values"],
  properties: {
    sessionId: { type: "string" },
    stepId: { type: "string" },
    values: { type: "object", additionalProperties: true },
  },
};

export function createWebMcpAdapter(config: WebMcpAdapterConfig) {
  const actor: Actor = config.actor ?? "agent";
  const request = config.request ?? apiFetch;

  async function traced(name: string, raw: unknown, run: () => Promise<unknown>) {
    const started = performance.now();
    const input = asArgs(raw);
    try {
      const data = await run();
      broadcastToolTrace({
        name,
        input,
        result: data,
        durationMs: Math.round(performance.now() - started),
        actor,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      broadcastToolTrace({
        name,
        input,
        result: { error: error instanceof Error ? error.message : "failed" },
        durationMs: Math.round(performance.now() - started),
        actor,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async function syncAndReturn(data: unknown) {
    broadcastFormState(data);
    return resultPayload(data);
  }

  function sessionOf(args: Record<string, unknown>) {
    return String(args.sessionId ?? config.getSessionId());
  }

  function schemaTool(capability: Capability): ModelContextTool {
    return {
      name: capability.name,
      description: capability.description,
      annotations: { readOnlyHint: true },
      inputSchema: capability.inputSchema,
      execute: async (raw, extras) =>
        traced(capability.name, raw, async () => {
          const args = asArgs(raw);
          const sessionId = sessionOf(args);
          const workflowId = config.getWorkflowId();
          const data = await request(
            `/api/form/schema?sessionId=${encodeURIComponent(sessionId)}&workflowId=${encodeURIComponent(workflowId)}`,
            { signal: asSignal(extras), actor },
          );
          return syncAndReturn(data);
        }),
    };
  }

  function submitTool(capability: Capability): ModelContextTool {
    return {
      name: capability.name,
      description: capability.description,
      annotations: { readOnlyHint: false },
      inputSchema: capability.inputSchema,
      execute: async (raw, extras) =>
        traced(capability.name, raw, async () => {
          const args = asArgs(raw);
          const data = await request("/api/form/step", {
            method: "POST",
            signal: asSignal(extras),
            actor,
            body: JSON.stringify({
              sessionId: sessionOf(args),
              workflowId: config.getWorkflowId(),
              stepId: args.stepId,
              values: args.values ?? {},
            }),
          });
          return syncAndReturn(data);
        }),
    };
  }

  function actionTool(capability: Capability): ModelContextTool {
    return {
      name: capability.name,
      description: capability.description,
      annotations: { readOnlyHint: capability.readOnly },
      inputSchema: capability.inputSchema,
      execute: async (raw, extras) =>
        traced(capability.name, raw, async () => {
          const args = asArgs(raw);
          const payload = { ...args };
          delete payload.sessionId;
          const data = await request("/api/workflow/action", {
            method: "POST",
            signal: asSignal(extras),
            actor,
            body: JSON.stringify({
              sessionId: sessionOf(args),
              workflowId: config.getWorkflowId(),
              action: capability.name,
              payload: Object.keys(payload).length ? payload : args,
            }),
          });
          if (!capability.readOnly) return syncAndReturn(data);
          if (data && typeof data === "object" && "state" in data) return syncAndReturn(data);
          return resultPayload(data);
        }),
    };
  }

  function fallbackCapabilities(meta: WorkflowToolMeta): Capability[] {
    return [
      {
        name: meta.schemaToolName,
        description: "Return the workflow, current values, capabilities, and activity.",
        readOnly: true,
        requiresConfirmation: false,
        inputSchema: sessionSchema,
      },
      {
        name: meta.submitToolName,
        description: "Validate and persist one step, then advance. Same path as the human UI.",
        readOnly: false,
        requiresConfirmation: false,
        inputSchema: submitSchema,
      },
    ];
  }

  function toolsFrom(capabilities: Capability[], meta: WorkflowToolMeta): ModelContextTool[] {
    const source = capabilities.length ? capabilities : fallbackCapabilities(meta);
    return source.map((capability) => {
      if (capability.name === meta.schemaToolName) return schemaTool(capability);
      if (capability.name === meta.submitToolName) return submitTool(capability);
      return actionTool(capability);
    });
  }

  return { toolsFrom };
}

export async function registerWorkflowTools(
  adapter: ReturnType<typeof createWebMcpAdapter>,
  capabilities: Capability[],
  meta: WorkflowToolMeta,
  options?: { signal?: AbortSignal; exposedTo?: string[] },
) {
  return registerTools(adapter.toolsFrom(capabilities, meta), options);
}

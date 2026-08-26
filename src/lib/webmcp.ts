import type { ModelContext, ModelContextTool } from "@/types/webmcp";

export const INHERIT_STATE_EVENT = "inherit:state";

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
  // Chrome 146–149: navigator.modelContextTesting.executeTool(name, json)
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

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: init.signal,
  });
  const data = (await response.json()) as T & { error?: string; ok?: boolean };
  if (!response.ok && data.ok !== false && !("errors" in (data as object))) {
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

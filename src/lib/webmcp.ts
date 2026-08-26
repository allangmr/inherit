import type { ModelContext, ModelContextTool } from "@/types/webmcp";

export const INHERIT_STATE_EVENT = "inherit:state";

export type WebMcpStatus = "ready" | "unavailable" | "registering" | "error";

export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const context = document.modelContext ?? navigator.modelContext ?? null;
  if (context && typeof context.registerTool === "function") return context;
  return null;
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ActivityRecord, Capability, FieldProvenance, ProposalRecord } from "@inherit/core";
import { reconcilePolledState } from "./reconcile";

const EMPTY_CAPABILITIES: Capability[] = [];
const EMPTY_ACTIVITY: ActivityRecord[] = [];

export const WORKFLOW_STATE_EVENT = "inherit:state";
export const WORKFLOW_TOOL_EVENT = "inherit:tool";

export type ClientWorkflowState = {
  workflow: {
    id: string;
    version: number;
    title: string;
    description: string;
    schemaToolName?: string;
    submitToolName?: string;
  };
  form: {
    id: string;
    title: string;
    description: string;
    steps: Array<{
      id: string;
      title: string;
      subtitle: string;
      fields: Array<{
        id: string;
        type: string;
        label: string;
        hint?: string;
        placeholder?: string;
        options?: Array<{ value: string; label: string; description?: string }>;
      }>;
    }>;
  };
  session: {
    id: string;
    workflowId: string;
    currentStepId: string;
    values: Record<string, string | boolean | undefined>;
    completedStepIds: string[];
    bookingId: string | null;
    recordId?: string | null;
    version: number;
    provenance: Record<string, FieldProvenance>;
    status: string;
  };
  booking?: {
    id: string;
    label?: string;
    start: string;
    end: string;
    name: string;
    email: string;
    slotId: string;
    status: string;
    calendarEventId: string;
    calendarProvider: string;
  } | null;
  proposal?: ProposalRecord | null;
  capabilities?: Capability[];
  capabilityNames?: string[];
  activity?: ActivityRecord[];
};

type InheritContextValue = {
  workflowId: string;
  sessionKey?: string;
  sessionId: string;
  boot: boolean;
  state: ClientWorkflowState | null;
  applyState: (payload: unknown) => void;
  setState: Dispatch<SetStateAction<ClientWorkflowState | null>>;
};

const InheritContext = createContext<InheritContextValue | null>(null);

function readSessionId(namespace?: string) {
  if (typeof window === "undefined") return "";
  const key = namespace ? `inherit.sessionId.${namespace}` : "inherit.sessionId";
  const fromUrl = new URLSearchParams(window.location.search).get("session");
  if (fromUrl && !namespace) {
    window.sessionStorage.setItem(key, fromUrl);
    return fromUrl;
  }
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

function writeSessionId(id: string, namespace?: string) {
  if (typeof window === "undefined") return;
  const key = namespace ? `inherit.sessionId.${namespace}` : "inherit.sessionId";
  window.sessionStorage.setItem(key, id);
}

export function extractState(payload: unknown): ClientWorkflowState | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const nested = (root.state ?? root) as Record<string, unknown>;
  const session = nested.session as ClientWorkflowState["session"] | undefined;
  if (!session?.id) return null;
  return nested as unknown as ClientWorkflowState;
}

async function loadJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-inherit-actor": "human",
      ...(init?.headers ?? {}),
    },
  });
  return (await response.json()) as T;
}

export function InheritProvider({
  workflowId = "booking",
  sessionKey,
  children,
}: {
  workflowId?: string;
  sessionKey?: string;
  children: ReactNode;
}) {
  const sessionId = useSyncExternalStore(
    () => () => {},
    () => readSessionId(sessionKey),
    () => "",
  );
  const [state, setState] = useState<ClientWorkflowState | null>(null);
  const [boot, setBoot] = useState(true);

  const applyState = useCallback(
    (payload: unknown) => {
      const next = extractState(payload);
      if (!next?.session?.id) return;
      writeSessionId(next.session.id, sessionKey);
      setState(next);
    },
    [sessionKey],
  );

  useEffect(() => {
    const id = readSessionId(sessionKey);
    let cancelled = false;
    void loadJson<ClientWorkflowState>(
      `/api/form/schema?sessionId=${encodeURIComponent(id)}&workflowId=${encodeURIComponent(workflowId)}`,
    )
      .then((schema) => {
        if (!cancelled) applyState(schema);
      })
      .finally(() => {
        if (!cancelled) setBoot(false);
      });

    const onSync = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const next = extractState(detail);
      if (next && next.session.id !== id && next.session.id !== sessionId) return;
      applyState(detail);
    };
    window.addEventListener(WORKFLOW_STATE_EVENT, onSync);
    return () => {
      cancelled = true;
      window.removeEventListener(WORKFLOW_STATE_EVENT, onSync);
    };
  }, [applyState, sessionKey, workflowId, sessionId]);

  useEffect(() => {
    if (!sessionId || boot) return;
    const tick = window.setInterval(() => {
      void loadJson<ClientWorkflowState>(
        `/api/form/schema?sessionId=${encodeURIComponent(sessionId)}&workflowId=${encodeURIComponent(workflowId)}`,
      ).then((schema) => {
        const next = extractState(schema);
        if (!next) return;
        setState((current) => {
          const reconciled = reconcilePolledState(current, next);
          if (reconciled === current) return current;
          writeSessionId(reconciled.session.id, sessionKey);
          return reconciled;
        });
      });
    }, 2000);
    return () => window.clearInterval(tick);
  }, [sessionId, boot, workflowId, sessionKey]);

  const value = useMemo<InheritContextValue>(
    () => ({
      workflowId,
      sessionKey,
      sessionId,
      boot,
      state,
      applyState,
      setState,
    }),
    [workflowId, sessionKey, sessionId, boot, state, applyState],
  );

  return <InheritContext.Provider value={value}>{children}</InheritContext.Provider>;
}

function useInheritContext() {
  const context = useContext(InheritContext);
  if (!context) {
    throw new Error("Inherit React bindings require <InheritProvider>.");
  }
  return context;
}

export function useWorkflow() {
  const { workflowId, state } = useInheritContext();
  return {
    workflowId,
    workflow: state?.workflow ?? null,
    form: state?.form ?? null,
    title: state?.workflow.title ?? state?.form.title,
    description: state?.workflow.description ?? state?.form.description,
  };
}

export function useSession() {
  const ctx = useInheritContext();
  return {
    sessionId: ctx.sessionId,
    boot: ctx.boot,
    state: ctx.state,
    session: ctx.state?.session ?? null,
    proposal: ctx.state?.proposal ?? null,
    applyState: ctx.applyState,
    setState: ctx.setState,
  };
}

export function useAvailableActions() {
  const { state } = useInheritContext();
  return state?.capabilities ?? EMPTY_CAPABILITIES;
}

export function useActivity() {
  const { state } = useInheritContext();
  return state?.activity ?? EMPTY_ACTIVITY;
}

export { InheritContext, useInheritContext, reconcilePolledState };

"use client";

import type { Actor } from "@/lib/store";
import type { ModelContextTool } from "@/types/webmcp";
import {
  apiFetch,
  broadcastFormState,
  broadcastToolTrace,
} from "./webmcp";

type SessionGetter = () => string;
type WorkflowGetter = () => string;

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

async function traced(
  name: string,
  raw: unknown,
  run: () => Promise<unknown>,
) {
  const started = performance.now();
  const input = asArgs(raw);
  try {
    const data = await run();
    broadcastToolTrace({
      name,
      input,
      result: data,
      durationMs: Math.round(performance.now() - started),
      actor: "agent",
      timestamp: new Date().toISOString(),
    });
    return data;
  } catch (error) {
    broadcastToolTrace({
      name,
      input,
      result: { error: error instanceof Error ? error.message : "failed" },
      durationMs: Math.round(performance.now() - started),
      actor: "agent",
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

async function syncAndReturn(data: unknown) {
  broadcastFormState(data);
  return resultPayload(data);
}

function sessionOf(args: Record<string, unknown>, getSessionId: SessionGetter) {
  return String(args.sessionId ?? getSessionId());
}

export function createWorkflowTools(
  getSessionId: SessionGetter,
  getWorkflowId: WorkflowGetter = () => "booking",
): ModelContextTool[] {
  const actor: Actor = "agent";

  const actionTool = (
    name: string,
    description: string,
    readOnly: boolean,
    inputSchema: ModelContextTool["inputSchema"],
  ): ModelContextTool => ({
    name,
    description,
    annotations: { readOnlyHint: readOnly },
    inputSchema,
    execute: async (raw, extras) =>
      traced(name, raw, async () => {
        const args = asArgs(raw);
        const signal = asSignal(extras);
        const payload = { ...args };
        delete payload.sessionId;
        const data = await apiFetch("/api/workflow/action", {
          method: "POST",
          signal,
          actor,
          body: JSON.stringify({
            sessionId: sessionOf(args, getSessionId),
            workflowId: getWorkflowId(),
            action: name,
            payload: Object.keys(payload).length ? payload : args,
          }),
        });
        if (!readOnly) return syncAndReturn(data);
        if (data && typeof data === "object" && "state" in data) return syncAndReturn(data);
        return resultPayload(data);
      }),
  });

  return [
    {
      name: "get_form_schema",
      description:
        "Return the workflow: steps, fields, validation, current values, capabilities, and activity.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
      execute: async (raw, extras) =>
        traced("get_form_schema", raw, async () => {
          const args = asArgs(raw);
          const signal = asSignal(extras);
          const sessionId = sessionOf(args, getSessionId);
          const workflowId = getWorkflowId();
          const data = await apiFetch(
            `/api/form/schema?sessionId=${encodeURIComponent(sessionId)}&workflowId=${encodeURIComponent(workflowId)}`,
            { signal, actor },
          );
          return syncAndReturn(data);
        }),
    },
    {
      name: "get_brief_schema",
      description:
        "Return the creative brief workflow, current values, missing fields, and available capabilities.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
      execute: async (raw, extras) =>
        traced("get_brief_schema", raw, async () => {
          const args = asArgs(raw);
          const signal = asSignal(extras);
          const sessionId = sessionOf(args, getSessionId);
          const data = await apiFetch(
            `/api/form/schema?sessionId=${encodeURIComponent(sessionId)}&workflowId=brief`,
            { signal, actor },
          );
          return syncAndReturn(data);
        }),
    },
    {
      name: "submit_step",
      description:
        "Validate and persist one step of the form, then advance. Same path as the human UI.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["stepId", "values"],
        properties: {
          sessionId: { type: "string" },
          stepId: { type: "string" },
          values: { type: "object", additionalProperties: true },
        },
      },
      execute: async (raw, extras) =>
        traced("submit_step", raw, async () => {
          const args = asArgs(raw);
          const signal = asSignal(extras);
          const data = await apiFetch("/api/form/step", {
            method: "POST",
            signal,
            actor,
            body: JSON.stringify({
              sessionId: sessionOf(args, getSessionId),
              workflowId: getWorkflowId(),
              stepId: args.stepId,
              values: args.values ?? {},
            }),
          });
          return syncAndReturn(data);
        }),
    },
    {
      name: "update_brief",
      description: "Validate and persist one step of the creative brief, then advance.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["stepId", "values"],
        properties: {
          sessionId: { type: "string" },
          stepId: { type: "string" },
          values: { type: "object", additionalProperties: true },
        },
      },
      execute: async (raw, extras) =>
        traced("update_brief", raw, async () => {
          const args = asArgs(raw);
          const signal = asSignal(extras);
          const data = await apiFetch("/api/form/step", {
            method: "POST",
            signal,
            actor,
            body: JSON.stringify({
              sessionId: sessionOf(args, getSessionId),
              workflowId: "brief",
              stepId: args.stepId,
              values: args.values ?? {},
            }),
          });
          return syncAndReturn(data);
        }),
    },
    actionTool("get_available_slots", "List 30-minute slots with remaining capacity.", true, {
      type: "object",
      additionalProperties: false,
      properties: {
        from: { type: "string" },
        to: { type: "string" },
      },
    }),
    actionTool("propose_slot", "Propose a slot without booking it.", false, {
      type: "object",
      additionalProperties: false,
      required: ["slotId"],
      properties: {
        sessionId: { type: "string" },
        slotId: { type: "string" },
        note: { type: "string" },
      },
    }),
    actionTool("book_slot", "Book the selected or provided slot.", false, {
      type: "object",
      additionalProperties: false,
      properties: {
        sessionId: { type: "string" },
        slotId: { type: "string" },
        values: { type: "object", additionalProperties: true },
      },
    }),
    actionTool("get_booking_status", "Look up bookings by email or booking id.", true, {
      type: "object",
      additionalProperties: false,
      properties: {
        email: { type: "string", format: "email" },
        bookingId: { type: "string" },
      },
    }),
    actionTool("reschedule_booking", "Move a confirmed booking to another free slot.", false, {
      type: "object",
      additionalProperties: false,
      required: ["slotId"],
      properties: {
        sessionId: { type: "string" },
        slotId: { type: "string" },
      },
    }),
    actionTool("cancel_booking", "Cancel the confirmed booking. May require human confirmation.", false, {
      type: "object",
      additionalProperties: false,
      properties: { sessionId: { type: "string" } },
    }),
    actionTool("suggest_deliverables", "Suggest a primary deliverable from the goal text.", false, {
      type: "object",
      additionalProperties: false,
      properties: { sessionId: { type: "string" } },
    }),
    actionTool("identify_missing_information", "List required brief fields that are still empty.", true, {
      type: "object",
      additionalProperties: false,
      properties: { sessionId: { type: "string" } },
    }),
    actionTool("submit_project_brief", "Lock the creative brief.", false, {
      type: "object",
      additionalProperties: false,
      properties: {
        sessionId: { type: "string" },
        values: { type: "object", additionalProperties: true },
      },
    }),
    actionTool("get_brief_status", "Return whether the brief is in progress or submitted.", true, {
      type: "object",
      additionalProperties: false,
      properties: { sessionId: { type: "string" } },
    }),
    actionTool("commit_proposal", "Commit the pending proposal on this session.", false, {
      type: "object",
      additionalProperties: false,
      properties: { sessionId: { type: "string" } },
    }),
    actionTool("reject_proposal", "Dismiss the pending proposal.", false, {
      type: "object",
      additionalProperties: false,
      properties: { sessionId: { type: "string" } },
    }),
  ];
}

export function createInheritTools(getSessionId: SessionGetter) {
  return createWorkflowTools(getSessionId, () => "booking");
}

export function toolsNamed(tools: ModelContextTool[], names: string[]) {
  const allow = new Set(names);
  return tools.filter((tool) => allow.has(tool.name));
}

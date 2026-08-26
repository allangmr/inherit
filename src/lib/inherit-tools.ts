"use client";

import type { ModelContextTool } from "@/types/webmcp";
import { apiFetch, broadcastFormState } from "./webmcp";

type SessionGetter = () => string;

function resultPayload(data: unknown) {
  return JSON.stringify(data);
}

async function syncAndReturn(data: unknown) {
  broadcastFormState(data);
  return resultPayload(data);
}

export function createInheritTools(getSessionId: SessionGetter): ModelContextTool[] {
  return [
    {
      name: "get_form_schema",
      description:
        "Return the full multi-step Inherit booking form: steps, fields, validation rules, and the current session values. Call this first to see what the human has already entered and which step is active.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          sessionId: {
            type: "string",
            description:
              "Existing form session id. Omit to use the session already open on this page.",
          },
        },
      },
      execute: async (args, { signal }) => {
        const sessionId = String(args.sessionId ?? getSessionId());
        const data = await apiFetch(`/api/form/schema?sessionId=${encodeURIComponent(sessionId)}`, {
          signal,
        });
        return syncAndReturn(data);
      },
    },
    {
      name: "get_available_slots",
      description:
        "List 30-minute consult slots that still have remaining capacity (default max 3 bookings per slot). Occupied/full slots are omitted from `slots`. Use ISO-8601 from/to to narrow the window.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          from: {
            type: "string",
            description: "ISO-8601 start of the search window. Defaults to now.",
          },
          to: {
            type: "string",
            description: "ISO-8601 end of the search window.",
          },
        },
      },
      execute: async (args, { signal }) => {
        const params = new URLSearchParams();
        if (args.from) params.set("from", String(args.from));
        if (args.to) params.set("to", String(args.to));
        const data = await apiFetch(`/api/slots?${params.toString()}`, { signal });
        return resultPayload(data);
      },
    },
    {
      name: "submit_step",
      description:
        "Validate and persist one step of the form, then advance to the next step. Use stepId identity | need | slot | confirm. Values must satisfy that step's validation rules from get_form_schema. After success, the on-page form updates to the same state.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["stepId", "values"],
        properties: {
          sessionId: {
            type: "string",
            description: "Form session id. Omit to use the page session.",
          },
          stepId: {
            type: "string",
            enum: ["identity", "need", "slot", "confirm"],
            description: "Which step to submit.",
          },
          values: {
            type: "object",
            description:
              "Field values for this step. identity: name, email, phone. need: service (first_consult|follow_up|focused), format (studio|video), notes. slot: slotId. confirm: consent (true).",
            additionalProperties: true,
          },
        },
      },
      execute: async (args, { signal }) => {
        const data = await apiFetch("/api/form/step", {
          method: "POST",
          signal,
          body: JSON.stringify({
            sessionId: args.sessionId ?? getSessionId(),
            stepId: args.stepId,
            values: args.values ?? {},
          }),
        });
        return syncAndReturn(data);
      },
    },
    {
      name: "book_slot",
      description:
        "Book a 30-minute consult: create the calendar event, persist the submission, and mark the session complete. Requires a free slotId from get_available_slots plus guest name and email (from the session or passed in values). The on-page form jumps to the confirmation state.",
      annotations: { readOnlyHint: false },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["slotId"],
        properties: {
          sessionId: {
            type: "string",
            description: "Form session id. Omit to use the page session.",
          },
          slotId: {
            type: "string",
            description: "Id from get_available_slots, e.g. slot-20260827-0930.",
          },
          values: {
            type: "object",
            description:
              "Optional overrides merged into the session: name, email, phone, service, format, notes, consent.",
            additionalProperties: true,
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              phone: { type: "string" },
              service: {
                type: "string",
                enum: ["first_consult", "follow_up", "focused"],
              },
              format: { type: "string", enum: ["studio", "video"] },
              notes: { type: "string" },
              consent: { type: "boolean" },
            },
          },
        },
      },
      execute: async (args, { signal }) => {
        const data = await apiFetch("/api/book", {
          method: "POST",
          signal,
          body: JSON.stringify({
            sessionId: args.sessionId ?? getSessionId(),
            slotId: args.slotId,
            values: args.values ?? {},
          }),
        });
        return syncAndReturn(data);
      },
    },
    {
      name: "get_booking_status",
      description:
        "Look up confirmed bookings by email or booking id. Returns slot time, calendar event id, and stored submission fields.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "Guest email used when booking.",
          },
          bookingId: {
            type: "string",
            description: "Booking id returned by book_slot, e.g. bk_…",
          },
        },
      },
      execute: async (args, { signal }) => {
        if (!args.email && !args.bookingId) {
          return resultPayload({
            ok: false,
            error: "Provide email or bookingId.",
          });
        }
        const params = new URLSearchParams();
        if (args.email) params.set("email", String(args.email));
        if (args.bookingId) params.set("bookingId", String(args.bookingId));
        const data = await apiFetch(`/api/booking?${params.toString()}`, { signal });
        return resultPayload(data);
      },
    },
  ];
}

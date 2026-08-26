import { formDefinition } from "@/lib/form-definition";
import { defineWorkflow, type FormValues } from "@inherit/core";

export function hasIdentity(values: FormValues) {
  return String(values.name ?? "").trim().length >= 2 && String(values.email ?? "").includes("@");
}

export const bookingWorkflow = defineWorkflow({
  id: "booking",
  version: 1,
  title: formDefinition.title,
  description: formDefinition.description,
  form: formDefinition,
  schemaToolName: "get_form_schema",
  schemaToolDescription:
    "Return the booking workflow: steps, fields, validation, current session values, available capabilities, and activity. Call this first.",
  submitToolName: "submit_step",
  submitToolDescription:
    "Validate and persist one step, then advance. Same path as the human UI. Use stepId identity | need | slot | confirm.",
  submitAvailable: (snapshot) => snapshot.recordStatus !== "confirmed",
  actions: [
    {
      name: "get_available_slots",
      description:
        "List 30-minute consult slots that still have remaining capacity. Occupied/full slots are omitted. Available once name and email exist on the session.",
      readOnly: true,
      requiresConfirmation: false,
      available: (snapshot) =>
        hasIdentity(snapshot.values) || snapshot.recordStatus !== "none",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          from: { type: "string", description: "ISO-8601 start of the search window." },
          to: { type: "string", description: "ISO-8601 end of the search window." },
        },
      },
    },
    {
      name: "propose_slot",
      description:
        "Propose a slot to the human without booking it. The UI shows the suggestion. The human can pick a different time.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) =>
        hasIdentity(snapshot.values) && snapshot.recordStatus !== "confirmed",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["slotId"],
        properties: {
          sessionId: { type: "string" },
          slotId: { type: "string", description: "Id from get_available_slots." },
          note: { type: "string", description: "Optional reason shown in the activity rail." },
        },
      },
    },
    {
      name: "book_slot",
      description:
        "Book the consult using the shared session. If the human already selected a slot, that value wins over a slotId in this call. Requires name and email.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) =>
        hasIdentity(snapshot.values) && snapshot.recordStatus !== "confirmed",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          sessionId: { type: "string" },
          slotId: { type: "string" },
          values: { type: "object", additionalProperties: true },
        },
      },
    },
    {
      name: "get_booking_status",
      description: "Look up bookings by email or booking id.",
      readOnly: true,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.recordStatus !== "none",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email" },
          bookingId: { type: "string" },
        },
      },
    },
    {
      name: "reschedule_booking",
      description:
        "Move an existing confirmed booking to a different free slot. Updates the shared session so the open page follows.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.recordStatus === "confirmed",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["slotId"],
        properties: {
          sessionId: { type: "string" },
          slotId: { type: "string" },
        },
      },
    },
    {
      name: "cancel_booking",
      description: "Cancel the confirmed booking. Agent calls create a proposal the human can confirm.",
      readOnly: false,
      requiresConfirmation: true,
      available: (snapshot) => snapshot.recordStatus === "confirmed",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          sessionId: { type: "string" },
        },
      },
    },
    {
      name: "commit_proposal",
      description: "Commit the pending proposal on this session.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.hasProposal,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
    {
      name: "reject_proposal",
      description: "Dismiss the pending proposal without changing the booking.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.hasProposal,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
  ],
});

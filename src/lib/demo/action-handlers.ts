import type { ActionHandler, FormValues } from "@inherit/core";
import { spokenActor, validateAll } from "@inherit/core";
import {
  bookSlot,
  cancelBooking,
  getBookingStatus,
  listAvailableSlots,
  rescheduleBooking,
  suggestBriefDeliverable,
  submitProjectBrief,
} from "../booking-service";
import { getInheritRuntime } from "../runtime-ref";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createDemoHandlers(): Record<string, ActionHandler> {
  const runtime = () => getInheritRuntime();

  return {
    async get_available_slots({ session, payload, actor, toolName }) {
      const listed = await listAvailableSlots({
        from: asString(payload.from),
        to: asString(payload.to),
      });
      if (actor === "agent") {
        runtime().recordActivity({
          sessionId: session.id,
          actor,
          action: "get_available_slots",
          toolName,
          summary: `ChatGPT checked ${listed.slots.length} available slots`,
        });
      }
      return {
        ok: true,
        errors: [],
        ...listed,
        state: runtime().getState(session.id),
      };
    },

    get_booking_status({ session, payload }) {
      const status = getBookingStatus({
        email: asString(payload.email) || String(session.values.email ?? ""),
        bookingId: asString(payload.bookingId) || session.recordId || undefined,
      });
      return {
        ...status,
        errors: [],
        state: runtime().getState(session.id),
      };
    },

    async propose_slot({ session, payload, actor, toolName, expectedVersion }) {
      const slotId = asString(payload.slotId);
      if (!slotId) {
        return {
          ok: false,
          errors: [{ fieldId: "slotId", message: "slotId is required." }],
          state: runtime().getState(session.id),
        };
      }
      const listed = await listAvailableSlots();
      const slot = listed.slots.find((item) => item.id === slotId);
      if (!slot) {
        return {
          ok: false,
          errors: [{ fieldId: "slotId", message: "That slot is not available." }],
          state: runtime().getState(session.id),
        };
      }
      return runtime().createProposal(session, {
        action: "propose_slot",
        actor,
        toolName,
        expectedVersion,
        payload: { slotId, label: slot.label },
        summary: `${spokenActor(actor)} proposed ${slot.label}`,
      });
    },

    book_slot({ session, payload, actor, expectedVersion, toolName }) {
      const values = (payload.values as FormValues | undefined) ?? {};
      const sessionSlot = String(session.values.slotId ?? "");
      const payloadSlot = asString(payload.slotId);
      const slotId = actor === "agent" ? sessionSlot || payloadSlot : payloadSlot || sessionSlot;
      return bookSlot({
        sessionId: session.id,
        slotId,
        values: { ...session.values, ...values },
        actor,
        expectedVersion,
        toolName,
      });
    },

    reschedule_booking({ session, payload, actor, expectedVersion, toolName }) {
      return rescheduleBooking({
        sessionId: session.id,
        slotId: asString(payload.slotId),
        actor,
        expectedVersion,
        toolName,
      });
    },

    cancel_booking({ session, actor, expectedVersion, toolName }) {
      return cancelBooking({
        sessionId: session.id,
        actor,
        expectedVersion,
        toolName,
      });
    },

    suggest_deliverables({ session, actor, expectedVersion, toolName }) {
      return suggestBriefDeliverable({
        sessionId: session.id,
        actor,
        expectedVersion,
        toolName,
      });
    },

    identify_missing_information({ session }) {
      const workflow = runtime().getWorkflow(session.workflowId);
      const errors = validateAll(session.values, workflow.form);
      return {
        ok: true,
        errors: [],
        missing: errors.map((error) => error.fieldId),
        messages: errors.map((error) => error.message),
        state: runtime().getState(session.id),
      };
    },

    submit_project_brief({ session, payload, actor, expectedVersion, toolName }) {
      const values = (payload.values as FormValues | undefined) ?? {};
      return submitProjectBrief({
        sessionId: session.id,
        values,
        actor,
        expectedVersion,
        toolName,
      });
    },

    get_brief_status({ session }) {
      return { ok: true, errors: [], state: runtime().getState(session.id) };
    },
  };
}

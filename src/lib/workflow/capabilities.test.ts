import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAvailableTools, capabilityDelta } from "./capabilities";
import { bookingWorkflow } from "../workflows/booking";
import { briefWorkflow } from "../workflows/brief";
import type { CapabilitySnapshot } from "./types";

function snap(overrides: Partial<CapabilitySnapshot> = {}): CapabilitySnapshot {
  return {
    workflowId: "booking",
    currentStepId: "identity",
    values: {},
    completedStepIds: [],
    bookingStatus: "none",
    hasProposal: false,
    ...overrides,
  };
}

describe("dynamic capabilities", () => {
  it("exposes schema and submit before identity exists", () => {
    const names = getAvailableTools(bookingWorkflow, snap()).map((tool) => tool.name);
    assert.deepEqual(names.sort(), ["get_form_schema", "submit_step"].sort());
  });

  it("adds slot tools after identity exists", () => {
    const names = getAvailableTools(
      bookingWorkflow,
      snap({
        currentStepId: "need",
        values: {
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    ).map((tool) => tool.name);
    assert.ok(names.includes("get_available_slots"));
    assert.ok(names.includes("book_slot"));
    assert.ok(names.includes("propose_slot"));
    assert.ok(names.includes("submit_step"));
    assert.equal(names.includes("reschedule_booking"), false);
  });

  it("replaces book_slot with reschedule and cancel after a confirmed booking", () => {
    const before = getAvailableTools(
      bookingWorkflow,
      snap({
        values: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          service: "first_consult",
          format: "video",
        },
      }),
    ).map((tool) => tool.name);
    const after = getAvailableTools(
      bookingWorkflow,
      snap({
        bookingStatus: "confirmed",
        values: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          service: "first_consult",
          format: "video",
        },
      }),
    ).map((tool) => tool.name);
    const delta = capabilityDelta(before, after);
    assert.ok(delta.added.includes("reschedule_booking"));
    assert.ok(delta.added.includes("cancel_booking"));
    assert.ok(delta.added.includes("get_booking_status"));
    assert.ok(delta.removed.includes("book_slot"));
    assert.equal(after.includes("submit_step"), false);
    assert.ok(after.includes("get_available_slots"));
  });

  it("uses the brief tool names on the studio workflow", () => {
    const names = getAvailableTools(briefWorkflow, snap({ workflowId: "brief" })).map(
      (tool) => tool.name,
    );
    assert.ok(names.includes("get_brief_schema"));
    assert.ok(names.includes("update_brief"));
    assert.equal(names.includes("get_form_schema"), false);
    assert.equal(names.includes("book_slot"), false);
  });
});

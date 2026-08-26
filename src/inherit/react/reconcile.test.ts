import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconcilePolledState, type PollableWorkflowState } from "./reconcile";

function snapshot(
  patch: Partial<PollableWorkflowState["session"]> & {
    bookingId?: string | null;
    booking?: { id: string } | null;
    values?: Record<string, string | boolean | undefined>;
  } = {},
): PollableWorkflowState {
  const { booking, values, ...session } = patch;
  return {
    session: {
      id: "sess_1",
      version: 1,
      status: "in_progress",
      values: values ?? {},
      bookingId: null,
      ...session,
    },
    booking: booking ?? null,
  };
}

describe("reconcilePolledState", () => {
  it("keeps local state when the poll is the same version", () => {
    const current = snapshot({
      version: 2,
      values: { name: "Audit Bot" },
    });
    const incoming = snapshot({ version: 2, values: {} });
    assert.equal(reconcilePolledState(current, incoming), current);
  });

  it("ignores an older empty replica that would snap the step backwards", () => {
    const current = snapshot({
      version: 3,
      values: { name: "Audit Bot", email: "audit@example.com" },
    });
    const incoming = snapshot({ version: 1, values: {} });
    assert.equal(reconcilePolledState(current, incoming), current);
  });

  it("applies a newer remote snapshot so agent writes still land", () => {
    const current = snapshot({
      version: 2,
      values: { name: "Ada" },
    });
    const incoming = snapshot({
      version: 3,
      values: { name: "Ada", slotId: "slot_wed" },
    });
    const next = reconcilePolledState(current, incoming);
    assert.equal(next.session.version, 3);
    assert.equal(next.session.values.slotId, "slot_wed");
    assert.equal(next.session.values.name, "Ada");
  });

  it("keeps in-progress typing when a newer poll only has the last saved prefix", () => {
    const current = snapshot({
      version: 2,
      values: { name: "Audit Bot" },
    });
    const incoming = snapshot({
      version: 3,
      values: { name: "Audit", slotId: "slot_wed" },
    });
    const next = reconcilePolledState(current, incoming);
    assert.equal(next.session.values.name, "Audit Bot");
    assert.equal(next.session.values.slotId, "slot_wed");
  });

  it("does not replace a confirmed booking with a later empty in-progress replica", () => {
    const current = snapshot({
      version: 2,
      status: "booked",
      bookingId: "bk_1",
      booking: { id: "bk_1" },
      values: { name: "Ada", email: "ada@example.com", slotId: "slot_wed" },
    });
    const incoming = snapshot({
      version: 5,
      status: "in_progress",
      values: { name: "Ada", email: "ada@example.com", slotId: "slot_wed" },
    });
    assert.equal(reconcilePolledState(current, incoming), current);
  });

  it("still applies a newer reschedule of an existing booking", () => {
    const current = snapshot({
      version: 4,
      status: "booked",
      bookingId: "bk_1",
      booking: { id: "bk_1" },
      values: { slotId: "slot_tue" },
    });
    const incoming = snapshot({
      version: 5,
      status: "booked",
      bookingId: "bk_1",
      booking: { id: "bk_1" },
      values: { slotId: "slot_wed" },
    });
    const next = reconcilePolledState(current, incoming);
    assert.equal(next.session.version, 5);
    assert.equal(next.session.values.slotId, "slot_wed");
  });
});

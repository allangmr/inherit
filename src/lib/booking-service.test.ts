import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, beforeEach } from "node:test";
import { bookSlot, cancelBooking, getBookingStatus, listAvailableSlots, submitStep } from "./booking-service";
import { resetStoreForTests } from "./sqlite-store";

process.env.INHERIT_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "inherit-test-"));
process.env.CALENDAR_PROVIDER = "file";

describe("booking service", () => {
  beforeEach(() => {
    resetStoreForTests();
  });
  it("lists open 30-minute slots with remaining capacity", async () => {
    const listed = await listAvailableSlots();
    assert.equal(listed.provider, "file");
    assert.ok(listed.slots.length > 0);
    assert.ok(listed.slots.every((slot) => slot.remaining > 0));
    assert.ok(listed.slots.every((slot) => slot.capacity === 3));
  });

  it("books a slot end-to-end without Google OAuth", async () => {
    const listed = await listAvailableSlots();
    const slot = listed.slots[0];
    const identity = submitStep(undefined, "identity", {
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    assert.equal(identity.ok, true);
    const sessionId = identity.state.session.id;

    const booked = await bookSlot({
      sessionId,
      slotId: slot.id,
      values: {
        service: "first_consult",
        format: "video",
        notes: "Talk through the sitting.",
        consent: true,
      },
    });
    assert.equal(booked.ok, true);
    if (!booked.ok) return;
    assert.equal(booked.booking.email, "ada@example.com");
    assert.equal(booked.booking.calendarProvider, "file");
    assert.equal(booked.state.session.status, "booked");

    const status = getBookingStatus({ email: "ada@example.com" });
    assert.equal(status.ok, true);
    assert.equal(status.bookings[0]?.id, booked.booking.id);
  });

  it("cancels a booking and frees the slot", async () => {
    const listed = await listAvailableSlots();
    const slot = listed.slots[0];
    const identity = submitStep(undefined, "identity", {
      name: "Ada Lovelace",
      email: "cancel@example.com",
    });
    const sessionId = identity.state.session.id;
    const booked = await bookSlot({
      sessionId,
      slotId: slot.id,
      values: { service: "first_consult", format: "video", consent: true },
    });
    assert.equal(booked.ok, true);
    const cancelled = await cancelBooking({ sessionId, actor: "human" });
    assert.equal(cancelled.ok, true);
    const again = await listAvailableSlots();
    const restored = again.allSlots.find((item) => item.id === slot.id);
    assert.ok(restored);
    assert.equal(restored?.booked, listed.allSlots.find((item) => item.id === slot.id)?.booked);
  });
});

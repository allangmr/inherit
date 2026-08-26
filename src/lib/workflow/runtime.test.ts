import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";

process.env.INHERIT_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "inherit-runtime-"));
process.env.CALENDAR_PROVIDER = "file";

import { bookSlot, listAvailableSlots, submitStep } from "../booking-service";
import { resetStoreForTests } from "../sqlite-store";
import { dispatchAction, saveDraft, submitWorkflowStep } from "./runtime";
import { getWorkflowState } from "./session";
import { StaleSessionError } from "./stale";

describe("workflow runtime", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("keeps human and agent mutations on the same session", () => {
    const identity = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "ada@example.com" },
      actor: "human",
    });
    assert.equal(identity.ok, true);
    const sessionId = identity.state.session.id;

    const prefs = submitWorkflowStep({
      sessionId,
      stepId: "need",
      values: { service: "first_consult", format: "video" },
      actor: "agent",
      toolName: "submit_step",
    });
    assert.equal(prefs.ok, true);
    const state = getWorkflowState(sessionId);
    assert.equal(state.session.values.name, "Ada Lovelace");
    assert.equal(state.session.values.service, "first_consult");
    assert.equal(state.session.id, sessionId);
    assert.ok(state.capabilityNames.includes("get_available_slots"));
  });

  it("refuses to book without identity", async () => {
    const listed = await listAvailableSlots();
    const result = await bookSlot({
      slotId: listed.slots[0].id,
      values: { service: "first_consult", format: "video", consent: true },
      actor: "agent",
    });
    assert.equal(result.ok, false);
  });

  it("reschedules only with an active booking and a free slot", async () => {
    const listed = await listAvailableSlots();
    const first = listed.slots[0];
    const second = listed.slots[1];
    const identity = submitStep(undefined, "identity", {
      name: "Ada Lovelace",
      email: "reschedule@example.com",
    });
    const sessionId = identity.state.session.id;
    const booked = await bookSlot({
      sessionId,
      slotId: first.id,
      values: { service: "first_consult", format: "video", consent: true },
      actor: "human",
    });
    assert.equal(booked.ok, true);

    const missing = await dispatchAction({
      sessionId,
      action: "reschedule_booking",
      actor: "agent",
      payload: { slotId: "slot-does-not-exist" },
    });
    assert.equal(missing.ok, false);

    const moved = await dispatchAction({
      sessionId,
      action: "reschedule_booking",
      actor: "agent",
      payload: { slotId: second.id },
    });
    assert.equal(moved.ok, true);
    const state = getWorkflowState(sessionId);
    assert.equal(state.booking?.slotId, second.id);
    assert.ok(
      state.activity.some((entry) => entry.action === "reschedule_booking" && entry.actor === "agent"),
    );
  });

  it("cannot cancel a booking that does not exist", async () => {
    const created = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "none@example.com" },
      actor: "human",
    });
    const result = await dispatchAction({
      sessionId: created.state.session.id,
      action: "cancel_booking",
      actor: "human",
    });
    assert.equal(result.ok, false);
  });

  it("rejects a stale mutation after a newer write", async () => {
    const identity = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "stale@example.com" },
      actor: "human",
    });
    const sessionId = identity.state.session.id;
    const version = identity.state.session.version;
    submitWorkflowStep({
      sessionId,
      stepId: "need",
      values: { service: "first_consult", format: "video" },
      actor: "human",
    });
    assert.throws(
      () =>
        submitWorkflowStep({
          sessionId,
          stepId: "need",
          values: { service: "follow_up", format: "studio" },
          actor: "agent",
          expectedVersion: version,
        }),
      StaleSessionError,
    );
    const state = getWorkflowState(sessionId);
    assert.equal(state.session.values.service, "first_consult");
  });

  it("records human vs agent actors on activity", () => {
    const identity = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "actors@example.com" },
      actor: "human",
    });
    submitWorkflowStep({
      sessionId: identity.state.session.id,
      stepId: "need",
      values: { service: "focused", format: "video" },
      actor: "agent",
      toolName: "submit_step",
    });
    const activity = getWorkflowState(identity.state.session.id).activity;
    assert.ok(activity.some((entry) => entry.actor === "human" && entry.action === "submit_step"));
    assert.ok(activity.some((entry) => entry.actor === "agent" && entry.toolName === "submit_step"));
  });

  it("runs the brief workflow on the shared runtime", async () => {
    const goal = submitWorkflowStep({
      workflowId: "brief",
      stepId: "goal",
      values: { goal: "A landing page for the autumn collection", audience: "Art directors" },
      actor: "human",
    });
    assert.equal(goal.ok, true);
    assert.equal(goal.state.workflow.id, "brief");
    const sessionId = goal.state.session.id;
    const suggestion = await dispatchAction({
      sessionId,
      workflowId: "brief",
      action: "suggest_deliverables",
      actor: "agent",
    });
    assert.equal(suggestion.ok, true);
    assert.ok(suggestion.state);
    assert.ok(suggestion.state.proposal);
    assert.equal(suggestion.state.workflow.id, "brief");
    assert.ok(suggestion.state.capabilityNames.includes("get_brief_schema"));
    assert.equal(suggestion.state.capabilityNames.includes("book_slot"), false);
  });

  it("lets the agent list slots after identity and records that check", async () => {
    const identity = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "slots@example.com" },
      actor: "human",
    });
    const sessionId = identity.state.session.id;
    const listed = await dispatchAction({
      sessionId,
      action: "get_available_slots",
      actor: "agent",
      toolName: "get_available_slots",
    });
    assert.equal(listed.ok, true);
    const state = getWorkflowState(sessionId);
    assert.ok(state.capabilityNames.includes("book_slot"));
    assert.ok(
      state.activity.some(
        (entry) =>
          entry.action === "get_available_slots" &&
          entry.actor === "agent" &&
          entry.summary.includes("ChatGPT checked"),
      ),
    );
  });

  it("books the human-selected session slot when the agent passes a stale slotId", async () => {
    const listed = await listAvailableSlots();
    const humanSlot = listed.slots[0];
    const agentSlot = listed.slots[1];
    const identity = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "handoff@example.com" },
      actor: "human",
    });
    const sessionId = identity.state.session.id;
    saveDraft({
      sessionId,
      values: { slotId: humanSlot.id, service: "first_consult", format: "video" },
      actor: "human",
    });
    const booked = await dispatchAction({
      sessionId,
      action: "book_slot",
      actor: "agent",
      payload: { slotId: agentSlot.id },
    });
    assert.equal(booked.ok, true);
    const state = getWorkflowState(sessionId);
    assert.equal(state.booking?.slotId, humanSlot.id);
  });

  it("does not bump the session version when a draft has no changes", () => {
    const identity = submitWorkflowStep({
      stepId: "identity",
      values: { name: "Ada Lovelace", email: "noop@example.com" },
      actor: "human",
    });
    const sessionId = identity.state.session.id;
    const version = getWorkflowState(sessionId).session.version;
    const again = saveDraft({
      sessionId,
      values: { name: "Ada Lovelace", email: "noop@example.com" },
      actor: "human",
    });
    assert.equal(again.session.version, version);
  });
});

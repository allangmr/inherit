"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { readSessionId, writeSessionId } from "@/lib/session-id";
import {
  apiFetch,
  INHERIT_STATE_EVENT,
  INHERIT_TOOL_EVENT,
  type ToolTrace,
} from "@/lib/webmcp";
import type { TokenPreset } from "@/lib/tokens";
import type { ActivityRecord, FieldProvenance, ProposalRecord } from "@/lib/store";
import type { Capability } from "@/lib/workflow/types";
import { TokenScope } from "./token-scope";
import { WebMcpBridge } from "./webmcp-bridge";
import { ActivityRail } from "./activity-rail";
import { InheritInspector } from "./inherit-inspector";
import { ProposalCard } from "./proposal-card";

type Slot = {
  id: string;
  start: string;
  end: string;
  label: string;
  remaining: number;
  capacity: number;
};

type FormField = {
  id: string;
  type: string;
  label: string;
  hint?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
};

type FormStep = {
  id: string;
  title: string;
  subtitle: string;
  fields: FormField[];
};

type WorkflowState = {
  workflow: { id: string; version: number; title: string; description: string };
  form: {
    id: string;
    title: string;
    description: string;
    steps: FormStep[];
  };
  session: {
    id: string;
    workflowId: string;
    currentStepId: string;
    values: Record<string, string | boolean | undefined>;
    completedStepIds: string[];
    bookingId: string | null;
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

type FieldError = { fieldId: string; message: string };

function extractState(payload: unknown): WorkflowState | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const nested = (root.state ?? root) as Record<string, unknown>;
  const session = nested.session as WorkflowState["session"] | undefined;
  if (!session?.id) return null;
  return nested as unknown as WorkflowState;
}

function groupSlots(slots: Slot[]) {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const day = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(new Date(slot.start));
    const list = groups.get(day) ?? [];
    list.push(slot);
    groups.set(day, list);
  }
  return [...groups.entries()];
}

function timeLabel(slot: Slot) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(slot.start));
}

function SlotPicker({
  slots,
  selectedId,
  onSelect,
  limitDays,
}: {
  slots: Slot[];
  selectedId?: string;
  onSelect: (id: string) => void;
  limitDays?: number;
}) {
  const groups = groupSlots(slots);
  const visible = limitDays ? groups.slice(0, limitDays) : groups;
  return (
    <>
      {visible.map(([day, daySlots]) => (
        <section key={day} className="inh-slot-day">
          <h3>{day}</h3>
          <div className="inh-slot-grid">
            {daySlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className="inh-slot"
                data-selected={selectedId === slot.id}
                aria-pressed={selectedId === slot.id}
                onClick={() => onSelect(slot.id)}
              >
                {timeLabel(slot)}
                {limitDays ? null : (
                  <em>
                    {slot.remaining} of {slot.capacity} left
                  </em>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function provenanceCopy(entry: FieldProvenance | undefined) {
  if (!entry) return null;
  if (entry.actor === "agent") return "Suggested by agent";
  if (entry.source === "proposal") return "Accepted from ChatGPT";
  if (entry.actor === "human") return "Selected by you";
  return "Set by the system";
}

export function InheritForm({
  preset = "inherit",
  compact = false,
  sessionKey,
  registerTools = true,
  workflowId = "booking",
}: {
  preset?: TokenPreset;
  compact?: boolean;
  sessionKey?: string;
  registerTools?: boolean;
  workflowId?: string;
}) {
  const sessionId = useSyncExternalStore(
    () => () => {},
    () => readSessionId(sessionKey),
    () => "",
  );
  const [state, setState] = useState<WorkflowState | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);
  const [boot, setBoot] = useState(true);
  const inspectStore = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("popstate", onChange);
      return () => window.removeEventListener("popstate", onChange);
    },
    () =>
      new URLSearchParams(window.location.search).get("inspect") === "1" ||
      window.localStorage.getItem("inherit.inspect") === "1",
    () => false,
  );
  const [inspectOverride, setInspectOverride] = useState<boolean | null>(null);
  const inspect = inspectOverride ?? inspectStore;
  const [flash, setFlash] = useState<string | null>(null);
  const [lastTool, setLastTool] = useState<ToolTrace | null>(null);
  const previousCaps = useRef<string[]>([]);
  const [capSnapshot, setCapSnapshot] = useState<string[]>([]);
  const bookingLabelRef = useRef<string | undefined>(undefined);
  const dirtyRef = useRef(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [transition, setTransition] = useState<{ from: string; to: string } | null>(null);

  const applyState = useCallback(
    (payload: unknown) => {
      const next = extractState(payload);
      if (!next?.session?.id) return;
      writeSessionId(next.session.id, sessionKey);
      const nextNames = next.capabilityNames ?? next.capabilities?.map((cap) => cap.name) ?? [];
      const prev = previousCaps.current;
      if (prev.length && nextNames.join() !== prev.join()) {
        setCapSnapshot(prev);
      }
      previousCaps.current = nextNames;
      const previousLabel = bookingLabelRef.current;
      if (
        next.booking?.label &&
        previousLabel &&
        next.booking.label !== previousLabel &&
        next.activity?.at(-1)?.actor === "agent"
      ) {
        setFlash("Updated by ChatGPT");
        setTransition({ from: previousLabel, to: next.booking.label });
        window.setTimeout(() => {
          setFlash(null);
          setTransition(null);
        }, 3200);
      }
      bookingLabelRef.current = next.booking?.label;
      setState(next);
    },
    [sessionKey],
  );

  useEffect(() => {
    const id = readSessionId(sessionKey);
    let cancelled = false;

    async function bootSession() {
      try {
        const [schema, slotData] = await Promise.all([
          apiFetch<WorkflowState>(
            `/api/form/schema?sessionId=${encodeURIComponent(id)}&workflowId=${encodeURIComponent(workflowId)}`,
          ),
          workflowId === "booking" ? apiFetch<{ slots: Slot[] }>("/api/slots") : Promise.resolve({ slots: [] }),
        ]);
        if (cancelled) return;
        applyState(schema);
        setSlots(slotData.slots ?? []);
      } finally {
        if (!cancelled) setBoot(false);
      }
    }

    bootSession();
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const next = extractState(detail);
      if (next && next.session.id !== id && next.session.id !== sessionId) return;
      applyState(detail);
      if (workflowId === "booking") {
        void apiFetch<{ slots: Slot[] }>("/api/slots").then((data) => setSlots(data.slots ?? []));
      }
    };
    const onTool = (event: Event) => {
      setLastTool((event as CustomEvent<ToolTrace>).detail);
    };
    window.addEventListener(INHERIT_STATE_EVENT, onSync);
    window.addEventListener(INHERIT_TOOL_EVENT, onTool);
    return () => {
      cancelled = true;
      window.removeEventListener(INHERIT_STATE_EVENT, onSync);
      window.removeEventListener(INHERIT_TOOL_EVENT, onTool);
    };
  }, [applyState, sessionKey, workflowId, sessionId]);

  const values = useMemo(() => state?.session.values ?? {}, [state?.session.values]);
  const stepId = state?.session.currentStepId;

  useEffect(() => {
    if (!sessionId || boot || !dirtyRef.current) return;
    const handle = window.setTimeout(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      void apiFetch<WorkflowState>("/api/form/step", {
        method: "POST",
        body: JSON.stringify({ sessionId, workflowId, values, draft: true }),
      })
        .then((data) => {
          const next = extractState(data);
          if (!next) return;
          setState((current) => {
            if (!current) return next;
            return {
              ...current,
              session: {
                ...current.session,
                version: next.session.version,
                provenance: next.session.provenance,
              },
              activity: next.activity ?? current.activity,
              capabilities: next.capabilities ?? current.capabilities,
              capabilityNames: next.capabilityNames ?? current.capabilityNames,
              proposal: next.proposal,
            };
          });
        })
        .catch(() => {
          dirtyRef.current = true;
        });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [sessionId, values, boot, workflowId]);

  useEffect(() => {
    if (state?.session.status === "booked") {
      successRef.current?.focus();
    }
  }, [state?.session.status]);

  const steps = state?.form.steps ?? [];
  const step = steps.find((item) => item.id === stepId) ?? steps[0];
  const booked = state?.session.status === "booked";
  const cancelled = state?.session.status === "cancelled";
  const submitted = state?.session.status === "submitted";
  const booking = state?.booking ?? null;
  const errorMap = useMemo(
    () => Object.fromEntries(errors.map((error) => [error.fieldId, error.message])),
    [errors],
  );

  function setField(id: string, value: string | boolean) {
    if (!state) return;
    dirtyRef.current = true;
    setState({
      ...state,
      session: { ...state.session, values: { ...state.session.values, [id]: value } },
    });
    setErrors((current) => current.filter((error) => error.fieldId !== id));
  }

  async function runAction(action: string, payload: Record<string, unknown> = {}) {
    if (!sessionId) return;
    setBusy(true);
    try {
      const result = await apiFetch<Record<string, unknown>>("/api/workflow/action", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          workflowId,
          action,
          payload,
        }),
      });
      applyState(result);
      setErrors((result.errors as FieldError[]) ?? []);
      if (workflowId === "booking") {
        const slotData = await apiFetch<{ slots: Slot[] }>("/api/slots");
        setSlots(slotData.slots ?? []);
      }
    } catch (error) {
      setErrors([{ fieldId: "form", message: error instanceof Error ? error.message : "Request failed" }]);
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    if (!sessionId || !step) return;
    setBusy(true);
    try {
      if (workflowId === "booking" && step.id === "confirm") {
        await runAction("book_slot", { slotId: values.slotId, values });
        return;
      }
      if (workflowId === "brief" && step.id === "review") {
        await runAction("submit_project_brief", { values });
        return;
      }
      const result = await apiFetch<{
        ok: boolean;
        errors?: FieldError[];
        state?: unknown;
      }>("/api/form/step", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          workflowId,
          stepId: step.id,
          values,
        }),
      });
      if (!result.ok) {
        setErrors(result.errors ?? []);
        return;
      }
      setErrors([]);
      applyState(result);
    } catch (error) {
      setErrors([{ fieldId: "form", message: error instanceof Error ? error.message : "Request failed" }]);
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (!state || !step) return;
    const index = steps.findIndex((item) => item.id === step.id);
    const previous = index > 0 ? steps[index - 1] : null;
    if (!previous) return;
    setState({
      ...state,
      session: { ...state.session, currentStepId: previous.id },
    });
  }

  const selectedSlot = slots.find((slot) => slot.id === values.slotId);
  const capabilities = state?.capabilities ?? [];
  const activity = state?.activity ?? [];
  const proposal = state?.proposal ?? null;
  const provenance = state?.session.provenance ?? {};
  const showOverrideSlots =
    workflowId === "booking" && !booked && !cancelled && proposal?.action === "propose_slot";

  const done = booked || cancelled || submitted;

  return (
    <TokenScope preset={preset}>
      <div className="inh-shell">
        <form
          className="inh-form"
          onSubmit={(event) => {
            event.preventDefault();
            void goNext();
          }}
        >
          <div className="inh-kicker">
            <span>{compact ? state?.workflow.title ?? "Workflow" : state?.workflow.title ?? "Inherit"}</span>
            <WebMcpBridge
              sessionId={sessionId || "pending"}
              workflowId={workflowId}
              enabled={registerTools}
              capabilityNames={state?.capabilityNames ?? []}
            />
          </div>
          <h1 className="inh-title">{state?.form.title ?? "Loading"}</h1>
          <p className="inh-subtitle">{state?.form.description}</p>

          {steps.length ? (
            <nav className="inh-steps" aria-label="Workflow steps" style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, minmax(0, 1fr))` }}>
              {steps.map((item, index) => (
                <div
                  key={item.id}
                  className="inh-step-pip"
                  data-active={item.id === stepId}
                  data-done={done || steps.findIndex((entry) => entry.id === stepId) > index}
                >
                  <span>0{index + 1}</span>
                  <strong>{item.title}</strong>
                </div>
              ))}
            </nav>
          ) : null}

          {errorMap.form ? <p className="inh-error">{errorMap.form}</p> : null}
          {flash ? (
            <p className="inh-flash" role="status">
              {flash}
            </p>
          ) : null}

          {proposal ? (
            <ProposalCard
              proposal={proposal}
              busy={busy}
              onAccept={() => void runAction("commit_proposal")}
              onReject={() => void runAction("reject_proposal")}
            />
          ) : null}

          {showOverrideSlots ? (
            <div className="inh-field">
              <span className="inh-label">Or pick a different time</span>
              <SlotPicker slots={slots} selectedId={String(values.slotId ?? "")} onSelect={(id) => setField("slotId", id)} />
            </div>
          ) : null}

          {boot ? (
            <p className="inh-subtitle">Loading your session…</p>
          ) : booked && booking ? (
            <div className="inh-success">
              <h2 ref={successRef} tabIndex={-1}>
                Booking confirmed
              </h2>
              <p>
                {booking.label}
                <br />
                <span className="inh-hint">{provenanceCopy(provenance.slotId) ?? "Locked on the shared calendar"}</span>
              </p>
              {transition ? (
                <p className="inh-transition" role="status">
                  {transition.from}
                  <span aria-hidden="true"> → </span>
                  <strong>{transition.to}</strong>
                </p>
              ) : null}
              {flash ? <p className="inh-hint">{flash}</p> : null}
              <p>
                {booking.name} · {booking.email}
                <br />
                Booking id <span className="inh-code">{booking.id}</span>
              </p>
              <div className="inh-field">
                <span className="inh-label">Move to another time</span>
                <SlotPicker
                  slots={slots}
                  selectedId={String(values.slotId ?? "")}
                  onSelect={(id) => setField("slotId", id)}
                  limitDays={3}
                />
              </div>
              <div className="inh-actions">
                <button
                  type="button"
                  className="inh-button"
                  data-variant="ghost"
                  disabled={busy}
                  onClick={() => void runAction("cancel_booking")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inh-button"
                  data-variant="primary"
                  disabled={busy || !values.slotId}
                  onClick={() => void runAction("reschedule_booking", { slotId: values.slotId })}
                >
                  Reschedule
                </button>
              </div>
            </div>
          ) : cancelled ? (
            <div className="inh-success">
              <h2>Booking cancelled</h2>
              <p>The shared session is still here if you want to book again in a new visit.</p>
            </div>
          ) : submitted ? (
            <div className="inh-success">
              <h2>Brief submitted</h2>
              <p>The studio has the same document the agent just finished.</p>
            </div>
          ) : step ? (
            <>
              <header>
                <h2 className="inh-title" style={{ fontSize: "1.35rem" }}>
                  {step.title}
                </h2>
                <p className="inh-subtitle">{step.subtitle}</p>
              </header>

              {step.fields.map((field) => {
                const origin = provenanceCopy(provenance[field.id]);
                const showOrigin =
                  origin && (field.id === "slotId" || field.id === "service" || field.id === "deliverable");
                if (field.type === "radio") {
                  return (
                    <fieldset key={field.id} className="inh-field" style={{ border: 0, padding: 0 }}>
                      <legend className="inh-label">{field.label}</legend>
                      <div className="inh-choices">
                        {field.options?.map((option) => (
                          <label
                            key={option.value}
                            className="inh-choice"
                            data-checked={values[field.id] === option.value}
                          >
                            <input
                              type="radio"
                              name={field.id}
                              value={option.value}
                              checked={values[field.id] === option.value}
                              onChange={() => setField(field.id, option.value)}
                            />
                            <span>
                              {option.label}
                              {option.description ? <small>{option.description}</small> : null}
                            </span>
                          </label>
                        ))}
                      </div>
                      {showOrigin ? <span className="inh-hint">{origin}</span> : null}
                      {errorMap[field.id] ? <p className="inh-error">{errorMap[field.id]}</p> : null}
                    </fieldset>
                  );
                }

                if (field.type === "select") {
                  return (
                    <label key={field.id} className="inh-field">
                      <span className="inh-label">{field.label}</span>
                      <select
                        className="inh-select"
                        value={String(values[field.id] ?? "")}
                        onChange={(event) => setField(field.id, event.target.value)}
                      >
                        <option value="">Choose one</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errorMap[field.id] ? <p className="inh-error">{errorMap[field.id]}</p> : null}
                    </label>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <label key={field.id} className="inh-field">
                      <span className="inh-label">{field.label}</span>
                      <textarea
                        className="inh-textarea"
                        value={String(values[field.id] ?? "")}
                        placeholder={field.placeholder}
                        onChange={(event) => setField(field.id, event.target.value)}
                      />
                      {errorMap[field.id] ? <p className="inh-error">{errorMap[field.id]}</p> : null}
                    </label>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <label key={field.id} className="inh-choice" data-checked={Boolean(values[field.id])}>
                      <input
                        type="checkbox"
                        checked={Boolean(values[field.id])}
                        onChange={(event) => setField(field.id, event.target.checked)}
                      />
                      <span>{field.label}</span>
                    </label>
                  );
                }

                if (field.type === "slot") {
                  return (
                    <div key={field.id} className="inh-field">
                      <span className="inh-label">{field.label}</span>
                      <SlotPicker
                        slots={slots}
                        selectedId={String(values.slotId ?? "")}
                        onSelect={(id) => setField("slotId", id)}
                      />
                      {selectedSlot && showOrigin ? (
                        <span className="inh-hint">
                          {selectedSlot.label}. {origin}
                        </span>
                      ) : null}
                      {errorMap[field.id] ? <p className="inh-error">{errorMap[field.id]}</p> : null}
                    </div>
                  );
                }

                return (
                  <label key={field.id} className="inh-field">
                    <span className="inh-label">{field.label}</span>
                    <input
                      className="inh-input"
                      type={field.type}
                      value={String(values[field.id] ?? "")}
                      placeholder={field.placeholder}
                      onChange={(event) => setField(field.id, event.target.value)}
                    />
                    {field.hint ? <span className="inh-hint">{field.hint}</span> : null}
                    {errorMap[field.id] ? <p className="inh-error">{errorMap[field.id]}</p> : null}
                  </label>
                );
              })}

              {step.id === "confirm" && workflowId === "booking" ? (
                <dl className="inh-summary">
                  <div>
                    <dt>Name</dt>
                    <dd>{String(values.name ?? "—")}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{String(values.email ?? "—")}</dd>
                  </div>
                  <div>
                    <dt>Session</dt>
                    <dd>{String(values.service ?? "—").replaceAll("_", " ")}</dd>
                  </div>
                  <div>
                    <dt>When</dt>
                    <dd>{selectedSlot?.label ?? String(values.slotId ?? "—")}</dd>
                  </div>
                </dl>
              ) : null}

              {step.id === "review" && workflowId === "brief" ? (
                <dl className="inh-summary">
                  <div>
                    <dt>Goal</dt>
                    <dd>{String(values.goal ?? "—")}</dd>
                  </div>
                  <div>
                    <dt>Deliverable</dt>
                    <dd>{String(values.deliverable ?? "—").replaceAll("_", " ")}</dd>
                  </div>
                  <div>
                    <dt>Deadline</dt>
                    <dd>{String(values.deadline ?? "—")}</dd>
                  </div>
                </dl>
              ) : null}

              <div className="inh-actions">
                <button
                  type="button"
                  className="inh-button"
                  data-variant="ghost"
                  onClick={goBack}
                  disabled={!step || steps[0]?.id === step.id || busy}
                >
                  Back
                </button>
                <button type="submit" className="inh-button" data-variant="primary" disabled={busy || boot}>
                  {step.id === "confirm"
                    ? "Confirm booking"
                    : step.id === "review"
                      ? "Submit brief"
                      : "Continue"}
                </button>
              </div>
            </>
          ) : null}

          <ActivityRail entries={activity} />
          <button
            type="button"
            className="inh-inspect-toggle"
            onClick={() => {
              const next = !inspect;
              setInspectOverride(next);
              window.localStorage.setItem("inherit.inspect", next ? "1" : "0");
            }}
          >
            Developer mode
          </button>
        </form>

        {inspect && state ? (
          <InheritInspector
            sessionId={state.session.id}
            workflowId={state.session.workflowId}
            currentStepId={state.session.currentStepId}
            bookingId={state.session.bookingId}
            version={state.session.version}
            status={state.session.status}
            capabilities={capabilities}
            previousNames={capSnapshot}
            activity={activity}
            proposal={proposal}
            lastTool={lastTool}
            values={values}
          />
        ) : null}
      </div>
    </TokenScope>
  );
}

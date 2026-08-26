"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { apiFetch, INHERIT_TOOL_EVENT, type ToolTrace } from "@inherit/webmcp";
import {
  InheritProvider,
  extractState,
  useActivity,
  useAvailableActions,
  useSession,
  useWorkflow,
  type ClientWorkflowState,
} from "@inherit/react";
import type { TokenPreset } from "@/lib/tokens";
import type { FieldProvenance } from "@inherit/core";
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

type FieldError = { fieldId: string; message: string };

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
  return (
    <InheritProvider workflowId={workflowId} sessionKey={sessionKey}>
      <InheritFormView
        preset={preset}
        compact={compact}
        registerTools={registerTools}
        workflowId={workflowId}
      />
    </InheritProvider>
  );
}

function InheritFormView({
  preset,
  compact,
  registerTools,
  workflowId,
}: {
  preset: TokenPreset;
  compact: boolean;
  registerTools: boolean;
  workflowId: string;
}) {
  const { sessionId, boot, state, applyState, setState } = useSession();
  const { workflow } = useWorkflow();
  const capabilities = useAvailableActions();
  const activity = useActivity();
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);
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

  const rememberState = applyState;

  useEffect(() => {
    if (!state) return;
    const nextNames = state.capabilityNames ?? capabilities.map((cap) => cap.name);
    const prev = previousCaps.current;
    if (prev.length && nextNames.join() !== prev.join()) {
      setCapSnapshot(prev);
    }
    previousCaps.current = nextNames;
    const previousLabel = bookingLabelRef.current;
    if (
      state.booking?.label &&
      previousLabel &&
      state.booking.label !== previousLabel &&
      state.activity?.at(-1)?.actor === "agent"
    ) {
      setFlash("Updated by ChatGPT");
      setTransition({ from: previousLabel, to: state.booking.label });
      window.setTimeout(() => {
        setFlash(null);
        setTransition(null);
      }, 3200);
    }
    bookingLabelRef.current = state.booking?.label;
  }, [state, capabilities]);

  useEffect(() => {
    if (workflowId !== "booking") return;
    let cancelled = false;
    void apiFetch<{ slots: Slot[] }>("/api/slots").then((data) => {
      if (!cancelled) setSlots(data.slots ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [workflowId, state?.session.version]);

  useEffect(() => {
    const onTool = (event: Event) => {
      setLastTool((event as CustomEvent<ToolTrace>).detail);
    };
    window.addEventListener(INHERIT_TOOL_EVENT, onTool);
    return () => window.removeEventListener(INHERIT_TOOL_EVENT, onTool);
  }, []);

  const values = useMemo(() => state?.session.values ?? {}, [state?.session.values]);
  const stepId = state?.session.currentStepId;

  useEffect(() => {
    if (!sessionId || boot || !dirtyRef.current) return;
    const handle = window.setTimeout(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      void apiFetch<ClientWorkflowState>("/api/form/step", {
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
                version: Math.max(current.session.version, next.session.version),
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
  }, [sessionId, values, boot, workflowId, setState]);

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
      if (result.ok === false) {
        setErrors(
          (result.errors as FieldError[]) ?? [{ fieldId: "form", message: "Request failed" }],
        );
        return;
      }
      rememberState(result);
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
      rememberState(result);
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
            <span>{compact ? workflow?.title ?? "Workflow" : workflow?.title ?? "Inherit"}</span>
            <WebMcpBridge
              sessionId={sessionId || "pending"}
              workflowId={workflowId}
              enabled={registerTools}
              capabilities={capabilities}
              schemaToolName={state?.workflow.schemaToolName ?? (workflowId === "brief" ? "get_brief_schema" : "get_form_schema")}
              submitToolName={state?.workflow.submitToolName ?? (workflowId === "brief" ? "update_brief" : "submit_step")}
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

          {errorMap.form || errorMap.action ? (
            <p className="inh-error">{errorMap.form ?? errorMap.action}</p>
          ) : null}
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

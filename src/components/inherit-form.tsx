"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { formDefinition, previousStepId } from "@/lib/form-definition";
import { readSessionId, writeSessionId } from "@/lib/session-id";
import { apiFetch, INHERIT_STATE_EVENT } from "@/lib/webmcp";
import type { TokenPreset } from "@/lib/tokens";
import { TokenScope } from "./token-scope";
import { WebMcpBridge } from "./webmcp-bridge";

type Slot = {
  id: string;
  start: string;
  end: string;
  label: string;
  remaining: number;
  capacity: number;
};

type FormState = {
  session: {
    id: string;
    currentStepId: string;
    values: Record<string, string | boolean | undefined>;
    completedStepIds: string[];
    bookingId: string | null;
    status: string;
  };
  booking?: {
    id: string;
    label?: string;
    start: string;
    end: string;
    name: string;
    email: string;
    calendarEventId: string;
    calendarProvider: string;
  } | null;
};

type FieldError = { fieldId: string; message: string };

function extractState(payload: unknown): FormState | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const nested = (root.state ?? root) as Record<string, unknown>;
  const session = nested.session as FormState["session"] | undefined;
  if (!session?.id) return null;
  return {
    session,
    booking: (nested.booking as FormState["booking"]) ?? null,
  };
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

export function InheritForm({
  preset = "inherit",
  compact = false,
  sessionKey,
}: {
  preset?: TokenPreset;
  compact?: boolean;
  sessionKey?: string;
}) {
  const sessionId = useSyncExternalStore(
    () => () => {},
    () => readSessionId(sessionKey),
    () => "",
  );
  const [stepId, setStepId] = useState(formDefinition.steps[0].id);
  const [values, setValues] = useState<Record<string, string | boolean | undefined>>({});
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [booking, setBooking] = useState<FormState["booking"]>(null);
  const [busy, setBusy] = useState(false);
  const [boot, setBoot] = useState(true);

  const applyState = useCallback((payload: unknown) => {
    const next = extractState(payload);
    if (!next) return;
    writeSessionId(next.session.id, sessionKey);
    setStepId(next.session.currentStepId);
    setValues(next.session.values ?? {});
    setBooking(next.booking ?? null);
    if (next.session.bookingId) setStepId("confirm");
  }, [sessionKey]);

  useEffect(() => {
    const id = readSessionId(sessionKey);
    let cancelled = false;

    async function bootSession() {
      try {
        const [schema, slotData] = await Promise.all([
          apiFetch<Record<string, unknown>>(`/api/form/schema?sessionId=${encodeURIComponent(id)}`),
          apiFetch<{ slots: Slot[] }>("/api/slots"),
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
      if (next && next.session.id !== id) return;
      applyState(detail);
      void apiFetch<{ slots: Slot[] }>("/api/slots").then((data) => setSlots(data.slots ?? []));
    };
    window.addEventListener(INHERIT_STATE_EVENT, onSync);
    return () => {
      cancelled = true;
      window.removeEventListener(INHERIT_STATE_EVENT, onSync);
    };
  }, [applyState, sessionKey]);

  useEffect(() => {
    if (!sessionId || boot) return;
    const handle = window.setTimeout(() => {
      void apiFetch("/api/form/step", {
        method: "POST",
        body: JSON.stringify({ sessionId, values, draft: true }),
      });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [sessionId, values, boot]);

  const step = formDefinition.steps.find((item) => item.id === stepId) ?? formDefinition.steps[0];
  const booked = Boolean(booking?.id);
  const errorMap = useMemo(
    () => Object.fromEntries(errors.map((error) => [error.fieldId, error.message])),
    [errors],
  );

  function setField(id: string, value: string | boolean) {
    setValues((current) => ({ ...current, [id]: value }));
    setErrors((current) => current.filter((error) => error.fieldId !== id));
  }

  async function goNext() {
    if (!sessionId) return;
    setBusy(true);
    try {
      if (stepId === "confirm") {
        const result = await apiFetch<Record<string, unknown>>("/api/book", {
          method: "POST",
          body: JSON.stringify({
            sessionId,
            slotId: values.slotId,
            values,
          }),
        });
        applyState(result);
        setErrors([]);
        const slotData = await apiFetch<{ slots: Slot[] }>("/api/slots");
        setSlots(slotData.slots ?? []);
      } else {
        const result = await apiFetch<{
          ok: boolean;
          errors?: FieldError[];
          state?: unknown;
        }>("/api/form/step", {
          method: "POST",
          body: JSON.stringify({ sessionId, stepId, values }),
        });
        if (!result.ok) {
          setErrors(result.errors ?? []);
          return;
        }
        setErrors([]);
        applyState(result);
      }
    } catch (error) {
      setErrors([{ fieldId: "form", message: error instanceof Error ? error.message : "Request failed" }]);
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    const previous = previousStepId(stepId);
    if (previous) setStepId(previous);
  }

  const selectedSlot = slots.find((slot) => slot.id === values.slotId);

  return (
    <TokenScope preset={preset}>
      <form
        className="inh-form"
        onSubmit={(event) => {
          event.preventDefault();
          void goNext();
        }}
      >
        <div className="inh-kicker">
          <span>{compact ? "Consult" : "30-minute consult"}</span>
          <WebMcpBridge sessionId={sessionId || "pending"} />
        </div>
        <h1 className="inh-title">{formDefinition.title}</h1>
        <p className="inh-subtitle">{formDefinition.description}</p>

        <nav className="inh-steps" aria-label="Form steps">
          {formDefinition.steps.map((item, index) => (
            <div
              key={item.id}
              className="inh-step-pip"
              data-active={item.id === stepId}
              data-done={
                booked ||
                formDefinition.steps.findIndex((s) => s.id === stepId) > index
              }
            >
              <span>0{index + 1}</span>
              <strong>{item.title}</strong>
            </div>
          ))}
        </nav>

        {errorMap.form ? <p className="inh-error">{errorMap.form}</p> : null}

        {boot ? (
          <p className="inh-subtitle">Loading your session…</p>
        ) : booked && booking ? (
          <div className="inh-success">
            <h2>You&apos;re on the calendar.</h2>
            <p>
              {booking.name}, we reserved <strong>{booking.label}</strong> for you.
              A calendar event ({booking.calendarProvider}) is stored as{" "}
              <span className="inh-code">{booking.calendarEventId}</span>.
            </p>
            <p>
              Booking id <span className="inh-code">{booking.id}</span>
              <br />
              Confirmation sent conceptually to {booking.email} — email is out of scope for this demo.
            </p>
          </div>
        ) : (
          <>
            <header>
              <h2 className="inh-title" style={{ fontSize: "1.35rem" }}>
                {step.title}
              </h2>
              <p className="inh-subtitle">{step.subtitle}</p>
            </header>

            {step.fields.map((field) => {
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
                    {groupSlots(slots).map(([day, daySlots]) => (
                      <section key={day} className="inh-slot-day">
                        <h3>{day}</h3>
                        <div className="inh-slot-grid">
                          {daySlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              className="inh-slot"
                              data-selected={values.slotId === slot.id}
                              onClick={() => setField("slotId", slot.id)}
                            >
                              {timeLabel(slot)}
                              <em>
                                {slot.remaining} of {slot.capacity} left
                              </em>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
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

            {stepId === "confirm" ? (
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
                  <dt>Format</dt>
                  <dd>{values.format === "video" ? "Video call" : "In studio"}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>{selectedSlot?.label ?? String(values.slotId ?? "—")}</dd>
                </div>
              </dl>
            ) : null}

            <div className="inh-actions">
              <button
                type="button"
                className="inh-button"
                data-variant="ghost"
                onClick={goBack}
                disabled={stepId === "identity" || busy}
              >
                Back
              </button>
              <button type="submit" className="inh-button" data-variant="primary" disabled={busy || boot}>
                {stepId === "confirm" ? "Confirm booking" : "Continue"}
              </button>
            </div>
          </>
        )}
      </form>
    </TokenScope>
  );
}

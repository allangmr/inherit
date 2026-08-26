"use client";

import { useMemo, useState } from "react";
import type { ActivityRecord, ProposalRecord } from "@/lib/store";
import type { Capability } from "@inherit/core";
import type { ToolTrace } from "@inherit/webmcp";
import { capabilityDelta } from "@inherit/core";
import { ArchitectureDiagram } from "./architecture-diagram";

type InspectorProps = {
  sessionId: string;
  workflowId: string;
  currentStepId: string;
  bookingId: string | null;
  version: number;
  status: string;
  capabilities: Capability[];
  previousNames: string[];
  activity: ActivityRecord[];
  proposal: ProposalRecord | null;
  lastTool: ToolTrace | null;
  values: Record<string, string | boolean | undefined>;
};

export function InheritInspector(props: InspectorProps) {
  const [open, setOpen] = useState(true);
  const names = props.capabilities.map((cap) => cap.name);
  const delta = useMemo(
    () => capabilityDelta(props.previousNames, names),
    [props.previousNames, names],
  );

  if (!open) {
    return (
      <button type="button" className="inh-inspect-toggle" onClick={() => setOpen(true)}>
        Developer mode
      </button>
    );
  }

  return (
    <aside className="inh-inspector" aria-label="Inherit inspector">
      <header className="inh-rail-head">
        <strong>Inspector</strong>
        <button type="button" className="inh-button" data-variant="ghost" onClick={() => setOpen(false)}>
          Hide
        </button>
      </header>
      <ArchitectureDiagram />
      <dl className="inh-summary">
        <div>
          <dt>Session</dt>
          <dd className="inh-code">{props.sessionId.slice(0, 8)}</dd>
        </div>
        <div>
          <dt>Workflow</dt>
          <dd>{props.workflowId}</dd>
        </div>
        <div>
          <dt>Step</dt>
          <dd>{props.currentStepId}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{props.version}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{props.status}</dd>
        </div>
        <div>
          <dt>Booking</dt>
          <dd className="inh-code">{props.bookingId ?? "none"}</dd>
        </div>
      </dl>

      <h3>Available capabilities</h3>
      <ul className="inh-cap-list">
        {props.capabilities.map((cap) => (
          <li key={cap.name} data-live="true">
            ✓ {cap.name}
            {cap.readOnly ? <em>read</em> : null}
          </li>
        ))}
      </ul>
      {delta.added.length || delta.removed.length ? (
        <p className="inh-delta" aria-live="polite">
          {delta.added.map((name) => (
            <span key={`+${name}`} data-kind="add">
              + {name}
            </span>
          ))}
          {delta.removed.map((name) => (
            <span key={`-${name}`} data-kind="remove">
              − {name}
            </span>
          ))}
        </p>
      ) : (
        <p className="inh-hint">No capability change since the last snapshot.</p>
      )}

      <h3>Last WebMCP execution</h3>
      {props.lastTool ? (
        <dl className="inh-summary">
          <div>
            <dt>Tool</dt>
            <dd className="inh-code">{props.lastTool.name}</dd>
          </div>
          <div>
            <dt>Actor</dt>
            <dd>{props.lastTool.actor}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{props.lastTool.durationMs} ms</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{props.lastTool.timestamp}</dd>
          </div>
        </dl>
      ) : (
        <p className="inh-hint">No tool call on this page yet.</p>
      )}
      {props.lastTool ? (
        <details>
          <summary>Input / result</summary>
          <pre className="inh-json">{JSON.stringify({ input: props.lastTool.input, result: props.lastTool.result }, null, 2)}</pre>
        </details>
      ) : null}

      {props.proposal ? (
        <p className="inh-hint">Pending proposal: {props.proposal.action}</p>
      ) : null}

      <h3>Session values</h3>
      <pre className="inh-json">{JSON.stringify(props.values, null, 2)}</pre>
      <h3>Activity</h3>
      <pre className="inh-json">
        {JSON.stringify(
          props.activity.map((entry) => ({
            actor: entry.actor,
            action: entry.action,
            summary: entry.summary,
          })),
          null,
          2,
        )}
      </pre>
    </aside>
  );
}

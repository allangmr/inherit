"use client";

import type { ProposalRecord } from "@/lib/store";

export function ProposalCard({
  proposal,
  busy,
  onAccept,
  onReject,
}: {
  proposal: ProposalRecord;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const label =
    typeof proposal.payload.label === "string"
      ? proposal.payload.label
      : proposal.summary;
  return (
    <aside className="inh-proposal" aria-live="polite">
      <p className="inh-kicker">
        <span>{proposal.actor === "agent" ? "ChatGPT" : "Proposal"}</span>
        <span>needs a decision</span>
      </p>
      <h2 className="inh-title" style={{ fontSize: "1.2rem" }}>
        {proposal.action === "propose_slot" ? "ChatGPT wants this time" : proposal.summary}
      </h2>
      <p className="inh-subtitle">{label}</p>
      <div className="inh-actions">
        <button type="button" className="inh-button" data-variant="ghost" onClick={onReject} disabled={busy}>
          Change
        </button>
        <button type="button" className="inh-button" data-variant="primary" onClick={onAccept} disabled={busy}>
          Confirm
        </button>
      </div>
    </aside>
  );
}

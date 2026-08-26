"use client";

import { useEffect, useState } from "react";
import type { ActivityRecord } from "@/lib/store";

const labels: Record<ActivityRecord["actor"], string> = {
  human: "YOU",
  agent: "AGENT",
  system: "SYSTEM",
};

export function ActivityRail({
  entries,
}: {
  entries: ActivityRecord[];
}) {
  const [expanded, setExpanded] = useState(true);
  const count = entries.length;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const sync = () => setExpanded(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (!count) {
    return (
      <section className="inh-rail" aria-label="Activity">
        <header className="inh-rail-head">
          <strong>Activity</strong>
          <span>Waiting for the first move</span>
        </header>
      </section>
    );
  }

  return (
    <section className="inh-rail" aria-label="Activity">
      <details
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary className="inh-rail-head">
          <strong>Activity</strong>
          <span>
            {count} {count === 1 ? "event" : "events"}
          </span>
        </summary>
        <ol className="inh-rail-list" aria-live="polite">
          {entries
            .slice()
            .reverse()
            .slice(0, 12)
            .map((entry) => (
              <li key={entry.id} data-actor={entry.actor}>
                <span className="inh-actor">{labels[entry.actor]}</span>
                <p>{entry.summary}</p>
              </li>
            ))}
        </ol>
      </details>
    </section>
  );
}

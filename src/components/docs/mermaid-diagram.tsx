"use client";

import { useEffect, useId, useRef, useState } from "react";

export function MermaidDiagram({
  title,
  chart,
  note,
}: {
  title: string;
  chart: string;
  note?: string;
}) {
  const rawId = useId().replace(/:/g, "");
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("mermaid")
      .then((mod) => {
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "dark",
          fontFamily: "var(--inh-font-family), ui-sans-serif, system-ui, sans-serif",
          themeVariables: {
            primaryColor: "#171b2e",
            primaryTextColor: "#f4f1ea",
            primaryBorderColor: "#7c5cff",
            lineColor: "#b8b3c9",
            secondaryColor: "#1f2540",
            tertiaryColor: "#12162a",
            background: "#0f1220",
            mainBkg: "#171b2e",
            nodeBorder: "#7c5cff",
            clusterBkg: "#12162a",
            titleColor: "#f0c38e",
            edgeLabelBackground: "#171b2e",
          },
        });
        return mermaid.render(`guide-mmd-${rawId}`, chart);
      })
      .then((result) => {
        if (cancelled || !host.current) return;
        host.current.innerHTML = result.svg;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, rawId]);

  return (
    <figure className="guide-diagram">
      <figcaption>{title}</figcaption>
      {failed ? <pre className="guide-mmd-fallback">{chart}</pre> : <div className="guide-mmd" ref={host} />}
      {note ? <p>{note}</p> : null}
    </figure>
  );
}

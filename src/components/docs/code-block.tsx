"use client";

import { useState } from "react";

export function CodeBlock({
  code,
  filename,
  comingSoon = false,
}: {
  code: string;
  filename?: string;
  comingSoon?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="guide-code" data-soon={comingSoon ? "true" : "false"}>
      <figcaption>
        <span>{filename ?? "TypeScript"}</span>
        <span className="guide-code-actions">
          {comingSoon ? <span className="guide-soon">Coming when published</span> : null}
          <button type="button" onClick={() => void copy()} disabled={comingSoon}>
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}

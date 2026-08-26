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
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        throw new Error("clipboard API missing");
      }
    } catch {
      const field = document.createElement("textarea");
      field.value = code;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
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

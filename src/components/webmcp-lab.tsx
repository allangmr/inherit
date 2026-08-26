"use client";

import { useState, useSyncExternalStore } from "react";
import {
  executeRegisteredTool,
  listRegisteredTools,
  probeWebMcp,
} from "@/lib/webmcp";
import type { RegisteredTool } from "@/types/webmcp";

const scripts: Array<{ name: string; label: string; args: Record<string, unknown> }> = [
  { name: "get_form_schema", label: "get_form_schema", args: {} },
  { name: "get_available_slots", label: "get_available_slots", args: {} },
  {
    name: "submit_step",
    label: "submit_step (identity)",
    args: {
      stepId: "identity",
      values: { name: "WebMCP Agent", email: "agent@inherit.dev" },
    },
  },
  { name: "get_booking_status", label: "get_booking_status", args: { email: "agent@inherit.dev" } },
];

export function WebMcpLab() {
  const probeSnapshot = useSyncExternalStore(
    () => () => {},
    () => JSON.stringify(probeWebMcp()),
    () => "",
  );
  const probe = probeSnapshot ? (JSON.parse(probeSnapshot) as ReturnType<typeof probeWebMcp>) : null;
  const [tools, setTools] = useState<RegisteredTool[]>([]);
  const [result, setResult] = useState<string>("Enable the Chrome flag, then list tools.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshTools() {
    setBusy(true);
    setError(null);
    try {
      const listed = await listRegisteredTools();
      setTools(listed);
      setResult(
        listed.length
          ? JSON.stringify(
              listed.map((tool) => ({ name: tool.name, description: tool.description })),
              null,
              2,
            )
          : "Chrome returned 0 tools. Is the flag enabled, and did the form finish registering?",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "listTools failed");
    } finally {
      setBusy(false);
    }
  }

  async function run(name: string, args: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const output = await executeRegisteredTool(name, args);
      setResult(typeof output === "string" ? output : JSON.stringify(output, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "executeTool failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(probe?.registerTool);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#171b2e] p-5 text-[#f4f1ea]">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#f0c38e]">
        Chrome WebMCP lab
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Call the tools through Chrome</h2>
      <p className="mt-2 text-sm leading-6 text-[#b8b3c9]">
        This panel uses <code>document.modelContext.getTools / executeTool</code> or{" "}
        <code>navigator.modelContextTesting</code> — the same consumer API an agent uses. It does
        not skip WebMCP and hit our REST routes directly.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[#b8b3c9]">
        <li>
          Open <code>chrome://flags/#enable-webmcp-testing</code> and set it to Enabled
        </li>
        <li>Relaunch Chrome (148+). This VM is Chrome 148.</li>
        <li>Reload this page. The pill should read Agent tools ready.</li>
        <li>List tools, then run get_form_schema. The form on this page must update if you submit_step.</li>
      </ol>

      <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] sm:grid-cols-3">
        {probe
          ? Object.entries(probe)
              .filter(([key]) => key !== "userAgent")
              .map(([key, value]) => (
                <div key={key} className="rounded-lg border border-white/10 px-2 py-1.5">
                  <dt className="text-[#8b97a8]">{key}</dt>
                  <dd className={value === true || value === "true" ? "text-[#6ee7b7]" : "text-[#f4f1ea]"}>
                    {String(value)}
                  </dd>
                </div>
              ))
          : null}
      </dl>

      {!ready ? (
        <p className="mt-4 text-sm text-[#f07167]">
          WebMCP producer API is not on this document. Enable the flag and relaunch — until then
          this lab cannot prove Chrome mediation.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-[#7c5cff] px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          onClick={() => void refreshTools()}
          disabled={busy}
        >
          List tools via Chrome
        </button>
        {scripts.map((script) => (
          <button
            key={script.label}
            type="button"
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => void run(script.name, script.args)}
            disabled={busy || !ready}
          >
            {script.label}
          </button>
        ))}
      </div>

      {tools.length ? (
        <p className="mt-3 font-mono text-xs text-[#6ee7b7]">
          Chrome sees {tools.length} tool{tools.length === 1 ? "" : "s"}:{" "}
          {tools.map((tool) => tool.name).join(", ")}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-[#f07167]">{error}</p> : null}
      <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-black/40 p-3 font-mono text-[11px] leading-5 text-[#f0c38e]">
        {result}
      </pre>
    </section>
  );
}

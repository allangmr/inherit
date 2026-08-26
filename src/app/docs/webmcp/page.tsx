import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidePager } from "@/components/docs/guide-pager";
import { SNIPPET_DETECT, SNIPPET_WEBMCP } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "WebMCP",
  description:
    "Feature-detect document.modelContext || navigator.modelContext, register workflow tools, and tear them down with AbortSignal.",
};

export default function DocsWebmcpPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">WebMCP</p>
      <h1>Register the live list. Abort the old one.</h1>
      <p className="guide-lede">
        <code>@inherit/webmcp</code> turns current capabilities into{" "}
        <code>registerTool</code> calls. It does not keep a static tool catalog. When{" "}
        <code>book_slot</code> leaves the list, the previous registration is aborted.
      </p>

      <h2>Feature detection</h2>
      <p>
        <code>getModelContext()</code> returns a producer only when{" "}
        <code>registerTool</code> exists. It looks at the document first, then the navigator.
      </p>
      <CodeBlock filename="feature detect" code={SNIPPET_DETECT} />
      <p>
        <code>document.modelContext</code> is current. <code>navigator.modelContext</code> is
        the ChatGPT / Chrome 149 fallback. WebMCP also needs a secure context.{" "}
        <code>isSecureContextForWebMcp()</code> is <code>window.isSecureContext</code>.
      </p>
      <p>
        Chrome lab: enable <code>chrome://flags/#enable-webmcp-testing</code>, relaunch, then
        open <Link href="/lab">/lab</Link> or <Link href="/book">/book</Link>. List tools
        through Chrome, not a sidecar REST client.{" "}
        <code>getModelContextTesting()</code> reads <code>navigator.modelContextTesting</code>.
      </p>

      <h2>registerTool and registerTools</h2>
      <p>
        The browser API is <code>modelContext.registerTool(tool, {"{ signal, exposedTo }"})</code>.
        Inherit wraps that as <code>registerTools(tools, options)</code>. If there is no
        producer it returns <code>{"{ supported: false, registered: 0 }"}</code>.
      </p>
      <p>
        <code>registerWorkflowTools(adapter, capabilities, meta, options)</code> builds the
        tool list from capabilities, then calls <code>registerTools</code>.{" "}
        <code>meta.schemaToolName</code> and <code>meta.submitToolName</code> pick the HTTP
        path. Everything else becomes <code>POST /api/workflow/action</code>.
      </p>
      <CodeBlock filename="src/components/webmcp-bridge.tsx" code={SNIPPET_WEBMCP} />

      <h2>AbortSignal</h2>
      <p>
        <code>WebMcpBridge</code> creates an <code>AbortController</code> per registration.
        The effect cleanup calls <code>abort()</code>. That is how a capability that left the
        snapshot disappears from the document. Pass the same signal into{" "}
        <code>registerWorkflowTools</code>. Tool executes also forward{" "}
        <code>extras.signal</code> into <code>apiFetch</code>.
      </p>

      <h2>The judged URL is /book</h2>
      <p>
        Tools register on the document that is open. ChatGPT&apos;s in-app browser should load{" "}
        <Link href="/book">/book</Link>, not an iframe and not only the embed route. Serve
        HTTPS. Confirm the indicator reads ready, then ask it to finish the consult on the
        shared session.
      </p>
      <p>
        <Link href="/demo/atelier">/demo/atelier</Link> is the judged human host.{" "}
        <Link href="/lab">/lab</Link> is for Chrome&apos;s consumer API. Compare mode turns
        registration off so two copies of the form do not fight.
      </p>

      <h2>What the adapter does</h2>
      <ul>
        <li>
          Schema tool → <code>GET /api/form/schema</code>, then{" "}
          <code>broadcastFormState</code>.
        </li>
        <li>
          Submit tool → <code>POST /api/form/step</code> with <code>stepId</code> and{" "}
          <code>values</code>.
        </li>
        <li>
          Other capabilities → <code>POST /api/workflow/action</code> with the capability name.
        </li>
      </ul>
      <p>
        Default actor for the adapter is <code>agent</code>. Traces go out as{" "}
        <code>inherit:tool</code>. If the capability list is empty, the adapter still exposes
        the schema and submit names from <code>WorkflowToolMeta</code> so a page can boot.
      </p>
      <GuidePager href="/docs/webmcp" />
    </article>
  );
}

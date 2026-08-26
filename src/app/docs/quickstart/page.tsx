import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidePager } from "@/components/docs/guide-pager";
import {
  SNIPPET_DEFINE,
  SNIPPET_PROVIDER,
  SNIPPET_RUNTIME,
  SNIPPET_WEBMCP,
} from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Quickstart",
  description:
    "Define a workflow, create the runtime, render InheritProvider, and register WebMCP tools using the real Inherit APIs.",
};

export default function DocsQuickstartPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">Quickstart</p>
      <h1>Four calls. One session.</h1>
      <p className="guide-lede">
        This is the path the demo app already takes. The APIs are real. The booking form and
        names come from <code>src/lib/workflows/booking.ts</code>. Handlers stay in your app.
      </p>

      <h2>1. Define a workflow</h2>
      <p>
        <code>defineWorkflow</code> checks that the form has a step, then returns the object.
        <code>available</code> on each action decides whether that name is a live capability.
      </p>
      <CodeBlock filename="src/lib/workflows/booking.ts" code={SNIPPET_DEFINE} />

      <h2>2. Create the runtime</h2>
      <p>
        Pass a <code>WorkflowStore</code>, a registry <code>get</code>, a{" "}
        <code>snapshot</code> that turns a session into <code>recordStatus</code> /{" "}
        <code>hasProposal</code>, and <code>getHandlers</code> for domain work. This is the
        shape of <code>src/lib/inherit-runtime.ts</code>.
      </p>
      <CodeBlock filename="src/lib/inherit-runtime.ts" code={SNIPPET_RUNTIME} />
      <p>
        <code>getState(sessionId, workflowId)</code> is what{" "}
        <code>/api/form/schema</code> returns. <code>submitStep</code> is{" "}
        <code>/api/form/step</code>. <code>executeAction</code> is{" "}
        <code>/api/workflow/action</code>.
      </p>

      <h2>3. Render with InheritProvider</h2>
      <p>
        The provider boots from <code>/api/form/schema</code>, keeps{" "}
        <code>inherit.sessionId</code> in <code>sessionStorage</code>, and applies{" "}
        <code>inherit:state</code> events when a tool writes. Hooks throw outside the provider.
      </p>
      <CodeBlock filename="src/components/inherit-form.tsx" code={SNIPPET_PROVIDER} />

      <h2>4. Register WebMCP tools</h2>
      <p>
        Feature-detect <code>document.modelContext || navigator.modelContext</code>. Register
        from the live capability list. Abort the previous set when the list changes. This is{" "}
        <code>src/components/webmcp-bridge.tsx</code>.
      </p>
      <CodeBlock filename="src/components/webmcp-bridge.tsx" code={SNIPPET_WEBMCP} />
      <p className="guide-note">
        Tools must register on a top-level document. The ChatGPT URL is{" "}
        <Link href="/book">/book</Link>, not an iframe. Chrome needs{" "}
        <code>chrome://flags/#enable-webmcp-testing</code>.
      </p>

      <h2>Run it</h2>
      <p>
        After <Link href="/docs/install">clone and install</Link>, <code>npm run dev</code> and
        open <Link href="/demo/atelier">/demo/atelier</Link> or add <code>?inspect=1</code> to
        watch capabilities move. <code>npm test</code> and <code>npm run build</code> are the
        gates this repo uses.
      </p>
      <GuidePager href="/docs/quickstart" />
    </article>
  );
}

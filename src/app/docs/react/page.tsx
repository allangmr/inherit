import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidePager } from "@/components/docs/guide-pager";
import { SNIPPET_PROVIDER } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "React",
  description:
    "InheritProvider, useSession, useWorkflow, useAvailableActions, and useActivity. Client bindings over the shared session.",
};

export default function DocsReactPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">React</p>
      <h1>Bind the open session.</h1>
      <p className="guide-lede">
        <code>@inherit/react</code> is a client module. <code>InheritProvider</code> owns the
        session id and the latest <code>ClientWorkflowState</code>. The hooks read that
        context. They throw if you render them outside the provider.
      </p>
      <CodeBlock filename="src/components/inherit-form.tsx" code={SNIPPET_PROVIDER} />

      <h2>InheritProvider</h2>
      <p>
        Props are <code>workflowId</code> (default <code>&quot;booking&quot;</code>), optional{" "}
        <code>sessionKey</code>, and <code>children</code>. On mount it reads{" "}
        <code>sessionStorage</code> key <code>inherit.sessionId</code>, or{" "}
        <code>inherit.sessionId.&lt;sessionKey&gt;</code> when <code>sessionKey</code> is set.
        Without a namespace it also accepts <code>?session=</code> on the URL.
      </p>
      <p>
        Boot fetch:{" "}
        <code>/api/form/schema?sessionId=…&amp;workflowId=…</code> with{" "}
        <code>x-inherit-actor: human</code>. Then a 2s poll.{" "}
        <code>reconcilePolledState</code> keeps a settled booking from being overwritten by a
        stale <code>in_progress</code> payload, and keeps local string edits that are prefixes
        of the server value.
      </p>
      <p>
        Tool writes dispatch <code>inherit:state</code> (
        <code>WORKFLOW_STATE_EVENT</code>). The provider applies that payload through{" "}
        <code>extractState</code>.
      </p>

      <h2>Hooks</h2>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Hook</th>
              <th>Returns</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>useSession</td>
              <td>
                <code>sessionId</code>, <code>boot</code>, <code>state</code>,{" "}
                <code>session</code>, <code>proposal</code>, <code>applyState</code>,{" "}
                <code>setState</code>
              </td>
            </tr>
            <tr>
              <td>useWorkflow</td>
              <td>
                <code>workflowId</code>, <code>workflow</code>, <code>form</code>,{" "}
                <code>title</code>, <code>description</code>
              </td>
            </tr>
            <tr>
              <td>useAvailableActions</td>
              <td>
                <code>Capability[]</code> from the last state. Empty array before boot.
              </td>
            </tr>
            <tr>
              <td>useActivity</td>
              <td>Activity rows for the session. Empty array before boot.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <code>useInheritContext</code> is the raw context if you need it.{" "}
        <code>InheritContext</code> is exported for the same reason. Prefer the named hooks.
      </p>

      <h2>Events and helpers</h2>
      <ul>
        <li>
          <code>WORKFLOW_STATE_EVENT</code> / <code>WORKFLOW_TOOL_EVENT</code> are{" "}
          <code>&quot;inherit:state&quot;</code> and <code>&quot;inherit:tool&quot;</code>. The
          WebMCP package exports the same strings as <code>INHERIT_STATE_EVENT</code> and{" "}
          <code>INHERIT_TOOL_EVENT</code>.
        </li>
        <li>
          <code>extractState(payload)</code> accepts a state object or{" "}
          <code>{"{ state }"}</code>. Missing <code>session.id</code> returns null.
        </li>
        <li>
          <code>reconcilePolledState(current, incoming)</code> is the poll guard. Exported so
          tests and hosts can reuse it.
        </li>
      </ul>
      <p>
        The form card in this repo is <code>src/components/inherit-form.tsx</code>. It is an
        app component. It is not part of the SDK export list. Host tokens live in{" "}
        <code>src/lib/tokens.ts</code>.
      </p>
      <p>
        Next: <Link href="/docs/webmcp">register those capabilities as WebMCP tools</Link>.
      </p>
      <GuidePager href="/docs/react" />
    </article>
  );
}

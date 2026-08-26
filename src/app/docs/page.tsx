import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidePager } from "@/components/docs/guide-pager";
import { DOC_PAGES } from "@/lib/docs/nav";
import { SNIPPET_IMPORTS } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Inherit is an in-repo TypeScript SDK. One workflow runtime serves the human UI, WebMCP tools, validation, and domain actions.",
};

export default function DocsOverviewPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">Developer docs</p>
      <h1>One runtime. Shared session.</h1>
      <p className="guide-lede">
        Inherit is a TypeScript SDK that lives in this repository under{" "}
        <code>src/inherit/core</code>, <code>react</code>, and <code>webmcp</code>. It is MIT
        licensed. It is not on npm. The{" "}
        <Link href="/">package landing</Link> is the pitch. This section is how you wire it.
      </p>
      <div className="guide-pills" aria-label="Package status">
        <span className="guide-pill">private: true</span>
        <span className="guide-pill">not on npm</span>
        <span className="guide-pill">@inherit/core</span>
        <span className="guide-pill">@inherit/react</span>
        <span className="guide-pill">@inherit/webmcp</span>
      </div>

      <h2>The one-runtime thesis</h2>
      <p>
        Most agent-ready sites ship a human form and a second integration. State, validation,
        and permissions get copied. The agent scrapes, guesses, or talks to a sidecar.
      </p>
      <p>
        Inherit keeps one <code>WorkflowDefinition</code>. The runtime projects that object into
        the form UI, <code>getAvailableTools</code>, server validation, and a single{" "}
        <code>SessionRecord</code>. A person typing a name and an agent calling{" "}
        <code>submit_step</code> write the same row. If the agent books while the page is open,
        the page jumps to confirmation.
      </p>
      <ol className="guide-flow">
        <li>
          <i>01</i>
          <div>
            <strong>Workflow definition</strong>
            <p>Steps, fields, actions, and when each action is legal.</p>
          </div>
        </li>
        <li>
          <i>02</i>
          <div>
            <strong>Human UI, WebMCP tools, validation</strong>
            <p>Same projection. Tools are not a parallel API.</p>
          </div>
        </li>
        <li>
          <i>03</i>
          <div>
            <strong>Shared session</strong>
            <p>One SessionRecord. Drafts, buttons, and tools all hit the runtime.</p>
          </div>
        </li>
        <li>
          <i>04</i>
          <div>
            <strong>Domain actions</strong>
            <p>Handlers you supply. Booking is one app. The studio brief is another.</p>
          </div>
        </li>
      </ol>

      <h2>When to use it</h2>
      <p>Use Inherit when a person and an agent should finish the same multi-step workflow.</p>
      <ul>
        <li>You want one validator for typed fields and tool calls.</li>
        <li>Capabilities should appear and disappear as the session changes.</li>
        <li>The open page should follow agent writes without a second session.</li>
      </ul>
      <p>
        Do not use it if you need a published package today.{" "}
        <code>package.json</code> is <code>private: true</code>. There is no registry URL and no
        version to install. Visual form builders, payments, teams, and extra calendar vendors are
        out of scope.
      </p>

      <h2>Workspace imports</h2>
      <p>
        This Next.js app maps <code>@inherit/*</code> in <code>tsconfig.json</code>. Demo code
        imports those paths. The packages are not separate npm workspaces.
      </p>
      <CodeBlock filename="imports" code={SNIPPET_IMPORTS} />

      <h2>Demos consume the SDK</h2>
      <p>
        <Link href="/book">/book</Link> and Atelier are booking hosts. The studio brief is a
        second <code>WorkflowDefinition</code>. Both go through{" "}
        <code>createWorkflowRuntime</code> in <code>src/lib/inherit-runtime.ts</code>. The
        judged ChatGPT URL is <Link href="/book">/book</Link>. The judged human path is{" "}
        <Link href="/demo/atelier">/demo/atelier</Link>.
      </p>

      <h2>Read next</h2>
      <div className="guide-cards">
        {DOC_PAGES.filter((page) => page.href !== "/docs").map((page) => (
          <Link key={page.href} href={page.href} className="guide-card">
            <strong>{page.label}</strong>
            <span>{page.blurb}</span>
          </Link>
        ))}
      </div>
      <p className="guide-note">
        Source:{" "}
        <a href="https://github.com/allangmr/inherit">github.com/allangmr/inherit</a>. Live
        demo: <a href="https://inheritsdk.netlify.app/">inheritsdk.netlify.app</a>. MIT.
      </p>
      <GuidePager href="/docs" />
    </article>
  );
}

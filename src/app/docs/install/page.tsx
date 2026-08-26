import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidePager } from "@/components/docs/guide-pager";
import {
  SNIPPET_CLONE,
  SNIPPET_NPM_FUTURE,
  SNIPPET_PACKAGE_EXPORTS,
  SNIPPET_WORKSPACE_PATHS,
} from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Install",
  description:
    "Clone the Inherit repo and import @inherit/core, @inherit/react, and @inherit/webmcp from workspace paths. Not on npm yet.",
};

export default function DocsInstallPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">Install</p>
      <h1>Clone the repo. Import the paths.</h1>
      <p className="guide-lede">
        Inherit is an in-repo SDK. There is nothing to <code>npm install</code> from a registry
        today. You clone this project and import <code>@inherit/core</code>,{" "}
        <code>@inherit/react</code>, and <code>@inherit/webmcp</code> the way the demo app does.
      </p>

      <h2>Today</h2>
      <CodeBlock filename="shell" code={SNIPPET_CLONE} />
      <p>
        Open <code>http://localhost:3000</code>. The landing stays at <code>/</code>. These
        pages live at <code>/docs</code>. No Google OAuth. The default calendar is the
        file/SQLite provider. Copy <code>.env.example</code> only if you need to change slot
        capacity, timezone, or <code>INHERIT_DATA_DIR</code>.
      </p>

      <h3>Workspace imports</h3>
      <p>
        <code>tsconfig.json</code> maps the public paths. That is how every file in{" "}
        <code>src/lib</code> and <code>src/components</code> reaches the SDK.
      </p>
      <CodeBlock filename="tsconfig.json" code={SNIPPET_WORKSPACE_PATHS} />
      <p>
        <code>package.json</code> also lists <code>exports</code> for the same files. The
        package name is <code>inherit</code>, <code>private: true</code>, license MIT. Treat
        those exports as the public boundary, not as an npm release.
      </p>
      <CodeBlock filename="package.json" code={SNIPPET_PACKAGE_EXPORTS} />

      <h3>How this app wires the packages</h3>
      <ul>
        <li>
          <code>src/lib/workflows/booking.ts</code> and <code>brief.ts</code> call{" "}
          <code>defineWorkflow</code>. <code>src/lib/workflows/registry.ts</code> hands them to
          the runtime.
        </li>
        <li>
          <code>src/lib/inherit-runtime.ts</code> calls <code>createWorkflowRuntime</code> with
          the SQLite <code>WorkflowStore</code>, a <code>snapshot</code> that reads booking
          status, and <code>createDemoHandlers</code>.
        </li>
        <li>
          Route handlers in <code>src/app/api/form/*</code> and{" "}
          <code>src/app/api/workflow/action</code> call that runtime. Humans and agents enter
          here.
        </li>
        <li>
          <code>InheritForm</code> wraps the card in <code>InheritProvider</code> and reads{" "}
          <code>useSession</code>, <code>useWorkflow</code>, <code>useAvailableActions</code>,{" "}
          <code>useActivity</code>.
        </li>
        <li>
          <code>WebMcpBridge</code> builds an adapter with <code>createWebMcpAdapter</code> and
          registers the live capability list through <code>registerWorkflowTools</code>.
        </li>
      </ul>
      <p>
        If you are embedding Inherit in another Next app, copy <code>src/inherit</code>, the
        three path aliases, a store that implements <code>WorkflowStore</code>, and route
        handlers that call <code>getState</code>, <code>submitStep</code>, and{" "}
        <code>executeAction</code>. The booking and brief folders are apps, not the SDK.
      </p>

      <h2>Coming when published</h2>
      <p className="guide-note" data-tone="warn">
        The snippet below is a placeholder. It does not work today. There is no published
        version number and no registry URL. Do not run it expecting a package.
      </p>
      <CodeBlock filename="npm · not live" code={SNIPPET_NPM_FUTURE} comingSoon />

      <p>
        Next: the <Link href="/docs/quickstart">smallest path</Link> through define, runtime,
        React, and WebMCP.
      </p>
      <GuidePager href="/docs/install" />
    </article>
  );
}

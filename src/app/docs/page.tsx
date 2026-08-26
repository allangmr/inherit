import type { Metadata } from "next";
import Link from "next/link";
import { GuidePager } from "@/components/docs/guide-pager";
import { MermaidDiagram } from "@/components/docs/mermaid-diagram";
import { DOC_PAGES } from "@/lib/docs/nav";
import {
  CAPABILITY_CHART,
  PACKAGE_CHART,
  REQUEST_CHART,
  RUNTIME_CHART,
} from "@/lib/docs/diagrams";

export const metadata: Metadata = {
  title: "What this is for",
  description:
    "Inherit is for web developers shipping a workflow that a person and an agent finish together. One WorkflowDefinition becomes the form, the tools, the validation, and the shared session.",
};

export default function DocsOverviewPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">What this is for</p>
      <h1>A form and an agent should share one workflow.</h1>
      <p className="guide-lede">
        Most agent-ready sites still ship two systems: the human UI, and a separate agent API.
        State, validation, and permissions get copied. The agent scrapes the page or talks to a
        sidecar that drifts from the form.
      </p>
      <p>
        Inherit is for web developers shipping an agent-native workflow on the web. You write
        one <code>WorkflowDefinition</code>. The runtime turns that into the human form, the
        WebMCP tools, the validators, and one shared <code>SessionRecord</code>. That is the
        whole job of the SDK.
      </p>
      <div className="guide-pills" aria-label="Package status">
        <span className="guide-pill">in-repo SDK</span>
        <span className="guide-pill">private: true</span>
        <span className="guide-pill">not on npm</span>
        <span className="guide-pill">MIT</span>
      </div>

      <h2>Who it is for</h2>
      <p>
        You if you are putting a multi-step form on a site and you want ChatGPT or Chrome
        WebMCP to finish those same steps without a second backend. Booking and the studio
        brief in this repo are demo apps, not the product.
      </p>
      <p>
        Skip it if you need a published npm package today. There is no version and no registry
        URL. Skip it if you want a visual form builder, payments, or a CRM.
      </p>

      <h2>How it is shaped</h2>
      <MermaidDiagram
        title="One runtime"
        chart={RUNTIME_CHART}
        note="One object. Four projections. The person and the agent write the same session."
      />
      <MermaidDiagram
        title="Package map"
        chart={PACKAGE_CHART}
        note="Core does not import React or WebMCP. /book, Atelier, and Studio consume the three paths."
      />
      <MermaidDiagram
        title="Request path"
        chart={REQUEST_CHART}
        note="Humans and tools enter the same route handlers. actorFromRequest labels the write."
      />
      <MermaidDiagram
        title="Capability lifecycle"
        chart={CAPABILITY_CHART}
        note="getAvailableTools reads available(snapshot). WebMcpBridge aborts the old list and registers the new one."
      />

      <h2>Then wire it</h2>
      <p>
        Clone the repo, import the workspace paths, define a workflow, create the runtime,
        wrap the page in <code>InheritProvider</code>, register tools on{" "}
        <Link href="/book">/book</Link>.
      </p>
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

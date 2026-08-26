import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { inheritTokens, tokensToCssVars } from "@/lib/tokens";
import { Shot } from "./shot";

const GITHUB = "https://github.com/allangmr/inherit";

const demos = [
  {
    href: "/demo/atelier",
    path: "/demo/atelier",
    title: "Appointment booking",
    copy: "Capacity, slots, and a shared session. The judged path.",
  },
  {
    href: "/demo/studio",
    path: "/demo/studio",
    title: "Creative brief",
    copy: "Different steps and tools. Same runtime as booking.",
  },
  {
    href: "/demo/compare",
    path: "/demo/compare",
    title: "Token inheritance",
    copy: "One component in Atelier and Northline. Tools off so the copies do not fight.",
  },
  {
    href: "/demo/atelier?inspect=1",
    path: "/demo/atelier?inspect=1",
    title: "Inspector",
    copy: "Session, live capabilities, last tool call.",
  },
  {
    href: "/book",
    path: "/book",
    title: "ChatGPT URL",
    copy: "Top-level document. Tools register here for the in-app browser.",
  },
  {
    href: "/lab",
    path: "/lab",
    title: "WebMCP lab",
    copy: "List and run tools through Chrome, not a sidecar REST client.",
  },
];

export function DocsLanding() {
  const tokenStyle = tokensToCssVars(inheritTokens);

  return (
    <div className="docs-page inherit-hero inherit-grid" style={tokenStyle}>
      <SiteNav />
      <main>
        <section className="docs-hero">
          <div className="docs-wrap docs-hero-grid">
            <div>
              <p className="docs-kicker">In-repo SDK · MIT · OpenAI WebMCP Challenge</p>
              <h1 className="docs-display">Write one workflow. Share the session.</h1>
              <p className="docs-lede">
                Inherit is a TypeScript SDK for web workflows that people and AI agents finish
                together. A <strong>WorkflowDefinition</strong> drives the human UI, WebMCP tools,
                validation, and domain actions. A person typing a name and an agent calling{" "}
                <code>submit_step</code> write the same session. There is no second agent API.
              </p>
              <div className="docs-actions">
                <Link href="/demo/atelier" className="docs-btn" data-kind="primary">
                  Appointment demo
                </Link>
                <Link href="/demo/studio" className="docs-btn" data-kind="ghost">
                  Creative brief
                </Link>
                <a href={GITHUB} className="docs-btn" data-kind="ghost">
                  GitHub
                </a>
              </div>
              <div className="docs-status" aria-label="Package status">
                <span className="docs-pill">private: true</span>
                <span className="docs-pill">not on npm</span>
                <span className="docs-pill">@inherit/core</span>
                <span className="docs-pill">@inherit/react</span>
                <span className="docs-pill">@inherit/webmcp</span>
              </div>
            </div>
            <aside className="docs-code-card" aria-label="defineWorkflow excerpt">
              <header>
                <span className="docs-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                src/lib/workflows/booking.ts
              </header>
              <pre>
                <span className="docs-kw">import</span> {"{ "}
                <span className="docs-fn">defineWorkflow</span>
                {" } "}
                <span className="docs-kw">from</span>{" "}
                <span className="docs-str">&quot;@inherit/core&quot;</span>
                {";\n\n"}
                <span className="docs-kw">export const</span> bookingWorkflow ={" "}
                <span className="docs-fn">defineWorkflow</span>
                {"({\n"}
                {"  id: "}
                <span className="docs-str">&quot;booking&quot;</span>
                {",\n"}
                {"  form: bookingForm,\n"}
                {"  schemaToolName: "}
                <span className="docs-str">&quot;get_form_schema&quot;</span>
                {",\n"}
                {"  submitToolName: "}
                <span className="docs-str">&quot;submit_step&quot;</span>
                {",\n"}
                {"  submitAvailable: (s) => s.recordStatus !== "}
                <span className="docs-str">&quot;confirmed&quot;</span>
                {",\n"}
                {"  actions: [\n"}
                {"    { name: "}
                <span className="docs-str">&quot;book_slot&quot;</span>
                {", available: hasGuest },\n"}
                {"    { name: "}
                <span className="docs-str">&quot;reschedule_booking&quot;</span>
                {", available: isBooked },\n"}
                {"  ],\n"}
                {"});"}
              </pre>
            </aside>
          </div>
        </section>

        <section className="docs-section" id="idea">
          <div className="docs-wrap">
            <div className="docs-section-head">
              <p className="docs-label">The idea</p>
              <h2>One definition. Four outputs. One session.</h2>
            </div>
            <div className="docs-proof">
              <article>
                <h3>Human UI</h3>
                <p>
                  Steps, fields, and buttons come from the workflow. The React bindings read the
                  same session the tools write.
                </p>
              </article>
              <article>
                <h3>WebMCP tools</h3>
                <p>
                  <code>getAvailableTools</code> lists what is legal right now.{" "}
                  <code>book_slot</code> disappears after confirmation.{" "}
                  <code>reschedule_booking</code> takes its place.
                </p>
              </article>
              <article>
                <h3>Validation and actions</h3>
                <p>
                  Tool calls are not trusted. They run the same validators as the form, then the
                  same domain handlers. Booking is one app. The brief is another.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="docs-section" id="use-cases">
          <div className="docs-wrap">
            <div className="docs-section-head">
              <p className="docs-label">Use cases</p>
              <h2>Three demos. Same SDK.</h2>
            </div>
            <div className="docs-use">
              <article>
                <h3>Appointment with capacity</h3>
                <p>
                  30-minute slots, three seats, lunch closed. A human walks the steps. An agent
                  can propose a time or book the one already on screen.
                </p>
                <Link href="/demo/atelier">Open Atelier Lumen</Link>
              </article>
              <article>
                <h3>Creative brief</h3>
                <p>
                  Goal, deliverable, constraints, review. Tools are{" "}
                  <code>get_brief_schema</code> and <code>submit_project_brief</code>, not
                  calendar calls. Proof the runtime is not booking-shaped.
                </p>
                <Link href="/demo/studio">Open Studio Nocturne</Link>
              </article>
              <article>
                <h3>The same card, two hosts</h3>
                <p>
                  Atelier gets cream paper, terracotta, and a serif. Northline gets hairline
                  radius and electric blue. Pass a token preset. Do not fork the form.
                </p>
                <Link href="/demo/compare">Open the compare page</Link>
              </article>
            </div>
          </div>
        </section>

        <section className="docs-section" id="proof">
          <div className="docs-wrap">
            <div className="docs-section-head">
              <p className="docs-label">From the running app</p>
              <h2>Real pages, not product shots.</h2>
            </div>
            <div className="docs-shots">
              <Shot
                src="/docs/booking-confirm.png"
                alt="Atelier Lumen booking form after a confirmed 30-minute consult"
                width={1440}
                height={1040}
                url="localhost:3000/demo/atelier"
                priority
                caption="A finished booking on Atelier Lumen. Ada walked Who you are, What you need, Pick a time, Confirm. That confirmation is the same SessionRecord an agent would write with book_slot."
              />
              <Shot
                src="/docs/token-compare.png"
                alt="The same Inherit form inside Atelier Lumen and Northline side by side"
                width={1600}
                height={1040}
                url="localhost:3000/demo/compare"
                caption="One component, two hosts. Left inherits cream paper, terracotta, and a serif. Right inherits near-black, electric blue, and a 2px radius. The steps and copy stay the same."
              />
              <div className="docs-shot-pair">
                <Shot
                  src="/docs/studio-brief.png"
                  alt="Studio Nocturne creative brief on the review step with a filled summary"
                  width={1440}
                  height={960}
                  url="localhost:3000/demo/studio"
                  caption="Studio Nocturne is a second workflow. Different steps, different tools, same createWorkflowRuntime. This is the proof Inherit is not a booking product with agent varnish."
                />
                <Shot
                  src="/docs/inspector-tools.png"
                  alt="Inherit inspector listing live capabilities after a confirmed booking"
                  width={1440}
                  height={1040}
                  url="localhost:3000/demo/atelier?inspect=1"
                  caption="Inspector after confirmation. book_slot is gone. reschedule_booking and cancel_booking are live on the session Ada just finished. Capabilities follow the workflow, not a static tool list."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section" id="how">
          <div className="docs-wrap">
            <div className="docs-section-head">
              <p className="docs-label">How it works</p>
              <h2>The runtime is the product.</h2>
            </div>
            <div className="docs-flow">
              <div className="docs-step">
                <span className="docs-idx">01</span>
                <div>
                  <strong>defineWorkflow</strong>
                  <p>
                    List steps, fields, actions, and when each action is legal. Booking and the
                    brief are two of these objects in <code>src/lib/workflows</code>.
                  </p>
                </div>
              </div>
              <div className="docs-step">
                <span className="docs-idx">02</span>
                <div>
                  <strong>createWorkflowRuntime</strong>
                  <p>
                    The runtime projects the definition into UI state,{" "}
                    <code>getAvailableTools</code>, server validation, and SQLite session plus
                    activity.
                  </p>
                </div>
              </div>
              <div className="docs-step">
                <span className="docs-idx">03</span>
                <div>
                  <strong>Humans and agents share one SessionRecord</strong>
                  <p>
                    Drafts, buttons, and tools hit <code>/api/form/*</code> or{" "}
                    <code>/api/workflow/action</code>. If an agent books while the page is open,
                    the page jumps to confirmation.
                  </p>
                </div>
              </div>
              <div className="docs-step">
                <span className="docs-idx">04</span>
                <div>
                  <strong>Host tokens, not a theme fork</strong>
                  <p>
                    The form reads <code>--inh-*</code> variables. Presets are{" "}
                    <code>inherit</code>, <code>atelier</code>, <code>northline</code>, and{" "}
                    <code>host</code>. Same card. Different room.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section" id="api">
          <div className="docs-wrap">
            <div className="docs-section-head">
              <p className="docs-label">Public API</p>
              <h2>Three packages. Workspace imports only.</h2>
            </div>
            <div className="docs-api">
              <article>
                <header>
                  <h3>@inherit/core</h3>
                  <p>
                    <code>defineWorkflow</code> and <code>createWorkflowRuntime</code>. Session,
                    capabilities, validation.
                  </p>
                </header>
                <pre className="docs-pre">
                  <span className="docs-kw">import</span>
                  {" {\n  "}
                  <span className="docs-fn">defineWorkflow</span>
                  {",\n  "}
                  <span className="docs-fn">createWorkflowRuntime</span>
                  {",\n"}
                  {"} "}
                  <span className="docs-kw">from</span>{" "}
                  <span className="docs-str">&quot;@inherit/core&quot;</span>
                  {";\n\n"}
                  <span className="docs-kw">const</span> runtime ={" "}
                  <span className="docs-fn">createWorkflowRuntime</span>
                  {"({\n"}
                  {"  store,\n  workflows,\n  snapshot,\n  getHandlers,\n"}
                  {"});"}
                </pre>
              </article>
              <article>
                <header>
                  <h3>@inherit/react</h3>
                  <p>
                    <code>InheritProvider</code>, <code>useSession</code>,{" "}
                    <code>useAvailableActions</code>. Bind a page to the open session.
                  </p>
                </header>
                <pre className="docs-pre">
                  <span className="docs-kw">import</span>
                  {" {\n  "}
                  <span className="docs-fn">InheritProvider</span>
                  {",\n  "}
                  <span className="docs-fn">useSession</span>
                  {",\n  "}
                  <span className="docs-fn">useAvailableActions</span>
                  {",\n"}
                  {"} "}
                  <span className="docs-kw">from</span>{" "}
                  <span className="docs-str">&quot;@inherit/react&quot;</span>
                  {";\n\n"}
                  <span className="docs-fn">useSession</span>
                  {"().session?.currentStepId;\n"}
                  <span className="docs-fn">useAvailableActions</span>
                  {"().map((a) => a.name);"}
                </pre>
              </article>
              <article>
                <header>
                  <h3>@inherit/webmcp</h3>
                  <p>
                    <code>createWebMcpAdapter</code> and <code>registerWorkflowTools</code>.
                    Tools come from the live capability list, then tear down with AbortSignal.
                  </p>
                </header>
                <pre className="docs-pre">
                  <span className="docs-kw">import</span>
                  {" {\n  "}
                  <span className="docs-fn">createWebMcpAdapter</span>
                  {",\n  "}
                  <span className="docs-fn">registerWorkflowTools</span>
                  {",\n"}
                  {"} "}
                  <span className="docs-kw">from</span>{" "}
                  <span className="docs-str">&quot;@inherit/webmcp&quot;</span>
                  {";\n\n"}
                  <span className="docs-kw">const</span> adapter ={" "}
                  <span className="docs-fn">createWebMcpAdapter</span>
                  {"({ getSessionId, getWorkflowId });\n"}
                  <span className="docs-kw">await</span>{" "}
                  <span className="docs-fn">registerWorkflowTools</span>
                  {"(adapter, caps, meta);"}
                </pre>
              </article>
              <article>
                <header>
                  <h3>Install</h3>
                  <p>
                    This repo is the package. Do not run <code>npm install inherit</code>. The
                    name is reserved for later. Today you import the workspace paths.
                  </p>
                </header>
                <pre className="docs-pre">
                  <span className="docs-cm">
                    {"// tsconfig paths in this repo\n"}
                  </span>
                  <span className="docs-str">&quot;@inherit/core&quot;</span>
                  {": "}
                  <span className="docs-str">&quot;./src/inherit/core/index.ts&quot;</span>
                  {",\n"}
                  <span className="docs-str">&quot;@inherit/react&quot;</span>
                  {": "}
                  <span className="docs-str">&quot;./src/inherit/react/index.tsx&quot;</span>
                  {",\n"}
                  <span className="docs-str">&quot;@inherit/webmcp&quot;</span>
                  {": "}
                  <span className="docs-str">&quot;./src/inherit/webmcp/index.ts&quot;</span>
                </pre>
              </article>
            </div>
            <div className="docs-import" style={{ marginTop: "1rem" }}>
              <pre className="docs-pre">
                <span className="docs-kw">import</span>
                {" { defineWorkflow, createWorkflowRuntime } "}
                <span className="docs-kw">from</span>{" "}
                <span className="docs-str">&quot;@inherit/core&quot;</span>
                {";\n"}
                <span className="docs-kw">import</span>
                {" { InheritProvider, useSession, useAvailableActions } "}
                <span className="docs-kw">from</span>{" "}
                <span className="docs-str">&quot;@inherit/react&quot;</span>
                {";\n"}
                <span className="docs-kw">import</span>
                {" { createWebMcpAdapter, registerWorkflowTools } "}
                <span className="docs-kw">from</span>{" "}
                <span className="docs-str">&quot;@inherit/webmcp&quot;</span>
                {";"}
              </pre>
              <p className="docs-note">
                <code>package.json</code> stays <code>private: true</code>. MIT license. Source
                is public at{" "}
                <a href={GITHUB}>github.com/allangmr/inherit</a>. Booking lives on{" "}
                <Link href="/book">/book</Link> for ChatGPT. This page is the package.
              </p>
            </div>
          </div>
        </section>

        <section className="docs-section" id="demos">
          <div className="docs-wrap">
            <div className="docs-section-head">
              <p className="docs-label">Live demos</p>
              <h2>Open the running workflows.</h2>
            </div>
            <div className="docs-demos">
              {demos.map((demo) => (
                <Link key={demo.href} href={demo.href}>
                  <code>{demo.path}</code>
                  <strong>{demo.title}</strong>
                  <span>{demo.copy}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="docs-foot">
        <div className="docs-wrap docs-foot-row">
          <p>Inherit · in-repo SDK · MIT · OpenAI WebMCP Challenge 2026</p>
          <p>
            <a href={GITHUB}>GitHub</a>
            {" · "}
            <Link href="/book">/book</Link>
            {" · "}
            not published to npm
          </p>
        </div>
      </footer>
    </div>
  );
}

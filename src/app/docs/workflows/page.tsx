import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidePager } from "@/components/docs/guide-pager";
import { SNIPPET_DEFINE } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Workflows",
  description:
    "WorkflowDefinition fields, form steps, actions, and when booking capabilities appear or disappear.",
};

export default function DocsWorkflowsPage() {
  return (
    <article className="guide-article">
      <p className="guide-kicker">Workflows</p>
      <h1>The definition is the product.</h1>
      <p className="guide-lede">
        A <code>WorkflowDefinition</code> lists the form, the two always-on tool names, when
        submit is legal, and every domain action. The runtime does not invent tools. It
        projects this object against a <code>CapabilitySnapshot</code>.
      </p>

      <h2>Shape</h2>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>id, version, title, description</td>
              <td>Identity shown on the client state and inspector.</td>
            </tr>
            <tr>
              <td>form</td>
              <td>
                <code>FormDefinition</code>: steps with fields. Field types are text, email,
                tel, textarea, select, radio, checkbox, slot.
              </td>
            </tr>
            <tr>
              <td>schemaToolName / Description</td>
              <td>
                Always present in <code>getAvailableTools</code>. Booking uses{" "}
                <code>get_form_schema</code>. The brief uses <code>get_brief_schema</code>.
              </td>
            </tr>
            <tr>
              <td>submitToolName / Description</td>
              <td>
                Added when <code>submitAvailable(snapshot)</code> is true. Booking:{" "}
                <code>submit_step</code> until the record is confirmed.
              </td>
            </tr>
            <tr>
              <td>actions</td>
              <td>
                Each <code>WorkflowAction</code> has <code>available(snapshot)</code>. False
                means the name is not a capability.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Steps and fields</h2>
      <p>
        Booking walks identity → need → slot → confirm. The brief walks goal → deliverables →
        constraints → review. <code>validateStep</code> runs the field rules on submit.{" "}
        <code>projectForm</code> is what the React card renders: step index and{" "}
        <code>field.validation</code> instead of <code>rules</code>.
      </p>
      <p>
        Field rules are <code>required</code>, <code>minLength</code>, <code>maxLength</code>,{" "}
        <code>pattern</code>, and <code>patternMessage</code>. Humans and agents hit the same
        functions.
      </p>

      <h2>When capabilities appear</h2>
      <p>
        <code>getAvailableActions(workflow, snapshot)</code> always starts with the schema
        tool. Then submit, if allowed. Then every action whose <code>available</code> returns
        true. Booking&apos;s snapshot reads the calendar row into{" "}
        <code>recordStatus</code>: <code>none</code>, <code>confirmed</code>, or{" "}
        <code>cancelled</code>.
      </p>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Live tools</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Empty booking</td>
              <td>
                <code>get_form_schema</code>, <code>submit_step</code>
              </td>
            </tr>
            <tr>
              <td>Name and email present, not booked</td>
              <td>
                plus <code>get_available_slots</code>, <code>propose_slot</code>,{" "}
                <code>book_slot</code>
              </td>
            </tr>
            <tr>
              <td>Confirmed booking</td>
              <td>
                <code>book_slot</code> and <code>submit_step</code> are gone.{" "}
                <code>get_booking_status</code>, <code>reschedule_booking</code>,{" "}
                <code>cancel_booking</code> appear.
              </td>
            </tr>
            <tr>
              <td>Pending proposal</td>
              <td>
                <code>commit_proposal</code> and <code>reject_proposal</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        That swap is the point. After confirmation the agent cannot book again through a stale
        tool list. It can reschedule or cancel. <code>cancel_booking</code> sets{" "}
        <code>requiresConfirmation: true</code>, so an agent call creates a proposal the human
        confirms.
      </p>
      <CodeBlock filename="src/lib/workflows/booking.ts" code={SNIPPET_DEFINE} />

      <h2>A second workflow</h2>
      <p>
        <code>src/lib/workflows/brief.ts</code> proves the runtime is not booking-shaped.
        Tools are <code>get_brief_schema</code>, <code>update_brief</code>,{" "}
        <code>suggest_deliverables</code>, <code>submit_project_brief</code>. Open{" "}
        <Link href="/demo/studio">/demo/studio</Link>. Same{" "}
        <code>createWorkflowRuntime</code>, different definition.
      </p>
      <GuidePager href="/docs/workflows" />
    </article>
  );
}

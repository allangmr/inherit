export const SNIPPET_WORKSPACE_PATHS = `{
  "compilerOptions": {
    "paths": {
      "@inherit/core": ["./src/inherit/core/index.ts"],
      "@inherit/react": ["./src/inherit/react/index.tsx"],
      "@inherit/webmcp": ["./src/inherit/webmcp/index.ts"]
    }
  }
}`;

export const SNIPPET_PACKAGE_EXPORTS = `{
  "name": "inherit",
  "private": true,
  "license": "MIT",
  "exports": {
    "./core": "./src/inherit/core/index.ts",
    "./react": "./src/inherit/react/index.tsx",
    "./webmcp": "./src/inherit/webmcp/index.ts"
  }
}`;

export const SNIPPET_CLONE = `git clone https://github.com/allangmr/inherit.git
cd inherit
npm install
npm run dev`;

export const SNIPPET_NPM_FUTURE = `npm install inherit
# or, if published as scoped packages:
npm install @inherit/core @inherit/react @inherit/webmcp`;

export const SNIPPET_DEFINE = `import { defineWorkflow, type FormValues } from "@inherit/core";

export function hasIdentity(values: FormValues) {
  return String(values.name ?? "").trim().length >= 2 && String(values.email ?? "").includes("@");
}

export const bookingWorkflow = defineWorkflow({
  id: "booking",
  version: 1,
  title: "Book a 30-minute consult",
  description: "Humans fill the steps. Agents call the same tools against the same state.",
  form: bookingForm,
  schemaToolName: "get_form_schema",
  schemaToolDescription:
    "Return the booking workflow, session values, capabilities, and activity.",
  submitToolName: "submit_step",
  submitToolDescription:
    "Validate and persist one step, then advance. Same path as the human UI.",
  submitAvailable: (snapshot) => snapshot.recordStatus !== "confirmed",
  actions: [
    {
      name: "book_slot",
      description: "Book the consult using the shared session.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) =>
        hasIdentity(snapshot.values) && snapshot.recordStatus !== "confirmed",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          sessionId: { type: "string" },
          slotId: { type: "string" },
        },
      },
    },
    {
      name: "reschedule_booking",
      description: "Move a confirmed booking to a different free slot.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.recordStatus === "confirmed",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["slotId"],
        properties: {
          sessionId: { type: "string" },
          slotId: { type: "string" },
        },
      },
    },
  ],
});`;

export const SNIPPET_RUNTIME = `import { createWorkflowRuntime } from "@inherit/core";
import { getStore } from "./sqlite-store";
import { getWorkflow } from "./workflows/registry";
import { createDemoHandlers } from "./demo/action-handlers";

const store = {
  getSession: (id) => getStore().getSession(id),
  upsertSession: (session) => getStore().upsertSession(session),
  compareAndSetSession: (session, expectedVersion) =>
    getStore().compareAndSetSession(session, expectedVersion),
  appendActivity: (entry) => getStore().appendActivity(entry),
  listActivity: (sessionId, limit) => getStore().listActivity(sessionId, limit),
};

const runtime = createWorkflowRuntime({
  store,
  workflows: { get: getWorkflow },
  snapshot,
  decorateState,
  applyProposalValues,
  getHandlers: createDemoHandlers,
});`;

export const SNIPPET_PROVIDER = `import { InheritProvider, useAvailableActions, useSession, useWorkflow } from "@inherit/react";

export function InheritForm({ workflowId = "booking" }: { workflowId?: string }) {
  return (
    <InheritProvider workflowId={workflowId}>
      <InheritFormView workflowId={workflowId} />
    </InheritProvider>
  );
}

function InheritFormView({ workflowId }: { workflowId: string }) {
  const { session, boot } = useSession();
  const { title } = useWorkflow();
  const capabilities = useAvailableActions();
  if (boot || !session) return <p>Loading {title}</p>;
  return (
    <p>
      {workflowId} · {session.currentStepId} · {capabilities.map((cap) => cap.name).join(", ")}
    </p>
  );
}`;

export const SNIPPET_WEBMCP = `import { createWebMcpAdapter, getModelContext, registerWorkflowTools } from "@inherit/webmcp";

const modelContext = document.modelContext || navigator.modelContext;
if (!modelContext) {
  // Chrome: chrome://flags/#enable-webmcp-testing then relaunch.
}

const controller = new AbortController();
const adapter = createWebMcpAdapter({
  getSessionId: () => sessionId,
  getWorkflowId: () => workflowId,
});

await registerWorkflowTools(
  adapter,
  capabilities,
  { schemaToolName: "get_form_schema", submitToolName: "submit_step" },
  { signal: controller.signal },
);

// When capabilities change, abort the previous registration and register again.
return () => controller.abort();`;

export const SNIPPET_DETECT = `const modelContext = document.modelContext || navigator.modelContext;`;

export const SNIPPET_IMPORTS = `import { defineWorkflow, createWorkflowRuntime, getAvailableTools } from "@inherit/core";
import { InheritProvider, useSession, useAvailableActions, useActivity } from "@inherit/react";
import { getModelContext, createWebMcpAdapter, registerWorkflowTools, registerTools } from "@inherit/webmcp";`;

export type ApiPackage = "core" | "react" | "webmcp";
export type ApiKind = "fn" | "class" | "const" | "type";

export type ApiSymbol = {
  name: string;
  pkg: ApiPackage;
  kind: ApiKind;
  summary: string;
};

export const API_CATALOG: ApiSymbol[] = [
  {
    name: "defineWorkflow",
    pkg: "core",
    kind: "fn",
    summary: "Validates that a WorkflowDefinition has at least one step, then returns it unchanged.",
  },
  {
    name: "createWorkflowRuntime",
    pkg: "core",
    kind: "fn",
    summary: "Constructs a WorkflowRuntime from store, registry, snapshot, and action handlers.",
  },
  {
    name: "WorkflowRuntime",
    pkg: "core",
    kind: "class",
    summary:
      "Session, draft, step submit, capability projection, proposals, and action dispatch. Public methods: getWorkflow, getSession, ensureSession, bumpSession, recordActivity, getActivity, snapshot, getAvailableActions, getAvailableTools, validateAction, getState, saveDraft, submitStep, executeAction, createProposal, commitProposal, rejectProposal.",
  },
  {
    name: "getAvailableActions",
    pkg: "core",
    kind: "fn",
    summary:
      "Projects schema tool, optional submit tool, and currently available actions from a CapabilitySnapshot.",
  },
  {
    name: "getAvailableTools",
    pkg: "core",
    kind: "fn",
    summary: "Alias of getAvailableActions. Same list the WebMCP adapter registers.",
  },
  {
    name: "capabilityNames",
    pkg: "core",
    kind: "fn",
    summary: "Maps a Capability[] to the name strings.",
  },
  {
    name: "capabilityDelta",
    pkg: "core",
    kind: "fn",
    summary: "Returns { added, removed } between two name lists. Used by the inspector.",
  },
  {
    name: "StaleSessionError",
    pkg: "core",
    kind: "class",
    summary: "Thrown when compareAndSetSession fails. Carries expected and actual versions.",
  },
  {
    name: "isStale",
    pkg: "core",
    kind: "fn",
    summary: "True when an error is a StaleSessionError. Route handlers map this to HTTP 409.",
  },
  {
    name: "parseActor",
    pkg: "core",
    kind: "fn",
    summary: 'Reads "human" | "agent" | "system". Anything else becomes human.',
  },
  {
    name: "actorFromRequest",
    pkg: "core",
    kind: "fn",
    summary: "parseActor on the x-inherit-actor header.",
  },
  {
    name: "actorHeaders",
    pkg: "core",
    kind: "fn",
    summary: "Builds { \"x-inherit-actor\": actor } for fetch calls.",
  },
  {
    name: "spokenActor",
    pkg: "core",
    kind: "fn",
    summary: 'Activity copy: agent → "ChatGPT", system → "System", else "You".',
  },
  {
    name: "emptySession",
    pkg: "core",
    kind: "fn",
    summary: "Creates a SessionRecord on the first form step with version 1 and no recordId.",
  },
  {
    name: "mergeProvenance",
    pkg: "core",
    kind: "fn",
    summary: "Records actor, timestamp, and source for fields that actually changed.",
  },
  {
    name: "nowIso",
    pkg: "core",
    kind: "fn",
    summary: "new Date().toISOString().",
  },
  {
    name: "redact",
    pkg: "core",
    kind: "fn",
    summary: "Replaces email-looking strings with [email] before activity is stored.",
  },
  {
    name: "getStep",
    pkg: "core",
    kind: "fn",
    summary: "Finds a FormStep by id, or null.",
  },
  {
    name: "nextStepId",
    pkg: "core",
    kind: "fn",
    summary: "The following step id, or null on the last step.",
  },
  {
    name: "previousStepId",
    pkg: "core",
    kind: "fn",
    summary: "The previous step id, or null on the first step.",
  },
  {
    name: "projectForm",
    pkg: "core",
    kind: "fn",
    summary: "Strips rules into a validation object and adds step index for the UI payload.",
  },
  {
    name: "validateField",
    pkg: "core",
    kind: "fn",
    summary: "required, minLength, maxLength, pattern. Returns a message or null.",
  },
  {
    name: "validateStep",
    pkg: "core",
    kind: "fn",
    summary: "Validates every field on one step. Unknown stepId returns a FieldError.",
  },
  {
    name: "validateAll",
    pkg: "core",
    kind: "fn",
    summary: "Validates every step in the form definition.",
  },
  {
    name: "JsonSchema",
    pkg: "core",
    kind: "type",
    summary: "Subset used on capability inputSchema: type, properties, required, enum, format, and friends.",
  },
  {
    name: "Actor",
    pkg: "core",
    kind: "type",
    summary: '"human" | "agent" | "system".',
  },
  {
    name: "ActivityRecord",
    pkg: "core",
    kind: "type",
    summary: "One row in the activity rail: actor, action, optional field, redacted values, summary.",
  },
  {
    name: "FieldProvenance",
    pkg: "core",
    kind: "type",
    summary: 'Who last wrote a field and how: input | tool | proposal | system.',
  },
  {
    name: "ProposalRecord",
    pkg: "core",
    kind: "type",
    summary: "Pending agent suggestion sitting on the session until commit or reject.",
  },
  {
    name: "SessionRecord",
    pkg: "core",
    kind: "type",
    summary:
      "The shared session: values, currentStepId, completedStepIds, recordId, version, provenance, proposal.",
  },
  {
    name: "WorkflowStore",
    pkg: "core",
    kind: "type",
    summary: "getSession, upsertSession, compareAndSetSession, appendActivity, listActivity.",
  },
  {
    name: "WorkflowRegistry",
    pkg: "core",
    kind: "type",
    summary: "{ get(id): WorkflowDefinition }. This app uses src/lib/workflows/registry.ts.",
  },
  {
    name: "ActionHandler",
    pkg: "core",
    kind: "type",
    summary: "Domain function for one action name. Receives session, payload, actor, optional version.",
  },
  {
    name: "ActionResult",
    pkg: "core",
    kind: "type",
    summary: "ok, errors, optional proposal and state, plus extra fields the handler wants to return.",
  },
  {
    name: "ActivityInput",
    pkg: "core",
    kind: "type",
    summary: "Arguments to recordActivity before the store assigns id and timestamp.",
  },
  {
    name: "Capability",
    pkg: "core",
    kind: "type",
    summary: "A tool the current session may expose: name, description, readOnly, requiresConfirmation, inputSchema.",
  },
  {
    name: "CapabilitySnapshot",
    pkg: "core",
    kind: "type",
    summary: "workflowId, currentStepId, values, completedStepIds, recordStatus, hasProposal.",
  },
  {
    name: "ProposalApply",
    pkg: "core",
    kind: "type",
    summary: "How commit_proposal writes accepted values back onto the session.",
  },
  {
    name: "RecordStatus",
    pkg: "core",
    kind: "type",
    summary: '"none" | "confirmed" | "cancelled". Booking maps this from the calendar row.',
  },
  {
    name: "WorkflowAction",
    pkg: "core",
    kind: "type",
    summary: "Named action plus available(snapshot). False means it is omitted from getAvailableTools.",
  },
  {
    name: "WorkflowDefinition",
    pkg: "core",
    kind: "type",
    summary: "id, version, title, form, schema/submit tool names, submitAvailable, actions.",
  },
  {
    name: "WorkflowRuntimeConfig",
    pkg: "core",
    kind: "type",
    summary:
      "store, workflows, snapshot, getHandlers, plus optional decorateState, formatDraftValue, shouldRecordDraftField, applyProposalValues.",
  },
  {
    name: "WorkflowState",
    pkg: "core",
    kind: "type",
    summary: "What getState returns: workflow meta, projected form, session, proposal, capabilities, activity.",
  },
  {
    name: "FieldError",
    pkg: "core",
    kind: "type",
    summary: "{ fieldId, message }.",
  },
  {
    name: "FieldRule",
    pkg: "core",
    kind: "type",
    summary: "required, minLength, maxLength, pattern, patternMessage.",
  },
  {
    name: "FieldType",
    pkg: "core",
    kind: "type",
    summary: "text | email | tel | textarea | select | radio | checkbox | slot.",
  },
  {
    name: "FormDefinition",
    pkg: "core",
    kind: "type",
    summary: "id, title, description, steps, optional durationMinutes, timezone, location.",
  },
  {
    name: "FormField",
    pkg: "core",
    kind: "type",
    summary: "id, type, label, optional hint/placeholder/options, rules.",
  },
  {
    name: "FormStep",
    pkg: "core",
    kind: "type",
    summary: "id, title, subtitle, fields.",
  },
  {
    name: "FormValues",
    pkg: "core",
    kind: "type",
    summary: "Record<string, string | boolean | undefined>.",
  },
  {
    name: "ProjectedForm",
    pkg: "core",
    kind: "type",
    summary: "UI-facing form: step index and field.validation instead of rules.",
  },
  {
    name: "InheritProvider",
    pkg: "react",
    kind: "fn",
    summary:
      "Loads /api/form/schema, stores sessionId in sessionStorage, polls every 2s, listens for inherit:state.",
  },
  {
    name: "useSession",
    pkg: "react",
    kind: "fn",
    summary: "sessionId, boot, state, session, proposal, applyState, setState.",
  },
  {
    name: "useWorkflow",
    pkg: "react",
    kind: "fn",
    summary: "workflowId, workflow, form, title, description.",
  },
  {
    name: "useAvailableActions",
    pkg: "react",
    kind: "fn",
    summary: "state.capabilities, or [] before boot.",
  },
  {
    name: "useActivity",
    pkg: "react",
    kind: "fn",
    summary: "state.activity, or [].",
  },
  {
    name: "extractState",
    pkg: "react",
    kind: "fn",
    summary: "Pulls ClientWorkflowState from a payload or payload.state. Null without session.id.",
  },
  {
    name: "reconcilePolledState",
    pkg: "react",
    kind: "fn",
    summary:
      "Keeps a settled booking/brief from being clobbered by a regressive poll, and keeps local string edits that are prefixes of the server value.",
  },
  {
    name: "useInheritContext",
    pkg: "react",
    kind: "fn",
    summary: "Raw context. Throws if you render outside InheritProvider.",
  },
  {
    name: "InheritContext",
    pkg: "react",
    kind: "const",
    summary: "The React context object. Prefer the hooks.",
  },
  {
    name: "WORKFLOW_STATE_EVENT",
    pkg: "react",
    kind: "const",
    summary: '"inherit:state". Same string as INHERIT_STATE_EVENT in webmcp.',
  },
  {
    name: "WORKFLOW_TOOL_EVENT",
    pkg: "react",
    kind: "const",
    summary: '"inherit:tool". Same string as INHERIT_TOOL_EVENT in webmcp.',
  },
  {
    name: "ClientWorkflowState",
    pkg: "react",
    kind: "type",
    summary: "Client shape of workflow + form + session + optional booking, proposal, capabilities, activity.",
  },
  {
    name: "getModelContext",
    pkg: "webmcp",
    kind: "fn",
    summary: "document.modelContext ?? navigator.modelContext when registerTool exists.",
  },
  {
    name: "getModelContextTesting",
    pkg: "webmcp",
    kind: "fn",
    summary: "navigator.modelContextTesting. Used by the Chrome lab.",
  },
  {
    name: "probeWebMcp",
    pkg: "webmcp",
    kind: "fn",
    summary: "Boolean snapshot of secureContext, both modelContext locations, register/get/execute, and testing APIs.",
  },
  {
    name: "registerTools",
    pkg: "webmcp",
    kind: "fn",
    summary: "Calls context.registerTool for each tool, passing signal and exposedTo. Returns { supported, registered }.",
  },
  {
    name: "registerWorkflowTools",
    pkg: "webmcp",
    kind: "fn",
    summary: "adapter.toolsFrom(capabilities, meta) then registerTools.",
  },
  {
    name: "createWebMcpAdapter",
    pkg: "webmcp",
    kind: "fn",
    summary:
      "Maps capabilities to tools that hit /api/form/schema, /api/form/step, or /api/workflow/action, then broadcast inherit:state.",
  },
  {
    name: "listRegisteredTools",
    pkg: "webmcp",
    kind: "fn",
    summary: "Producer getTools, else testing getTools/listTools.",
  },
  {
    name: "executeRegisteredTool",
    pkg: "webmcp",
    kind: "fn",
    summary: "Runs a tool through the Chrome testing API or producer executeTool.",
  },
  {
    name: "isSecureContextForWebMcp",
    pkg: "webmcp",
    kind: "fn",
    summary: "window.isSecureContext. WebMCP needs HTTPS or localhost.",
  },
  {
    name: "broadcastFormState",
    pkg: "webmcp",
    kind: "fn",
    summary: "Dispatches inherit:state so InheritProvider can apply the new session.",
  },
  {
    name: "broadcastToolTrace",
    pkg: "webmcp",
    kind: "fn",
    summary: "Dispatches inherit:tool for the inspector rail.",
  },
  {
    name: "apiFetch",
    pkg: "webmcp",
    kind: "fn",
    summary: "fetch with content-type JSON, x-inherit-actor, and optional AbortSignal.",
  },
  {
    name: "INHERIT_STATE_EVENT",
    pkg: "webmcp",
    kind: "const",
    summary: '"inherit:state".',
  },
  {
    name: "INHERIT_TOOL_EVENT",
    pkg: "webmcp",
    kind: "const",
    summary: '"inherit:tool".',
  },
  {
    name: "WebMcpStatus",
    pkg: "webmcp",
    kind: "type",
    summary: '"ready" | "unavailable" | "registering" | "error".',
  },
  {
    name: "ToolTrace",
    pkg: "webmcp",
    kind: "type",
    summary: "name, input, result, durationMs, actor, timestamp.",
  },
  {
    name: "WebMcpAdapterConfig",
    pkg: "webmcp",
    kind: "type",
    summary: "getSessionId, getWorkflowId, optional actor (default agent) and request.",
  },
  {
    name: "WorkflowToolMeta",
    pkg: "webmcp",
    kind: "type",
    summary: "schemaToolName and submitToolName so the adapter can pick the right HTTP path.",
  },
];

export function catalogByPackage(pkg: ApiPackage) {
  return API_CATALOG.filter((item) => item.pkg === pkg);
}

export function catalogNames() {
  return API_CATALOG.map((item) => item.name).sort();
}

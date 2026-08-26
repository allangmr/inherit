export const RUNTIME_CHART = `flowchart TD
  A["WorkflowDefinition<br/>steps · fields · actions"] --> B["Human UI"]
  A --> C["WebMCP tools"]
  A --> D["Validation"]
  B --> E["Shared SessionRecord"]
  C --> E
  D --> E
  E --> F["Domain actions"]`;

export const PACKAGE_CHART = `flowchart TD
  CORE["@inherit/core<br/>defineWorkflow · runtime · getAvailableTools"]
  REACT["@inherit/react<br/>InheritProvider · hooks"]
  MCP["@inherit/webmcp<br/>createWebMcpAdapter · registerWorkflowTools"]
  APP["Next.js app<br/>inherit-runtime.ts · inherit-form · webmcp-bridge"]
  HOSTS["Hosts<br/>/book · /demo/atelier · /demo/studio"]
  CORE --> APP
  REACT --> APP
  MCP --> APP
  APP --> HOSTS`;

export const REQUEST_CHART = `flowchart TD
  H["Human · InheritForm"] --> API["Same API routes<br/>/api/form/schema · /api/form/step · /api/workflow/action"]
  A["Agent · registerTool on /book"] --> API
  API --> RT["WorkflowRuntime<br/>actorFromRequest · validateStep · executeAction"]
  RT --> ST["WorkflowStore<br/>SQLite session + activity"]
  RT --> DH["Domain handlers<br/>calendar book / reschedule / cancel"]`;

export const CAPABILITY_CHART = `flowchart LR
  E["Empty<br/>get_form_schema<br/>submit_step"] --> I["Name + email<br/>+ get_available_slots<br/>+ propose_slot<br/>+ book_slot"]
  I --> C["Confirmed<br/>book_slot gone<br/>+ reschedule_booking<br/>+ cancel_booking"]`;

import type { FormDefinition } from "@inherit/core";
import { defineWorkflow } from "@inherit/core";

export const BRIEF_FORM_ID = "studio-project-brief";

export const briefForm: FormDefinition = {
  id: BRIEF_FORM_ID,
  title: "Creative project brief",
  description:
    "Humans and agents refine the same brief. One session, one validation path, then a single submit.",
  durationMinutes: 0,
  timezone: "America/Los_Angeles",
  location: "Studio",
  steps: [
    {
      id: "goal",
      title: "Goal",
      subtitle: "What are you trying to create?",
      fields: [
        {
          id: "goal",
          type: "textarea",
          label: "The outcome",
          placeholder: "A landing page for the autumn collection that feels editorial, not templated.",
          rules: { required: true, minLength: 8, maxLength: 800 },
        },
        {
          id: "audience",
          type: "text",
          label: "Who is it for?",
          placeholder: "Art directors at independent fashion houses",
          rules: { required: true, minLength: 2, maxLength: 120 },
        },
      ],
    },
    {
      id: "deliverables",
      title: "Deliverables",
      subtitle: "Pick the primary artifact. Add others in the notes.",
      fields: [
        {
          id: "deliverable",
          type: "radio",
          label: "Primary deliverable",
          rules: { required: true },
          options: [
            { value: "landing_page", label: "Landing page", description: "One page, one offer." },
            { value: "design_system", label: "Design system", description: "Tokens, type, components." },
            { value: "prototype", label: "Prototype", description: "A clickable path through the product." },
            { value: "brand_refresh", label: "Brand refresh", description: "Voice, color, and a small lockup." },
          ],
        },
        {
          id: "extras",
          type: "textarea",
          label: "Also include",
          placeholder: "Motion studies, a print leave-behind, CMS wiring…",
          rules: { maxLength: 400 },
        },
      ],
    },
    {
      id: "constraints",
      title: "Constraints",
      subtitle: "Deadline, budget, and what already exists.",
      fields: [
        {
          id: "deadline",
          type: "text",
          label: "Deadline",
          placeholder: "First review in 10 days",
          rules: { required: true, minLength: 2, maxLength: 80 },
        },
        {
          id: "budget",
          type: "select",
          label: "Budget range",
          rules: { required: true },
          options: [
            { value: "seed", label: "Seed · under $8k" },
            { value: "standard", label: "Standard · $8k–$25k" },
            { value: "retained", label: "Retained · ongoing" },
          ],
        },
        {
          id: "brand",
          type: "text",
          label: "Existing brand system",
          placeholder: "We have a wordmark and two colors. No type spec.",
          rules: { maxLength: 200 },
        },
        {
          id: "stack",
          type: "text",
          label: "Required technologies",
          placeholder: "Next.js, WebMCP, no client CMS",
          rules: { maxLength: 200 },
        },
      ],
    },
    {
      id: "review",
      title: "Review",
      subtitle: "Human and agent refine together, then lock the brief.",
      fields: [
        {
          id: "ready",
          type: "checkbox",
          label: "This brief is ready to send to the studio.",
          rules: { required: true },
        },
      ],
    },
  ],
};

export const briefWorkflow = defineWorkflow({
  id: "brief",
  version: 1,
  title: briefForm.title,
  description: briefForm.description,
  form: briefForm,
  schemaToolName: "get_brief_schema",
  schemaToolDescription:
    "Return the creative brief workflow, current values, missing fields, and available capabilities.",
  submitToolName: "update_brief",
  submitToolDescription:
    "Validate and persist one step of the brief (goal, deliverables, constraints, review), then advance.",
  submitAvailable: (snapshot) => snapshot.values.submitted !== true,
  actions: [
    {
      name: "suggest_deliverables",
      description:
        "Suggest a primary deliverable from the goal text. Writes a proposal the human can accept or ignore.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => Boolean(snapshot.values.goal) && snapshot.values.submitted !== true,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
    {
      name: "identify_missing_information",
      description: "List required fields that are still empty.",
      readOnly: true,
      requiresConfirmation: false,
      available: () => true,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
    {
      name: "submit_project_brief",
      description: "Lock the brief. Requires every required field plus the review checkbox.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.values.submitted !== true,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          sessionId: { type: "string" },
          values: { type: "object", additionalProperties: true },
        },
      },
    },
    {
      name: "get_brief_status",
      description: "Return whether the brief is in progress or submitted, plus current values.",
      readOnly: true,
      requiresConfirmation: false,
      available: () => true,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
    {
      name: "commit_proposal",
      description: "Accept the pending suggestion on this brief.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.hasProposal,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
    {
      name: "reject_proposal",
      description: "Dismiss the pending suggestion.",
      readOnly: false,
      requiresConfirmation: false,
      available: (snapshot) => snapshot.hasProposal,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
  ],
});

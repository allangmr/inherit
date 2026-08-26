import { FORM_ID, SLOT_MINUTES } from "./config";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "slot";

export type FieldRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
};

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  hint?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  rules: FieldRule;
};

export type FormStep = {
  id: string;
  title: string;
  subtitle: string;
  fields: FormField[];
};

export type FormDefinition = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  timezone: string;
  location: string;
  steps: FormStep[];
};

export const formDefinition: FormDefinition = {
  id: FORM_ID,
  title: "Book a 30-minute consult",
  description:
    "A focused working session with a practitioner. Humans fill the steps; agents call the same tools against the same state.",
  durationMinutes: SLOT_MINUTES,
  timezone: "America/Los_Angeles",
  location: "Lumen Studio · Portland (in-person or video)",
  steps: [
    {
      id: "identity",
      title: "Who you are",
      subtitle: "We’ll use this only for the booking confirmation.",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Full name",
          placeholder: "Ada Lovelace",
          rules: { required: true, minLength: 2, maxLength: 80 },
        },
        {
          id: "email",
          type: "email",
          label: "Email",
          placeholder: "ada@example.com",
          rules: {
            required: true,
            pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            patternMessage: "Enter a valid email address.",
          },
        },
        {
          id: "phone",
          type: "tel",
          label: "Phone (optional)",
          placeholder: "+1 503 555 0199",
          hint: "If we need to reach you about the slot.",
          rules: {
            pattern: "^[+]?[\\d\\s().-]{7,20}$",
            patternMessage: "Enter a phone number or leave this blank.",
          },
        },
      ],
    },
    {
      id: "need",
      title: "What you need",
      subtitle: "Helps us prepare the right 30 minutes.",
      fields: [
        {
          id: "service",
          type: "radio",
          label: "Session type",
          rules: { required: true },
          options: [
            {
              value: "first_consult",
              label: "First consult",
              description: "New here. We’ll map goals and the right next step.",
            },
            {
              value: "follow_up",
              label: "Follow-up",
              description: "Continuing work. Bring notes from last time if you have them.",
            },
            {
              value: "focused",
              label: "Focused working session",
              description: "One problem, one artifact, one decision.",
            },
          ],
        },
        {
          id: "format",
          type: "select",
          label: "How should we meet?",
          rules: { required: true },
          options: [
            { value: "studio", label: "In studio · Portland" },
            { value: "video", label: "Video call" },
          ],
        },
        {
          id: "notes",
          type: "textarea",
          label: "What should we cover?",
          placeholder: "A sentence or two is enough.",
          rules: { maxLength: 500 },
        },
      ],
    },
    {
      id: "slot",
      title: "Pick a time",
      subtitle: "30-minute slots. Each slot holds up to 3 concurrent bookings.",
      fields: [
        {
          id: "slotId",
          type: "slot",
          label: "Available times",
          rules: { required: true },
        },
      ],
    },
    {
      id: "confirm",
      title: "Confirm",
      subtitle: "Review the details, then lock the slot.",
      fields: [
        {
          id: "consent",
          type: "checkbox",
          label: "I understand this reserves a real slot on the demo calendar.",
          rules: { required: true },
        },
      ],
    },
  ],
};

export type FormValues = Record<string, string | boolean | undefined>;

export type FieldError = { fieldId: string; message: string };

export function getStep(stepId: string, definition: FormDefinition = formDefinition) {
  return definition.steps.find((step) => step.id === stepId) ?? null;
}

export function nextStepId(stepId: string, definition: FormDefinition = formDefinition) {
  const index = definition.steps.findIndex((step) => step.id === stepId);
  return definition.steps[index + 1]?.id ?? null;
}

export function previousStepId(stepId: string, definition: FormDefinition = formDefinition) {
  const index = definition.steps.findIndex((step) => step.id === stepId);
  return index > 0 ? definition.steps[index - 1].id : null;
}

function isEmpty(value: string | boolean | undefined) {
  return value === undefined || value === "" || value === false;
}

export function validateField(field: FormField, value: string | boolean | undefined) {
  const { rules } = field;
  if (rules.required && isEmpty(value)) {
    return `${field.label} is required.`;
  }
  if (isEmpty(value)) return null;
  const text = String(value);
  if (rules.minLength && text.trim().length < rules.minLength) {
    return `${field.label} must be at least ${rules.minLength} characters.`;
  }
  if (rules.maxLength && text.length > rules.maxLength) {
    return `${field.label} must be under ${rules.maxLength} characters.`;
  }
  if (rules.pattern && !new RegExp(rules.pattern).test(text)) {
    return rules.patternMessage ?? `${field.label} is invalid.`;
  }
  return null;
}

export function validateStep(
  stepId: string,
  values: FormValues,
  definition: FormDefinition = formDefinition,
): FieldError[] {
  const step = getStep(stepId, definition);
  if (!step) return [{ fieldId: "step", message: `Unknown step: ${stepId}` }];
  return step.fields
    .map((field) => {
      const message = validateField(field, values[field.id]);
      return message ? { fieldId: field.id, message } : null;
    })
    .filter((error): error is FieldError => Boolean(error));
}

export function validateAll(values: FormValues, definition: FormDefinition = formDefinition): FieldError[] {
  return definition.steps.flatMap((step) => validateStep(step.id, values, definition));
}

export function projectForm(definition: FormDefinition = formDefinition) {
  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    durationMinutes: definition.durationMinutes,
    timezone: definition.timezone,
    location: definition.location,
    steps: definition.steps.map((step, index) => ({
      id: step.id,
      index,
      title: step.title,
      subtitle: step.subtitle,
      fields: step.fields.map((field) => ({
        id: field.id,
        type: field.type,
        label: field.label,
        hint: field.hint,
        placeholder: field.placeholder,
        options: field.options,
        validation: field.rules,
      })),
    })),
  };
}

export function agentToolSchema() {
  return projectForm(formDefinition);
}

import { FORM_ID, SLOT_MINUTES } from "./config";
import {
  getStep as getStepCore,
  nextStepId as nextStepIdCore,
  previousStepId as previousStepIdCore,
  projectForm as projectFormCore,
  validateAll as validateAllCore,
  validateField as validateFieldCore,
  validateStep as validateStepCore,
  type FormDefinition,
  type FormField,
  type FormValues,
} from "@inherit/core";

export type {
  FieldError,
  FieldRule,
  FieldType,
  FormDefinition,
  FormField,
  FormStep,
  FormValues,
} from "@inherit/core";

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

export function getStep(stepId: string, definition: FormDefinition = formDefinition) {
  return getStepCore(stepId, definition);
}

export function nextStepId(stepId: string, definition: FormDefinition = formDefinition) {
  return nextStepIdCore(stepId, definition);
}

export function previousStepId(stepId: string, definition: FormDefinition = formDefinition) {
  return previousStepIdCore(stepId, definition);
}

export function validateField(field: FormField, value: string | boolean | undefined) {
  return validateFieldCore(field, value);
}

export function validateStep(
  stepId: string,
  values: FormValues,
  definition: FormDefinition = formDefinition,
) {
  return validateStepCore(stepId, values, definition);
}

export function validateAll(values: FormValues, definition: FormDefinition = formDefinition) {
  return validateAllCore(values, definition);
}

export function projectForm(definition: FormDefinition = formDefinition) {
  return projectFormCore(definition);
}

export function agentToolSchema() {
  return projectForm(formDefinition);
}

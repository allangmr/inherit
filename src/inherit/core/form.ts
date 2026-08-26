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
  steps: FormStep[];
  durationMinutes?: number;
  timezone?: string;
  location?: string;
};

export type FormValues = Record<string, string | boolean | undefined>;

export type FieldError = { fieldId: string; message: string };

export function getStep(stepId: string, definition: FormDefinition) {
  return definition.steps.find((step) => step.id === stepId) ?? null;
}

export function nextStepId(stepId: string, definition: FormDefinition) {
  const index = definition.steps.findIndex((step) => step.id === stepId);
  return definition.steps[index + 1]?.id ?? null;
}

export function previousStepId(stepId: string, definition: FormDefinition) {
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
  definition: FormDefinition,
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

export function validateAll(values: FormValues, definition: FormDefinition): FieldError[] {
  return definition.steps.flatMap((step) => validateStep(step.id, values, definition));
}

export type ProjectedForm = {
  id: string;
  title: string;
  description: string;
  durationMinutes?: number;
  timezone?: string;
  location?: string;
  steps: Array<{
    id: string;
    index: number;
    title: string;
    subtitle: string;
    fields: Array<{
      id: string;
      type: FieldType;
      label: string;
      hint?: string;
      placeholder?: string;
      options?: FormField["options"];
      validation: FieldRule;
    }>;
  }>;
};

export function projectForm(definition: FormDefinition): ProjectedForm {
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

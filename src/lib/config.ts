export const SLOT_MINUTES = 30;
export const DEFAULT_SLOT_CAPACITY = Number(process.env.SLOT_CAPACITY ?? 3);
export const STUDIO_TIMEZONE =
  process.env.STUDIO_TIMEZONE ?? "America/Los_Angeles";
export const STUDIO_OPEN_HOUR = 9;
export const STUDIO_CLOSE_HOUR = 17;
export const STUDIO_LUNCH_START = 12;
export const STUDIO_LUNCH_END = 13;
export const SLOT_LOOKAHEAD_DAYS = 12;
export const FORM_ID = "lumen-consult-30";

export function dataDir() {
  if (process.env.INHERIT_DATA_DIR) return process.env.INHERIT_DATA_DIR;
  if (process.env.VERCEL) return "/tmp/inherit";
  return `${process.cwd()}/data`;
}

export function calendarProviderName() {
  return (process.env.CALENDAR_PROVIDER ?? "file").toLowerCase();
}

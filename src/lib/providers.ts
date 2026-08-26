import type { CalendarProvider } from "./calendar";
import { calendarProviderName } from "./config";
import { FileCalendarProvider } from "./file-calendar";
import {
  GoogleCalendarProvider,
  isGoogleCalendarConfigured,
} from "./google-calendar";

export function getCalendarProvider(): CalendarProvider {
  if (calendarProviderName() === "google") {
    const google = new GoogleCalendarProvider();
    if (!google.configured()) {
      throw new Error(
        "CALENDAR_PROVIDER=google but Google env vars are missing. The demo calendar (file) needs no OAuth.",
      );
    }
    return google;
  }
  return new FileCalendarProvider();
}

export function describeCalendar() {
  const requested = calendarProviderName();
  if (requested === "google" && isGoogleCalendarConfigured()) {
    return { provider: "google" as const, live: false, stub: true };
  }
  return { provider: "file" as const, live: true, stub: false };
}

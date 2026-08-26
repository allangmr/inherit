import type {
  CalendarEvent,
  CalendarProvider,
  CreateEventInput,
  TimeSlot,
} from "./calendar";

export type GoogleCalendarEnv = {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  calendarId?: string;
};

export function readGoogleCalendarEnv(
  env: NodeJS.ProcessEnv = process.env,
): GoogleCalendarEnv {
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    calendarId: env.GOOGLE_CALENDAR_ID,
  };
}

export function isGoogleCalendarConfigured(env: GoogleCalendarEnv = readGoogleCalendarEnv()) {
  return Boolean(env.clientId && env.clientSecret && env.refreshToken && env.calendarId);
}

/**
 * Env-gated Google Calendar adapter.
 * The interface matches FileCalendarProvider so swapping providers is a factory change.
 * Real OAuth + Calendar API calls are intentionally stubbed for this MVP.
 */
export class GoogleCalendarProvider implements CalendarProvider {
  readonly name = "google";

  constructor(private env: GoogleCalendarEnv = readGoogleCalendarEnv()) {}

  configured() {
    return isGoogleCalendarConfigured(this.env);
  }

  private assertConfigured() {
    if (!this.configured()) {
      throw new Error(
        "Google Calendar is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_CALENDAR_ID, or keep CALENDAR_PROVIDER=file.",
      );
    }
  }

  async listSlots(input?: { from?: string; to?: string }): Promise<TimeSlot[]> {
    void input;
    this.assertConfigured();
    throw new Error(
      "Google Calendar adapter is stubbed. Next wiring: OAuth refresh → calendar.freebusy.query + events.list, then subtract busy times from working hours.",
    );
  }

  async getSlot(slotId: string): Promise<TimeSlot | null> {
    void slotId;
    this.assertConfigured();
    throw new Error("Google Calendar adapter is stubbed. Use CALENDAR_PROVIDER=file for the demo.");
  }

  async createEvent(input: CreateEventInput): Promise<CalendarEvent> {
    void input;
    this.assertConfigured();
    throw new Error(
      "Google Calendar adapter is stubbed. Next wiring: calendar.events.insert with attendees and conferenceData.",
    );
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    void eventId;
    this.assertConfigured();
    throw new Error("Google Calendar adapter is stubbed. Use CALENDAR_PROVIDER=file for the demo.");
  }
}

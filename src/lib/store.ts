export type Actor = "human" | "agent" | "system";

export type FieldProvenance = {
  actor: Actor;
  at: string;
  source: "input" | "tool" | "proposal" | "system";
};

export type ProposalRecord = {
  id: string;
  action: string;
  toolName?: string;
  actor: Actor;
  summary: string;
  payload: Record<string, unknown>;
  status: "pending";
  createdAt: string;
};

export type ActivityRecord = {
  id: string;
  sessionId: string;
  timestamp: string;
  actor: Actor;
  action: string;
  field?: string;
  previousValue?: unknown;
  nextValue?: unknown;
  toolName?: string;
  summary: string;
};

export type SessionRecord = {
  id: string;
  workflowId: string;
  formId: string;
  currentStepId: string;
  values: Record<string, string | boolean | undefined>;
  completedStepIds: string[];
  bookingId: string | null;
  version: number;
  provenance: Record<string, FieldProvenance>;
  proposal: ProposalRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingRecord = {
  id: string;
  sessionId: string;
  slotId: string;
  start: string;
  end: string;
  name: string;
  email: string;
  phone: string | null;
  values: Record<string, string | boolean | undefined>;
  calendarEventId: string;
  calendarProvider: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventRecord = {
  id: string;
  slotId: string;
  start: string;
  end: string;
  title: string;
  attendeeEmail: string;
  attendeeName: string;
  createdAt: string;
};

export interface InheritStore {
  getSession(id: string): SessionRecord | null;
  upsertSession(session: SessionRecord): SessionRecord;
  compareAndSetSession(session: SessionRecord, expectedVersion: number): SessionRecord | null;
  getBooking(id: string): BookingRecord | null;
  findBookings(query: { email?: string; bookingId?: string }): BookingRecord[];
  createBooking(booking: BookingRecord): BookingRecord;
  updateBooking(booking: BookingRecord): BookingRecord;
  countBookingsForSlot(slotId: string): number;
  listCalendarEvents(): CalendarEventRecord[];
  createCalendarEvent(event: CalendarEventRecord): CalendarEventRecord;
  updateCalendarEvent(event: CalendarEventRecord): CalendarEventRecord;
  deleteCalendarEvent(id: string): void;
  getCalendarEvent(id: string): CalendarEventRecord | null;
  appendActivity(entry: ActivityRecord): ActivityRecord;
  listActivity(sessionId: string, limit?: number): ActivityRecord[];
}

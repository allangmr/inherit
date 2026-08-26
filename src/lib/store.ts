export type SessionRecord = {
  id: string;
  formId: string;
  currentStepId: string;
  values: Record<string, string | boolean | undefined>;
  completedStepIds: string[];
  bookingId: string | null;
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
  getBooking(id: string): BookingRecord | null;
  findBookings(query: { email?: string; bookingId?: string }): BookingRecord[];
  createBooking(booking: BookingRecord): BookingRecord;
  countBookingsForSlot(slotId: string): number;
  listCalendarEvents(): CalendarEventRecord[];
  createCalendarEvent(event: CalendarEventRecord): CalendarEventRecord;
  getCalendarEvent(id: string): CalendarEventRecord | null;
}

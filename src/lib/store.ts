import type { WorkflowStore } from "@inherit/core";

export type {
  Actor,
  ActivityRecord,
  FieldProvenance,
  ProposalRecord,
  SessionRecord,
  WorkflowStore,
} from "@inherit/core";

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

export interface InheritStore extends WorkflowStore {
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
}

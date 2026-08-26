export type TimeSlot = {
  id: string;
  start: string;
  end: string;
  label: string;
  capacity: number;
  booked: number;
  remaining: number;
};

export type CalendarEvent = {
  id: string;
  slotId: string;
  start: string;
  end: string;
  title: string;
  attendeeEmail: string;
  attendeeName: string;
};

export type CreateEventInput = {
  slotId: string;
  start: string;
  end: string;
  title: string;
  description?: string;
  attendeeEmail: string;
  attendeeName: string;
};

export type UpdateEventInput = {
  id: string;
  slotId: string;
  start: string;
  end: string;
  title: string;
  attendeeEmail: string;
  attendeeName: string;
};

export interface CalendarProvider {
  readonly name: string;
  listSlots(input?: { from?: string; to?: string }): Promise<TimeSlot[]>;
  getSlot(slotId: string): Promise<TimeSlot | null>;
  createEvent(input: CreateEventInput): Promise<CalendarEvent>;
  updateEvent(input: UpdateEventInput): Promise<CalendarEvent>;
  cancelEvent(eventId: string): Promise<void>;
  getEvent(eventId: string): Promise<CalendarEvent | null>;
}

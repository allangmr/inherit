import {
  DEFAULT_SLOT_CAPACITY,
  SLOT_MINUTES,
  STUDIO_TIMEZONE,
} from "./config";
import type {
  CalendarEvent,
  CalendarProvider,
  CreateEventInput,
  TimeSlot,
  UpdateEventInput,
} from "./calendar";
import { getStore } from "./sqlite-store";
import {
  addMinutes,
  formatSlotRange,
  slotIdFromInstant,
  workingWindowStarts,
} from "./time";

function seedOccupancy(slotId: string, capacity: number) {
  let hash = 0;
  for (let i = 0; i < slotId.length; i += 1) {
    hash = (hash * 33 + slotId.charCodeAt(i)) >>> 0;
  }
  if (hash % 19 === 0) return capacity;
  if (hash % 8 === 0) return Math.min(capacity, 2);
  if (hash % 4 === 0) return 1;
  return 0;
}

function toSlot(
  start: Date,
  booked: number,
  capacity = DEFAULT_SLOT_CAPACITY,
): TimeSlot {
  const end = addMinutes(start, SLOT_MINUTES);
  const id = slotIdFromInstant(start);
  const taken = Math.min(capacity, booked);
  return {
    id,
    start: start.toISOString(),
    end: end.toISOString(),
    label: formatSlotRange(start.toISOString(), end.toISOString(), STUDIO_TIMEZONE),
    capacity,
    booked: taken,
    remaining: capacity - taken,
  };
}

export class FileCalendarProvider implements CalendarProvider {
  readonly name = "file";

  constructor(private capacity = DEFAULT_SLOT_CAPACITY) {}

  async listSlots(input: { from?: string; to?: string } = {}): Promise<TimeSlot[]> {
    const from = input.from ? new Date(input.from) : new Date();
    const to = input.to ? new Date(input.to) : null;
    const store = getStore();
    return workingWindowStarts(from)
      .filter((start) => !to || start.getTime() <= to.getTime())
      .map((start) => {
        const id = slotIdFromInstant(start);
        const booked = store.countBookingsForSlot(id) + seedOccupancy(id, this.capacity);
        return toSlot(start, booked, this.capacity);
      });
  }

  async getSlot(slotId: string): Promise<TimeSlot | null> {
    const slots = await this.listSlots();
    return slots.find((slot) => slot.id === slotId) ?? null;
  }

  async createEvent(input: CreateEventInput): Promise<CalendarEvent> {
    const store = getStore();
    const createdAt = new Date().toISOString();
    const event = store.createCalendarEvent({
      id: `evt_${crypto.randomUUID()}`,
      slotId: input.slotId,
      start: input.start,
      end: input.end,
      title: input.title,
      attendeeEmail: input.attendeeEmail,
      attendeeName: input.attendeeName,
      createdAt,
    });
    return event;
  }

  async updateEvent(input: UpdateEventInput): Promise<CalendarEvent> {
    const store = getStore();
    const existing = store.getCalendarEvent(input.id);
    const createdAt = existing?.createdAt ?? new Date().toISOString();
    return store.updateCalendarEvent({
      id: input.id,
      slotId: input.slotId,
      start: input.start,
      end: input.end,
      title: input.title,
      attendeeEmail: input.attendeeEmail,
      attendeeName: input.attendeeName,
      createdAt,
    });
  }

  async cancelEvent(eventId: string): Promise<void> {
    getStore().deleteCalendarEvent(eventId);
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return getStore().getCalendarEvent(eventId);
  }
}

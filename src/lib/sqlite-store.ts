import fs from "node:fs";
    import path from "node:path";
    import Database from "better-sqlite3";
    import { dataDir } from "./config";
    import type {
      BookingRecord,
      CalendarEventRecord,
      InheritStore,
      SessionRecord,
    } from "./store";

    type SessionRow = {
      id: string;
      form_id: string;
      current_step_id: string;
      values_json: string;
      completed_step_ids: string;
      booking_id: string | null;
      created_at: string;
      updated_at: string;
    };

    type BookingRow = {
      id: string;
      session_id: string;
      slot_id: string;
      start: string;
      end: string;
      name: string;
      email: string;
      phone: string | null;
      values_json: string;
      calendar_event_id: string;
      calendar_provider: string;
      status: "confirmed" | "cancelled";
      created_at: string;
    };

    type EventRow = {
      id: string;
      slot_id: string;
      start: string;
      end: string;
      title: string;
      attendee_email: string;
      attendee_name: string;
      created_at: string;
    };

    const globalForStore = globalThis as typeof globalThis & {
      inheritStore?: SqliteStore;
    };

    function parseJson<T>(value: string, fallback: T): T {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }

    export class SqliteStore implements InheritStore {
      private db: Database.Database;

      constructor(filePath = path.join(dataDir(), "inherit.db")) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        this.db = new Database(filePath);
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("foreign_keys = ON");
        this.migrate();
      }

      private migrate() {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            form_id TEXT NOT NULL,
            current_step_id TEXT NOT NULL,
            values_json TEXT NOT NULL,
            completed_step_ids TEXT NOT NULL,
            booking_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            slot_id TEXT NOT NULL,
            start TEXT NOT NULL,
            end TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            values_json TEXT NOT NULL,
            calendar_event_id TEXT NOT NULL,
            calendar_provider TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS calendar_events (
            id TEXT PRIMARY KEY,
            slot_id TEXT NOT NULL,
            start TEXT NOT NULL,
            end TEXT NOT NULL,
            title TEXT NOT NULL,
            attendee_email TEXT NOT NULL,
            attendee_name TEXT NOT NULL,
            created_at TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (email);
          CREATE INDEX IF NOT EXISTS bookings_slot_idx ON bookings (slot_id, status);
        `);
      }

      getSession(id: string): SessionRecord | null {
        const row = this.db
          .prepare("SELECT * FROM sessions WHERE id = ?")
          .get(id) as SessionRow | undefined;
        return row ? this.mapSession(row) : null;
      }

      upsertSession(session: SessionRecord): SessionRecord {
        this.db
          .prepare(
            `INSERT INTO sessions (
              id, form_id, current_step_id, values_json, completed_step_ids,
              booking_id, created_at, updated_at
            ) VALUES (
              @id, @form_id, @current_step_id, @values_json, @completed_step_ids,
              @booking_id, @created_at, @updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
              current_step_id = excluded.current_step_id,
              values_json = excluded.values_json,
              completed_step_ids = excluded.completed_step_ids,
              booking_id = excluded.booking_id,
              updated_at = excluded.updated_at`,
          )
          .run({
            id: session.id,
            form_id: session.formId,
            current_step_id: session.currentStepId,
            values_json: JSON.stringify(session.values),
            completed_step_ids: JSON.stringify(session.completedStepIds),
            booking_id: session.bookingId,
            created_at: session.createdAt,
            updated_at: session.updatedAt,
          });
        return session;
      }

      getBooking(id: string): BookingRecord | null {
        const row = this.db
          .prepare("SELECT * FROM bookings WHERE id = ?")
          .get(id) as BookingRow | undefined;
        return row ? this.mapBooking(row) : null;
      }

      findBookings(query: { email?: string; bookingId?: string }): BookingRecord[] {
        if (query.bookingId) {
          const booking = this.getBooking(query.bookingId);
          return booking ? [booking] : [];
        }
        if (query.email) {
          const rows = this.db
            .prepare(
              "SELECT * FROM bookings WHERE lower(email) = lower(?) ORDER BY created_at DESC",
            )
            .all(query.email) as BookingRow[];
          return rows.map((row) => this.mapBooking(row));
        }
        return [];
      }

      createBooking(booking: BookingRecord): BookingRecord {
        this.db
          .prepare(
            `INSERT INTO bookings (
              id, session_id, slot_id, start, end, name, email, phone,
              values_json, calendar_event_id, calendar_provider, status, created_at
            ) VALUES (
              @id, @session_id, @slot_id, @start, @end, @name, @email, @phone,
              @values_json, @calendar_event_id, @calendar_provider, @status, @created_at
            )`,
          )
          .run({
            id: booking.id,
            session_id: booking.sessionId,
            slot_id: booking.slotId,
            start: booking.start,
            end: booking.end,
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            values_json: JSON.stringify(booking.values),
            calendar_event_id: booking.calendarEventId,
            calendar_provider: booking.calendarProvider,
            status: booking.status,
            created_at: booking.createdAt,
          });
        return booking;
      }

      countBookingsForSlot(slotId: string): number {
        const row = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM bookings WHERE slot_id = ? AND status = 'confirmed'",
          )
          .get(slotId) as { count: number };
        return row.count;
      }

      listCalendarEvents(): CalendarEventRecord[] {
        const rows = this.db
          .prepare("SELECT * FROM calendar_events")
          .all() as EventRow[];
        return rows.map((row) => this.mapEvent(row));
      }

      createCalendarEvent(event: CalendarEventRecord): CalendarEventRecord {
        this.db
          .prepare(
            `INSERT INTO calendar_events (
              id, slot_id, start, end, title, attendee_email, attendee_name, created_at
            ) VALUES (
              @id, @slot_id, @start, @end, @title, @attendee_email, @attendee_name, @created_at
            )`,
          )
          .run({
            id: event.id,
            slot_id: event.slotId,
            start: event.start,
            end: event.end,
            title: event.title,
            attendee_email: event.attendeeEmail,
            attendee_name: event.attendeeName,
            created_at: event.createdAt,
          });
        return event;
      }

      getCalendarEvent(id: string): CalendarEventRecord | null {
        const row = this.db
          .prepare("SELECT * FROM calendar_events WHERE id = ?")
          .get(id) as EventRow | undefined;
        return row ? this.mapEvent(row) : null;
      }

      transaction<T>(fn: () => T): T {
        return this.db.transaction(fn)();
      }

      private mapSession(row: SessionRow): SessionRecord {
        return {
          id: row.id,
          formId: row.form_id,
          currentStepId: row.current_step_id,
          values: parseJson(row.values_json, {}),
          completedStepIds: parseJson(row.completed_step_ids, []),
          bookingId: row.booking_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }

      private mapBooking(row: BookingRow): BookingRecord {
        return {
          id: row.id,
          sessionId: row.session_id,
          slotId: row.slot_id,
          start: row.start,
          end: row.end,
          name: row.name,
          email: row.email,
          phone: row.phone,
          values: parseJson(row.values_json, {}),
          calendarEventId: row.calendar_event_id,
          calendarProvider: row.calendar_provider,
          status: row.status,
          createdAt: row.created_at,
        };
      }

      private mapEvent(row: EventRow): CalendarEventRecord {
        return {
          id: row.id,
          slotId: row.slot_id,
          start: row.start,
          end: row.end,
          title: row.title,
          attendeeEmail: row.attendee_email,
          attendeeName: row.attendee_name,
          createdAt: row.created_at,
        };
      }
    }

    export function getStore() {
      if (!globalForStore.inheritStore) {
        globalForStore.inheritStore = new SqliteStore();
      }
      return globalForStore.inheritStore;
    }

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { dataDir } from "./config";
import type {
  ActivityRecord,
  BookingRecord,
  CalendarEventRecord,
  FieldProvenance,
  InheritStore,
  ProposalRecord,
  SessionRecord,
} from "./store";

type SessionRow = {
  id: string;
  workflow_id: string;
  form_id: string;
  current_step_id: string;
  values_json: string;
  completed_step_ids: string;
  booking_id: string | null;
  version: number;
  provenance_json: string;
  proposal_json: string | null;
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
  updated_at: string;
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

type ActivityRow = {
  id: string;
  session_id: string;
  timestamp: string;
  actor: ActivityRecord["actor"];
  action: string;
  field: string | null;
  previous_json: string | null;
  next_json: string | null;
  tool_name: string | null;
  summary: string;
};

const globalForStore = globalThis as typeof globalThis & {
  inheritStore?: SqliteStore;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class SqliteStore implements InheritStore {
  private db: Database.Database;
  readonly filePath: string;

  constructor(filePath = path.join(dataDir(), "inherit.db")) {
    this.filePath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  close() {
    this.db.close();
  }

  private tableColumns(table: string) {
    return (
      this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    ).map((row) => row.name);
  }

  private ensureColumn(table: string, column: string, ddl: string) {
    if (!this.tableColumns(table).includes(column)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    }
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL DEFAULT 'booking',
        form_id TEXT NOT NULL,
        current_step_id TEXT NOT NULL,
        values_json TEXT NOT NULL,
        completed_step_ids TEXT NOT NULL,
        booking_id TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        provenance_json TEXT NOT NULL DEFAULT '{}',
        proposal_json TEXT,
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
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT ''
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

      CREATE TABLE IF NOT EXISTS activity (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        field TEXT,
        previous_json TEXT,
        next_json TEXT,
        tool_name TEXT,
        summary TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (email);
      CREATE INDEX IF NOT EXISTS bookings_slot_idx ON bookings (slot_id, status);
      CREATE INDEX IF NOT EXISTS activity_session_idx ON activity (session_id, timestamp);
    `);

    this.ensureColumn("sessions", "workflow_id", "TEXT NOT NULL DEFAULT 'booking'");
    this.ensureColumn("sessions", "version", "INTEGER NOT NULL DEFAULT 1");
    this.ensureColumn("sessions", "provenance_json", "TEXT NOT NULL DEFAULT '{}'");
    this.ensureColumn("sessions", "proposal_json", "TEXT");
    this.ensureColumn("bookings", "updated_at", "TEXT NOT NULL DEFAULT ''");
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
          id, workflow_id, form_id, current_step_id, values_json, completed_step_ids,
          booking_id, version, provenance_json, proposal_json, created_at, updated_at
        ) VALUES (
          @id, @workflow_id, @form_id, @current_step_id, @values_json, @completed_step_ids,
          @booking_id, @version, @provenance_json, @proposal_json, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          workflow_id = excluded.workflow_id,
          current_step_id = excluded.current_step_id,
          values_json = excluded.values_json,
          completed_step_ids = excluded.completed_step_ids,
          booking_id = excluded.booking_id,
          version = excluded.version,
          provenance_json = excluded.provenance_json,
          proposal_json = excluded.proposal_json,
          updated_at = excluded.updated_at`,
      )
      .run(this.sessionBind(session));
    return session;
  }

  compareAndSetSession(session: SessionRecord, expectedVersion: number): SessionRecord | null {
    const result = this.db
      .prepare(
        `UPDATE sessions SET
          workflow_id = @workflow_id,
          current_step_id = @current_step_id,
          values_json = @values_json,
          completed_step_ids = @completed_step_ids,
          booking_id = @booking_id,
          version = @version,
          provenance_json = @provenance_json,
          proposal_json = @proposal_json,
          updated_at = @updated_at
        WHERE id = @id AND version = @expected_version`,
      )
      .run({ ...this.sessionBind(session), expected_version: expectedVersion });
    if (result.changes === 0) return null;
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
          values_json, calendar_event_id, calendar_provider, status, created_at, updated_at
        ) VALUES (
          @id, @session_id, @slot_id, @start, @end, @name, @email, @phone,
          @values_json, @calendar_event_id, @calendar_provider, @status, @created_at, @updated_at
        )`,
      )
      .run(this.bookingBind(booking));
    return booking;
  }

  updateBooking(booking: BookingRecord): BookingRecord {
    this.db
      .prepare(
        `UPDATE bookings SET
          slot_id = @slot_id,
          start = @start,
          end = @end,
          name = @name,
          email = @email,
          phone = @phone,
          values_json = @values_json,
          calendar_event_id = @calendar_event_id,
          calendar_provider = @calendar_provider,
          status = @status,
          updated_at = @updated_at
        WHERE id = @id`,
      )
      .run(this.bookingBind(booking));
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
    const rows = this.db.prepare("SELECT * FROM calendar_events").all() as EventRow[];
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

  updateCalendarEvent(event: CalendarEventRecord): CalendarEventRecord {
    this.db
      .prepare(
        `UPDATE calendar_events SET
          slot_id = @slot_id,
          start = @start,
          end = @end,
          title = @title,
          attendee_email = @attendee_email,
          attendee_name = @attendee_name
        WHERE id = @id`,
      )
      .run({
        id: event.id,
        slot_id: event.slotId,
        start: event.start,
        end: event.end,
        title: event.title,
        attendee_email: event.attendeeEmail,
        attendee_name: event.attendeeName,
      });
    return event;
  }

  getCalendarEvent(id: string): CalendarEventRecord | null {
    const row = this.db
      .prepare("SELECT * FROM calendar_events WHERE id = ?")
      .get(id) as EventRow | undefined;
    return row ? this.mapEvent(row) : null;
  }

  deleteCalendarEvent(id: string): void {
    this.db.prepare("DELETE FROM calendar_events WHERE id = ?").run(id);
  }

  appendActivity(entry: ActivityRecord): ActivityRecord {
    this.db
      .prepare(
        `INSERT INTO activity (
          id, session_id, timestamp, actor, action, field, previous_json, next_json, tool_name, summary
        ) VALUES (
          @id, @session_id, @timestamp, @actor, @action, @field, @previous_json, @next_json, @tool_name, @summary
        )`,
      )
      .run({
        id: entry.id,
        session_id: entry.sessionId,
        timestamp: entry.timestamp,
        actor: entry.actor,
        action: entry.action,
        field: entry.field ?? null,
        previous_json: entry.previousValue === undefined ? null : JSON.stringify(entry.previousValue),
        next_json: entry.nextValue === undefined ? null : JSON.stringify(entry.nextValue),
        tool_name: entry.toolName ?? null,
        summary: entry.summary,
      });
    return entry;
  }

  listActivity(sessionId: string, limit = 50): ActivityRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM activity WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?",
      )
      .all(sessionId, limit) as ActivityRow[];
    return rows.map((row) => this.mapActivity(row)).reverse();
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  private sessionBind(session: SessionRecord) {
    return {
      id: session.id,
      workflow_id: session.workflowId,
      form_id: session.formId,
      current_step_id: session.currentStepId,
      values_json: JSON.stringify(session.values),
      completed_step_ids: JSON.stringify(session.completedStepIds),
      booking_id: session.recordId,
      version: session.version,
      provenance_json: JSON.stringify(session.provenance),
      proposal_json: session.proposal ? JSON.stringify(session.proposal) : null,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    };
  }

  private bookingBind(booking: BookingRecord) {
    return {
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
      updated_at: booking.updatedAt,
    };
  }

  private mapSession(row: SessionRow): SessionRecord {
    return {
      id: row.id,
      workflowId: row.workflow_id || "booking",
      formId: row.form_id,
      currentStepId: row.current_step_id,
      values: parseJson(row.values_json, {}),
      completedStepIds: parseJson(row.completed_step_ids, []),
      recordId: row.booking_id,
      version: Number(row.version || 1),
      provenance: parseJson<Record<string, FieldProvenance>>(row.provenance_json, {}),
      proposal: parseJson<ProposalRecord | null>(row.proposal_json, null),
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
      updatedAt: row.updated_at || row.created_at,
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

  private mapActivity(row: ActivityRow): ActivityRecord {
    return {
      id: row.id,
      sessionId: row.session_id,
      timestamp: row.timestamp,
      actor: row.actor,
      action: row.action,
      field: row.field ?? undefined,
      previousValue: row.previous_json ? parseJson(row.previous_json, undefined) : undefined,
      nextValue: row.next_json ? parseJson(row.next_json, undefined) : undefined,
      toolName: row.tool_name ?? undefined,
      summary: row.summary,
    };
  }
}

export function getStore() {
  if (!globalForStore.inheritStore) {
    globalForStore.inheritStore = new SqliteStore();
  }
  return globalForStore.inheritStore;
}

export function resetStoreForTests() {
  const existing = globalForStore.inheritStore;
  if (!existing) return;
  const filePath = existing.filePath;
  existing.close();
  globalForStore.inheritStore = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(filePath + suffix);
    } catch {
      void 0;
    }
  }
}

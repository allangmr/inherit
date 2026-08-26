import {
  SLOT_LOOKAHEAD_DAYS,
  SLOT_MINUTES,
  STUDIO_CLOSE_HOUR,
  STUDIO_LUNCH_END,
  STUDIO_LUNCH_START,
  STUDIO_OPEN_HOUR,
  STUDIO_TIMEZONE,
} from "./config";

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function zonedParts(date: Date, timeZone = STUDIO_TIMEZONE): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag = Object.fromEntries(
    fmt.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    weekday: weekdayMap[bag.weekday] ?? 0,
  };
}

export function offsetMinutes(date: Date, timeZone = STUDIO_TIMEZONE) {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const zoned = new Date(date.toLocaleString("en-US", { timeZone }));
  return (zoned.getTime() - utc.getTime()) / 60000;
}

export function formatOffset(mins: number) {
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export function slotIdFromInstant(date: Date, timeZone = STUDIO_TIMEZONE) {
  const p = zonedParts(date, timeZone);
  const ymd = `${p.year}${String(p.month).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
  const hm = `${String(p.hour).padStart(2, "0")}${String(p.minute).padStart(2, "0")}`;
  return `slot-${ymd}-${hm}`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function startOfZonedDay(date: Date, timeZone = STUDIO_TIMEZONE) {
  const p = zonedParts(date, timeZone);
  return zonedDate(p.year, p.month, p.day, 0, 0, timeZone);
}

export function zonedDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = STUDIO_TIMEZONE,
) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = offsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60_000);
}

export function addZonedDays(date: Date, days: number, timeZone = STUDIO_TIMEZONE) {
  const p = zonedParts(date, timeZone);
  const utc = Date.UTC(p.year, p.month - 1, p.day + days, 12, 0, 0);
  return new Date(utc);
}

export function isWeekend(date: Date, timeZone = STUDIO_TIMEZONE) {
  const { weekday } = zonedParts(date, timeZone);
  return weekday === 0 || weekday === 6;
}

export function formatSlotRange(startIso: string, endIso: string, timeZone = STUDIO_TIMEZONE) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time.format(start)}–${time.format(end)}`;
}

export function workingWindowStarts(from = new Date(), days = SLOT_LOOKAHEAD_DAYS) {
  const starts: Date[] = [];
  const cursor = startOfZonedDay(from);
  for (let i = 0; i < days + 4 && starts.length < days; i += 1) {
    const day = addZonedDays(cursor, i);
    if (isWeekend(day)) continue;
    const parts = zonedParts(day);
    if (parts.year === zonedParts(from).year &&
      parts.month === zonedParts(from).month &&
      parts.day === zonedParts(from).day) {
      // include today only if slots remain
    }
    for (let hour = STUDIO_OPEN_HOUR; hour < STUDIO_CLOSE_HOUR; hour += 1) {
      if (hour >= STUDIO_LUNCH_START && hour < STUDIO_LUNCH_END) continue;
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        const start = zonedDate(parts.year, parts.month, parts.day, hour, minute);
        if (start.getTime() <= Date.now() + 15 * 60_000) continue;
        starts.push(start);
      }
    }
  }
  return starts;
}

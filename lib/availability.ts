export const CALENDAR_TIME_ZONE = "America/Santiago";
export const STANDARD_SLOT_STEP_MINUTES = 15;
export const DEFAULT_ENABLED_WEEKDAYS = [
  false,
  true,
  true,
  true,
  true,
  true,
  false,
] as const;
export const DEFAULT_WEEKLY_WINDOWS = [
  { startMinute: 8 * 60, endMinute: 10 * 60 },
  { startMinute: 12 * 60, endMinute: 14 * 60 },
] as const;

export type TimeWindow = Readonly<{
  startMinute: number;
  endMinute: number;
}>;

export type DateException = Readonly<{
  date: string;
  kind: "OPEN" | "BLOCK";
  startMinute: number;
  endMinute: number;
}>;

export type BookingInterval = Readonly<{
  id?: string;
  startAt: Date | string | number;
  endAt: Date | string | number;
  status?: "CONFIRMED" | "CANCELLED";
}>;

export type TimeSlot = Readonly<{
  startAt: Date;
  endAt: Date;
  startMinute: number;
  startTime: string;
  endTime: string;
}>;

type LocalDateTime = Readonly<{
  date: string;
  minute: number;
  second: number;
}>;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const offsetsByDateAndTimeZone = new Map<string, readonly number[]>();

export function isValidDateString(date: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epoch = utcEpoch(year, month, day, 0, 0, 0);
  const parsed = new Date(epoch);

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

export function isValidTimeWindow(window: TimeWindow): boolean {
  return (
    Number.isInteger(window.startMinute) &&
    Number.isInteger(window.endMinute) &&
    window.startMinute >= 0 &&
    window.endMinute <= 24 * 60 &&
    window.startMinute < window.endMinute
  );
}

export function validateTimeWindows(
  windows: readonly TimeWindow[],
): string | null {
  if (windows.length === 0) return "Agrega al menos una franja horaria.";
  if (windows.some((window) => !isValidTimeWindow(window))) {
    return "Cada franja debe tener horas válidas y terminar después de comenzar.";
  }

  const sorted = [...windows].sort(
    (left, right) => left.startMinute - right.startMinute,
  );
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].startMinute < sorted[index - 1].endMinute) {
      return "Las franjas horarias no pueden superponerse.";
    }
  }

  return null;
}

export function parseTimeToMinute(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return hour * 60 + minute;
}

export function minuteToTime(minute: number): string {
  const hour = Math.floor(minute / 60);
  const remainder = minute % 60;
  return `${String(hour).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function getWeekday(date: string): number | null {
  if (!isValidDateString(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(utcEpoch(year, month, day, 0, 0, 0)).getUTCDay();
}

/**
 * Combines the shared weekly windows with date-specific openings, then
 * subtracts every date-specific block so a block always wins on overlap.
 */
export function resolveWindowsForDate(options: {
  date: string;
  weekdayEnabled: boolean;
  weeklyWindows: readonly TimeWindow[];
  exceptions: readonly DateException[];
}): TimeWindow[] {
  if (!isValidDateString(options.date)) return [];

  const exceptions = options.exceptions.filter(
    (exception) => exception.date === options.date,
  );
  const openings = mergeWindows([
    ...(options.weekdayEnabled ? options.weeklyWindows : []),
    ...exceptions
      .filter((exception) => exception.kind === "OPEN")
      .map(({ startMinute, endMinute }) => ({ startMinute, endMinute })),
  ]);
  const blocks = mergeWindows(
    exceptions
      .filter((exception) => exception.kind === "BLOCK")
      .map(({ startMinute, endMinute }) => ({ startMinute, endMinute })),
  );

  return blocks.reduce(
    (windows, block) => windows.flatMap((window) => subtractWindow(window, block)),
    openings,
  );
}

export function windowsOverlap(left: TimeWindow, right: TimeWindow): boolean {
  return left.startMinute < right.endMinute && right.startMinute < left.endMinute;
}

export function intervalsOverlap(
  left: { startAt: number; endAt: number },
  right: { startAt: number; endAt: number },
): boolean {
  return left.startAt < right.endAt && right.startAt < left.endAt;
}

/**
 * Resolves a wall-clock time to its possible UTC instants. Zero results means
 * the time is skipped by DST; two results means it occurs twice.
 */
export function localDateTimeToInstants(
  date: string,
  minute: number,
  timeZone = CALENDAR_TIME_ZONE,
): Date[] {
  if (
    !isValidDateString(date) ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute >= 24 * 60
  ) {
    return [];
  }

  const [year, month, day] = date.split("-").map(Number);
  const hour = Math.floor(minute / 60);
  const localEpoch = utcEpoch(year, month, day, hour, minute % 60, 0);
  const offsets = getOffsetsForDate(date, timeZone);
  if (!offsets) return [];

  const matches = new Map<number, Date>();
  for (const offset of offsets) {
    const candidate = new Date(localEpoch - offset);
    const parts = getLocalDateTime(candidate, timeZone);
    if (parts?.date === date && parts.minute === minute && parts.second === 0) {
      matches.set(candidate.getTime(), candidate);
    }
  }

  return [...matches.values()].sort(
    (left, right) => left.getTime() - right.getTime(),
  );
}

export function getLocalDateTime(
  instant: Date,
  timeZone = CALENDAR_TIME_ZONE,
): LocalDateTime | null {
  if (!Number.isFinite(instant.getTime())) return null;

  try {
    let formatter = dateFormatters.get(timeZone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        calendar: "iso8601",
        numberingSystem: "latn",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      });
      dateFormatters.set(timeZone, formatter);
    }

    const parts = Object.fromEntries(
      formatter
        .formatToParts(instant)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);
    const hour = Number(parts.hour);
    const minute = Number(parts.minute);
    const second = Number(parts.second);

    if ([year, month, day, hour, minute, second].some(Number.isNaN)) {
      return null;
    }

    return {
      date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      minute: hour * 60 + minute,
      second,
    };
  } catch {
    return null;
  }
}

export function calculateSlots(options: {
  date: string;
  windows: readonly TimeWindow[];
  durationMinutes: number;
  bookings?: readonly BookingInterval[];
  now?: Date;
  incrementMinutes?: 1 | 15;
  timeZone?: string;
  excludeBookingId?: string;
}): TimeSlot[] {
  const {
    date,
    windows,
    durationMinutes,
    bookings = [],
    now = new Date(),
    incrementMinutes = STANDARD_SLOT_STEP_MINUTES,
    timeZone = CALENDAR_TIME_ZONE,
    excludeBookingId,
  } = options;

  if (
    !isValidDateString(date) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    !Number.isInteger(now.getTime())
  ) {
    return [];
  }

  const today = getLocalDateTime(now, timeZone)?.date;
  if (!today || date < today) return [];

  const step = incrementMinutes === 1 ? 1 : STANDARD_SLOT_STEP_MINUTES;
  const activeBookings = bookings
    .filter(
      (booking) =>
        excludeBookingId === undefined || booking.id !== excludeBookingId,
    )
    .map((booking) => ({
      startAt: toEpoch(booking.startAt),
      endAt: toEpoch(booking.endAt),
    }))
    .filter(
      (booking) =>
        Number.isFinite(booking.startAt) &&
        Number.isFinite(booking.endAt) &&
        booking.startAt < booking.endAt,
    );
  const slots: TimeSlot[] = [];

  for (const window of mergeWindows(windows)) {
    if (!isValidTimeWindow(window) || durationMinutes > window.endMinute - window.startMinute) {
      continue;
    }

    const firstStart = Math.ceil(window.startMinute / step) * step;
    for (
      let startMinute = firstStart;
      startMinute + durationMinutes <= window.endMinute;
      startMinute += step
    ) {
      const startInstants = localDateTimeToInstants(date, startMinute, timeZone);
      if (startInstants.length !== 1) continue;

      const startAt = startInstants[0];
      const endAt = new Date(startAt.getTime() + durationMinutes * MINUTE_MS);
      const endLocal = getLocalDateTime(endAt, timeZone);
      const expectedEndMinute = startMinute + durationMinutes;
      const endInstants =
        expectedEndMinute < 24 * 60
          ? localDateTimeToInstants(date, expectedEndMinute, timeZone)
          : [];

      // A duration is measured in elapsed minutes. Reject a slot that crosses
      // a DST jump/fold, changes local date, or ceases to fit its wall window.
      if (
        startAt.getTime() <= now.getTime() ||
        endLocal?.date !== date ||
        endLocal.minute !== expectedEndMinute ||
        endLocal.second !== 0 ||
        endInstants.length !== 1 ||
        endInstants[0].getTime() !== endAt.getTime()
      ) {
        continue;
      }

      const candidate = { startAt: startAt.getTime(), endAt: endAt.getTime() };
      if (activeBookings.some((booking) => intervalsOverlap(candidate, booking))) {
        continue;
      }

      slots.push({
        startAt,
        endAt,
        startMinute,
        startTime: minuteToTime(startMinute),
        endTime: minuteToTime(expectedEndMinute),
      });
    }
  }

  return slots.sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}

export function findIncompatibleFutureBookings(options: {
  bookings: readonly BookingInterval[];
  now?: Date;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  enabledWeekdays: readonly boolean[];
  weeklyWindows: readonly TimeWindow[];
  exceptions: readonly DateException[];
  timeZone?: string;
}): string[] {
  const {
    bookings,
    now = new Date(),
    startDate,
    endDate,
    durationMinutes,
    enabledWeekdays,
    weeklyWindows,
    exceptions,
    timeZone = CALENDAR_TIME_ZONE,
  } = options;

  if (
    !isValidDateString(startDate) ||
    !isValidDateString(endDate) ||
    startDate > endDate ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    enabledWeekdays.length !== 7 ||
    !Number.isFinite(now.getTime())
  ) {
    return bookings
      .filter((booking) => booking.status !== "CANCELLED")
      .map((booking, index) => booking.id ?? `booking-${index}`);
  }

  const futureBookings = bookings
    .filter((booking) => booking.status !== "CANCELLED")
    .map((booking, index) => ({
      booking,
      id: booking.id ?? `booking-${index}`,
      startAt: toEpoch(booking.startAt),
      endAt: toEpoch(booking.endAt),
    }))
    .filter(
      (booking) =>
        Number.isFinite(booking.startAt) &&
        Number.isFinite(booking.endAt) &&
        booking.startAt > now.getTime() &&
        booking.startAt < booking.endAt,
    );
  const incompatible = new Set<string>();
  const proposedIntervals: Array<{ id: string; startAt: number; endAt: number }> = [];

  for (const item of futureBookings) {
    const startAt = new Date(item.startAt);
    const localStart = getLocalDateTime(startAt, timeZone);
    if (!localStart || localStart.date < startDate || localStart.date > endDate) {
      incompatible.add(item.id);
      continue;
    }

    const weekday = getWeekday(localStart.date);
    const windows = resolveWindowsForDate({
      date: localStart.date,
      weekdayEnabled: weekday !== null && enabledWeekdays[weekday] === true,
      weeklyWindows,
      exceptions,
    });
    const expectedEndMinute = localStart.minute + durationMinutes;
    const endAt = new Date(item.startAt + durationMinutes * MINUTE_MS);
    const localEnd = getLocalDateTime(endAt, timeZone);
    const startCandidates = localDateTimeToInstants(
      localStart.date,
      localStart.minute,
      timeZone,
    );
    const endCandidates =
      expectedEndMinute < 24 * 60
        ? localDateTimeToInstants(localStart.date, expectedEndMinute, timeZone)
        : [];
    const isInsideWindow = windows.some(
      (window) =>
        localStart.minute >= window.startMinute &&
        expectedEndMinute <= window.endMinute,
    );

    if (
      localStart.second !== 0 ||
      startCandidates.length !== 1 ||
      startCandidates[0].getTime() !== item.startAt ||
      expectedEndMinute >= 24 * 60 ||
      localEnd?.date !== localStart.date ||
      localEnd.minute !== expectedEndMinute ||
      localEnd.second !== 0 ||
      endCandidates.length !== 1 ||
      endCandidates[0].getTime() !== endAt.getTime() ||
      endAt.getTime() !== item.endAt ||
      !isInsideWindow
    ) {
      incompatible.add(item.id);
      continue;
    }

    proposedIntervals.push({
      id: item.id,
      startAt: item.startAt,
      endAt: endAt.getTime(),
    });
  }

  for (let leftIndex = 0; leftIndex < proposedIntervals.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < proposedIntervals.length;
      rightIndex += 1
    ) {
      const left = proposedIntervals[leftIndex];
      const right = proposedIntervals[rightIndex];
      if (intervalsOverlap(left, right)) {
        incompatible.add(left.id);
        incompatible.add(right.id);
      }
    }
  }

  return [...incompatible];
}

function mergeWindows(windows: readonly TimeWindow[]): TimeWindow[] {
  const sorted = windows
    .filter(isValidTimeWindow)
    .map((window) => ({ ...window }))
    .sort((left, right) => left.startMinute - right.startMinute);
  const merged: TimeWindow[] = [];

  for (const window of sorted) {
    const last = merged.at(-1);
    if (last && window.startMinute <= last.endMinute) {
      merged[merged.length - 1] = {
        startMinute: last.startMinute,
        endMinute: Math.max(last.endMinute, window.endMinute),
      };
    } else {
      merged.push(window);
    }
  }

  return merged;
}

function subtractWindow(base: TimeWindow, block: TimeWindow): TimeWindow[] {
  if (!windowsOverlap(base, block)) return [base];

  const remaining: TimeWindow[] = [];
  if (block.startMinute > base.startMinute) {
    remaining.push({ startMinute: base.startMinute, endMinute: block.startMinute });
  }
  if (block.endMinute < base.endMinute) {
    remaining.push({ startMinute: block.endMinute, endMinute: base.endMinute });
  }
  return remaining;
}

function toEpoch(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

function getOffsetsForDate(
  date: string,
  timeZone: string,
): readonly number[] | null {
  const key = `${timeZone}:${date}`;
  const cached = offsetsByDateAndTimeZone.get(key);
  if (cached) return cached;

  const offsets = new Set<number>();
  const [year, month, day] = date.split("-").map(Number);
  const localNoon = utcEpoch(year, month, day, 12, 0, 0);

  // Sampling once per date discovers both sides of the nearby DST transition.
  for (let delta = -48 * HOUR_MS; delta <= 48 * HOUR_MS; delta += 3 * HOUR_MS) {
    const sample = new Date(localNoon + delta);
    const parts = getLocalDateTime(sample, timeZone);
    if (!parts) return null;
    const [sampleYear, sampleMonth, sampleDay] = parts.date.split("-").map(Number);
    const localSampleEpoch = utcEpoch(
      sampleYear,
      sampleMonth,
      sampleDay,
      Math.floor(parts.minute / 60),
      parts.minute % 60,
      parts.second,
    );
    offsets.add(localSampleEpoch - sample.getTime());
  }

  const result = [...offsets];
  offsetsByDateAndTimeZone.set(key, result);
  if (offsetsByDateAndTimeZone.size > 512) {
    const oldestKey = offsetsByDateAndTimeZone.keys().next().value;
    if (oldestKey) offsetsByDateAndTimeZone.delete(oldestKey);
  }
  return result;
}

function utcEpoch(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getTime();
}

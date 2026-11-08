import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "../generated/prisma/client";
import {
  CALENDAR_TIME_ZONE,
  calculateSlots,
  findIncompatibleFutureBookings,
  getLocalDateTime,
  getWeekday,
  isValidDateString,
  parseTimeToMinute,
  resolveWindowsForDate,
  validateTimeWindows,
  type BookingInterval,
  type DateException as AvailabilityException,
  type TimeWindow,
} from "./availability";

type Database = PrismaClient;
type Transaction = Prisma.TransactionClient;

export type EventConfigurationInput = Readonly<{
  title: string;
  description: string | null;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  enabledWeekdays: readonly boolean[];
  weeklyWindows: readonly TimeWindow[];
}>;

export type BookingInput = Readonly<{
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  mode: "standard" | "precise";
}>;

export type CalendarActionResult = Readonly<{
  ok: boolean;
  error?: string;
  success?: string;
  eventId?: string;
  booking?: Readonly<{ id: string; startAt: string; endAt: string }>;
}>;

type EventWithAvailability = Prisma.EventGetPayload<{
  include: { weekdays: true; weeklyWindows: true; exceptions: true };
}>;

type EventRowLock = Readonly<{ id: string }>;

const eventInclude = {
  weekdays: true,
  weeklyWindows: true,
  exceptions: true,
} as const;

export async function createEvent(
  database: Database,
  ownerId: string,
  input: EventConfigurationInput,
  now = new Date(),
): Promise<CalendarActionResult> {
  const error = validateEventConfiguration(input, now, true);
  if (error) return { ok: false, error };

  const today = getLocalDateTime(now)?.date;
  if (!today || input.startDate < today) {
    return { ok: false, error: "El evento debe comenzar hoy o en una fecha futura." };
  }

  return database.$transaction(async (transaction) => {
    const event = await transaction.event.create({
      data: {
        ownerId,
        token: randomBytes(32).toString("base64url"),
        title: input.title.trim(),
        description: normalizeDescription(input.description),
        durationMinutes: input.durationMinutes,
        startDate: toDatabaseDate(input.startDate),
        endDate: toDatabaseDate(input.endDate),
        timeZone: CALENDAR_TIME_ZONE,
      },
    });

    // A newly inserted event has no competing writer; lock it before writing
    // the schedule rows so every configuration path follows the same rule.
    await lockEventById(transaction, event.id);
    await replaceWeeklySchedule(transaction, event.id, input);

    return {
      ok: true,
      eventId: event.id,
      success: "Evento creado.",
    };
  });
}

export async function updateEventConfiguration(
  database: Database,
  ownerId: string,
  eventId: string,
  input: EventConfigurationInput,
  now = new Date(),
): Promise<CalendarActionResult> {
  const error = validateEventConfiguration(input, now, false);
  if (error) return { ok: false, error };

  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    const dateExceptions = event.exceptions.map(toAvailabilityException);
    if (
      dateExceptions.some(
        (exception) =>
          exception.date < input.startDate || exception.date > input.endDate,
      )
    ) {
      return {
        ok: false,
        error: "Ajusta o elimina las excepciones que queden fuera de las nuevas fechas.",
      };
    }

    const bookings = await transaction.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        startAt: { gt: now },
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });
    const incompatible = findIncompatibleFutureBookings({
      bookings,
      now,
      startDate: input.startDate,
      endDate: input.endDate,
      durationMinutes: input.durationMinutes,
      enabledWeekdays: input.enabledWeekdays,
      weeklyWindows: input.weeklyWindows,
      exceptions: dateExceptions,
      timeZone: event.timeZone,
    });
    if (incompatible.length > 0) {
      return {
        ok: false,
        error:
          "La configuración dejaría fuera reservas futuras. Conserva sus horarios o reprográmalas primero.",
      };
    }

    await transaction.event.update({
      where: { id: eventId },
      data: {
        title: input.title.trim(),
        description: normalizeDescription(input.description),
        durationMinutes: input.durationMinutes,
        startDate: toDatabaseDate(input.startDate),
        endDate: toDatabaseDate(input.endDate),
      },
    });
    await replaceWeeklySchedule(transaction, eventId, input);

    return { ok: true, success: "Se guardaron los cambios del evento." };
  });
}

export async function createDateException(
  database: Database,
  ownerId: string,
  eventId: string,
  exception: AvailabilityException,
  now = new Date(),
): Promise<CalendarActionResult> {
  if (
    !isValidDateString(exception.date) ||
    (exception.kind !== "OPEN" && exception.kind !== "BLOCK") ||
    !isValidWindow(exception)
  ) {
    return { ok: false, error: "Elige una fecha y una franja horaria válidas." };
  }

  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    const date = toDateOnly(event.startDate);
    const endDate = toDateOnly(event.endDate);
    if (exception.date < date || exception.date > endDate) {
      return { ok: false, error: "La excepción debe estar dentro de las fechas del evento." };
    }

    const existingExceptions = event.exceptions.map(toAvailabilityException);
    const nextExceptions = [...existingExceptions, exception];
    const bookings = await transaction.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        startAt: { gt: now },
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });
    const incompatible = findIncompatibleFutureBookings({
      bookings,
      now,
      startDate: date,
      endDate,
      durationMinutes: event.durationMinutes,
      enabledWeekdays: getEnabledWeekdays(event.weekdays),
      weeklyWindows: event.weeklyWindows,
      exceptions: nextExceptions,
      timeZone: event.timeZone,
    });
    if (incompatible.length > 0) {
      return {
        ok: false,
        error: "Ese bloqueo afectaría una reserva futura. Conserva su franja o reprográmala.",
      };
    }

    await transaction.dateException.create({
      data: {
        eventId,
        date: toDatabaseDate(exception.date),
        kind: exception.kind,
        startMinute: exception.startMinute,
        endMinute: exception.endMinute,
      },
    });

    return { ok: true, success: "Se agregó la excepción de fecha." };
  });
}

export async function deleteDateException(
  database: Database,
  ownerId: string,
  eventId: string,
  exceptionId: string,
  now = new Date(),
): Promise<CalendarActionResult> {
  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    const target = event.exceptions.find((candidate) => candidate.id === exceptionId);
    if (!target) {
      return { ok: false, error: "No encontramos esa excepción." };
    }

    const nextExceptions = event.exceptions
      .filter((candidate) => candidate.id !== exceptionId)
      .map(toAvailabilityException);
    const bookings = await transaction.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        startAt: { gt: now },
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });
    const incompatible = findIncompatibleFutureBookings({
      bookings,
      now,
      startDate: toDateOnly(event.startDate),
      endDate: toDateOnly(event.endDate),
      durationMinutes: event.durationMinutes,
      enabledWeekdays: getEnabledWeekdays(event.weekdays),
      weeklyWindows: event.weeklyWindows,
      exceptions: nextExceptions,
      timeZone: event.timeZone,
    });
    if (incompatible.length > 0) {
      return {
        ok: false,
        error:
          "Eliminar esta excepción afectaría una reserva futura. Conserva su franja o reprográmala.",
      };
    }

    const deleted = await transaction.dateException.deleteMany({
      where: { id: exceptionId, eventId },
    });
    if (deleted.count === 0) {
      return { ok: false, error: "No encontramos esa excepción." };
    }

    return { ok: true, success: "Se eliminó la excepción." };
  });
}

export async function setEventActive(
  database: Database,
  ownerId: string,
  eventId: string,
  isActive: boolean,
): Promise<CalendarActionResult> {
  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    await transaction.event.update({ where: { id: eventId }, data: { isActive } });
    return {
      ok: true,
      success: isActive ? "El enlace de reserva está activo." : "El enlace de reserva está pausado.",
    };
  });
}

export async function softDeleteEvent(
  database: Database,
  ownerId: string,
  eventId: string,
  now = new Date(),
): Promise<CalendarActionResult> {
  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    await transaction.event.update({
      where: { id: eventId },
      data: { isActive: false, deletedAt: now },
    });
    return { ok: true, success: "El evento se quitó de tu lista." };
  });
}

export async function createPublicBooking(
  database: Database,
  token: string,
  input: BookingInput,
  now = new Date(),
): Promise<CalendarActionResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const minute = parseTimeToMinute(input.startTime);
  if (
    !token ||
    token.length > 64 ||
    !isValidDateString(input.date) ||
    minute === null ||
    firstName.length < 1 ||
    firstName.length > 80 ||
    lastName.length < 1 ||
    lastName.length > 80 ||
    (input.mode !== "standard" && input.mode !== "precise")
  ) {
    return { ok: false, error: "Revisa tu nombre, la fecha y la hora elegida." };
  }
  if (input.mode === "standard" && minute % 15 !== 0) {
    return { ok: false, error: "Elige una hora en intervalos de 15 minutos." };
  }

  return database.$transaction(async (transaction) => {
    const event = await lockEventByToken(transaction, token);
    if (!event || event.deletedAt || !event.isActive) {
      return { ok: false, error: "Este enlace de reserva ya no está disponible." };
    }

    const date = toDateOnly(event.startDate);
    const endDate = toDateOnly(event.endDate);
    if (input.date < date || input.date > endDate) {
      return { ok: false, error: "Elige una fecha dentro del período de este evento." };
    }

    const weekday = getWeekday(input.date);
    const windows = resolveWindowsForDate({
      date: input.date,
      weekdayEnabled:
        weekday !== null && getEnabledWeekdays(event.weekdays)[weekday] === true,
      weeklyWindows: event.weeklyWindows,
      exceptions: event.exceptions.map(toAvailabilityException),
    });
    const bookings = await transaction.booking.findMany({
      where: {
        eventId: event.id,
        status: "CONFIRMED",
        endAt: { gt: now },
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });
    const slot = calculateSlots({
      date: input.date,
      windows,
      durationMinutes: event.durationMinutes,
      bookings,
      now,
      incrementMinutes: input.mode === "standard" ? 15 : 1,
      timeZone: event.timeZone,
    }).find((candidate) => candidate.startMinute === minute);

    if (!slot) {
      return {
        ok: false,
        error: "Ese horario acaba de ocuparse o ya no está disponible. Elige otro.",
      };
    }

    const booking = await transaction.booking.create({
      data: {
        eventId: event.id,
        firstName,
        lastName,
        startAt: slot.startAt,
        endAt: slot.endAt,
      },
      select: { id: true, startAt: true, endAt: true },
    });

    return {
      ok: true,
      success: "Tu reserva quedó confirmada.",
      eventId: event.id,
      booking: {
        id: booking.id,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
      },
    };
  });
}

export async function cancelBookingForOwner(
  database: Database,
  ownerId: string,
  eventId: string,
  bookingId: string,
  now = new Date(),
): Promise<CalendarActionResult> {
  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    const booking = await transaction.booking.findFirst({
      where: { id: bookingId, eventId },
    });
    if (!booking || booking.status !== "CONFIRMED") {
      return { ok: false, error: "La reserva ya no está activa." };
    }
    if (booking.startAt <= now) {
      return { ok: false, error: "Solo puedes cancelar una reserva que aún no comienza." };
    }

    await transaction.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
    return { ok: true, success: "Se canceló la reserva." };
  });
}

export async function rescheduleBookingForOwner(
  database: Database,
  ownerId: string,
  eventId: string,
  bookingId: string,
  input: Pick<BookingInput, "date" | "startTime" | "mode">,
  now = new Date(),
): Promise<CalendarActionResult> {
  const minute = parseTimeToMinute(input.startTime);
  if (
    !isValidDateString(input.date) ||
    minute === null ||
    (input.mode !== "standard" && input.mode !== "precise") ||
    (input.mode === "standard" && minute % 15 !== 0)
  ) {
    return { ok: false, error: "Elige una fecha y una hora válidas." };
  }

  return database.$transaction(async (transaction) => {
    const event = await lockOwnedEvent(transaction, ownerId, eventId);
    if (!event || event.deletedAt) {
      return { ok: false, error: "No encontramos este evento." };
    }

    const booking = await transaction.booking.findFirst({
      where: { id: bookingId, eventId, status: "CONFIRMED" },
    });
    if (!booking || booking.startAt <= now) {
      return { ok: false, error: "No encontramos una reserva futura activa para cambiar." };
    }

    const date = toDateOnly(event.startDate);
    const endDate = toDateOnly(event.endDate);
    if (input.date < date || input.date > endDate) {
      return { ok: false, error: "Elige una fecha dentro del período de este evento." };
    }

    const weekday = getWeekday(input.date);
    const windows = resolveWindowsForDate({
      date: input.date,
      weekdayEnabled:
        weekday !== null && getEnabledWeekdays(event.weekdays)[weekday] === true,
      weeklyWindows: event.weeklyWindows,
      exceptions: event.exceptions.map(toAvailabilityException),
    });
    const bookings = await transaction.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        endAt: { gt: now },
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });
    const slot = calculateSlots({
      date: input.date,
      windows,
      durationMinutes: event.durationMinutes,
      bookings,
      now,
      incrementMinutes: input.mode === "standard" ? 15 : 1,
      timeZone: event.timeZone,
      excludeBookingId: bookingId,
    }).find((candidate) => candidate.startMinute === minute);

    if (!slot) {
      return {
        ok: false,
        error: "Ese horario no está disponible. La reserva original se conserva.",
      };
    }

    const updated = await transaction.booking.update({
      where: { id: bookingId },
      data: { startAt: slot.startAt, endAt: slot.endAt },
      select: { id: true, startAt: true, endAt: true },
    });
    return {
      ok: true,
      success: "Se cambió el horario de la reserva.",
      booking: {
        id: updated.id,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt.toISOString(),
      },
    };
  });
}

export function eventAvailability(event: EventWithAvailability): {
  enabledWeekdays: boolean[];
  weeklyWindows: TimeWindow[];
  exceptions: AvailabilityException[];
} {
  return {
    enabledWeekdays: getEnabledWeekdays(event.weekdays),
    weeklyWindows: event.weeklyWindows.map(({ startMinute, endMinute }) => ({
      startMinute,
      endMinute,
    })),
    exceptions: event.exceptions.map(toAvailabilityException),
  };
}

export function getAvailableSlotsForEvent(
  event: EventWithAvailability,
  date: string,
  bookings: readonly BookingInterval[],
  options: { now?: Date; incrementMinutes?: 1 | 15 } = {},
) {
  const weekday = getWeekday(date);
  const windows = resolveWindowsForDate({
    date,
    weekdayEnabled:
      weekday !== null && getEnabledWeekdays(event.weekdays)[weekday] === true,
    weeklyWindows: event.weeklyWindows,
    exceptions: event.exceptions.map(toAvailabilityException),
  });

  return calculateSlots({
    date,
    windows,
    durationMinutes: event.durationMinutes,
    bookings,
    now: options.now,
    incrementMinutes: options.incrementMinutes,
    timeZone: event.timeZone,
  });
}

function validateEventConfiguration(
  input: EventConfigurationInput,
  now: Date,
  requireFutureStart: boolean,
): string | null {
  const title = input.title.trim();
  if (title.length < 1 || title.length > 100) {
    return "El título debe tener entre 1 y 100 caracteres.";
  }
  if ((input.description?.trim().length ?? 0) > 500) {
    return "La descripción admite hasta 500 caracteres.";
  }
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    input.durationMinutes > 1440
  ) {
    return "La duración debe ser un número entero de minutos entre 1 y 1440.";
  }
  if (
    !isValidDateString(input.startDate) ||
    !isValidDateString(input.endDate) ||
    input.startDate > input.endDate
  ) {
    return "El período del evento no es válido.";
  }
  if (input.enabledWeekdays.length !== 7) {
    return "Selecciona los días semanales disponibles.";
  }
  const windowError = validateTimeWindows(input.weeklyWindows);
  if (windowError) return windowError;

  if (requireFutureStart) {
    const today = getLocalDateTime(now)?.date;
    if (!today || input.startDate < today) {
      return "La fecha de inicio debe ser hoy o una fecha futura.";
    }
  }

  return null;
}

function isValidWindow(window: TimeWindow): boolean {
  return (
    Number.isInteger(window.startMinute) &&
    Number.isInteger(window.endMinute) &&
    window.startMinute >= 0 &&
    window.startMinute < window.endMinute &&
    window.endMinute <= 24 * 60
  );
}

async function replaceWeeklySchedule(
  transaction: Transaction,
  eventId: string,
  input: EventConfigurationInput,
): Promise<void> {
  await transaction.weeklyDay.deleteMany({ where: { eventId } });
  await transaction.weeklyWindow.deleteMany({ where: { eventId } });
  await transaction.weeklyDay.createMany({
    data: input.enabledWeekdays.map((enabled, weekday) => ({
      eventId,
      weekday,
      enabled,
    })),
  });
  await transaction.weeklyWindow.createMany({
    data: input.weeklyWindows.map((window) => ({ eventId, ...window })),
  });
}

async function lockOwnedEvent(
  transaction: Transaction,
  ownerId: string,
  eventId: string,
): Promise<EventWithAvailability | null> {
  const rows = await transaction.$queryRaw<EventRowLock[]>`
    SELECT "id" FROM "Event"
    WHERE "id" = ${eventId} AND "ownerId" = ${ownerId}
    FOR UPDATE
  `;
  if (!rows[0]) return null;
  return transaction.event.findUnique({ where: { id: eventId }, include: eventInclude });
}

async function lockEventByToken(
  transaction: Transaction,
  token: string,
): Promise<EventWithAvailability | null> {
  const rows = await transaction.$queryRaw<EventRowLock[]>`
    SELECT "id" FROM "Event" WHERE "token" = ${token} FOR UPDATE
  `;
  if (!rows[0]) return null;
  return transaction.event.findUnique({ where: { id: rows[0].id }, include: eventInclude });
}

async function lockEventById(
  transaction: Transaction,
  eventId: string,
): Promise<void> {
  await transaction.$queryRaw<EventRowLock[]>`
    SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE
  `;
}

function getEnabledWeekdays(
  weekdays: readonly { weekday: number; enabled: boolean }[],
): boolean[] {
  return Array.from({ length: 7 }, (_, day) =>
    weekdays.find((weekday) => weekday.weekday === day)?.enabled === true,
  );
}

function toAvailabilityException(exception: {
  date: Date;
  kind: "OPEN" | "BLOCK";
  startMinute: number;
  endMinute: number;
}): AvailabilityException {
  return {
    date: toDateOnly(exception.date),
    kind: exception.kind,
    startMinute: exception.startMinute,
    endMinute: exception.endMinute,
  };
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toDatabaseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeDescription(value: string | null): string | null {
  const description = value?.trim() ?? "";
  return description || null;
}

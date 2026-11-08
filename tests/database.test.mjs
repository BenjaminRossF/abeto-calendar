import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, afterEach, before, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import {
  cancelBookingForOwner,
  createDateException,
  createPublicBooking,
  deleteDateException,
  updateEventConfiguration,
} from "../lib/calendar-service.ts";
import { localDateTimeToInstants } from "../lib/availability.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || new URL(databaseUrl).pathname !== "/abeto_calendar_test") {
  throw new Error("Las pruebas de integración solo pueden usar abeto_calendar_test.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const ownerIds = new Set();
const FIXED_NOW = new Date("2026-03-01T12:00:00.000Z");
const EVENT_START = new Date("2026-03-01T00:00:00.000Z");
const EVENT_END = new Date("2026-03-31T00:00:00.000Z");
const WEEKLY_WINDOWS = [
  { startMinute: 8 * 60, endMinute: 10 * 60 },
  { startMinute: 12 * 60, endMinute: 14 * 60 },
];

before(async () => prisma.$connect());

afterEach(async () => {
  if (ownerIds.size > 0) {
    await prisma.user.deleteMany({ where: { id: { in: [...ownerIds] } } });
    ownerIds.clear();
  }
});

after(async () => prisma.$disconnect());

test("serializa dos reservas simultáneas del mismo evento y la misma hora", async () => {
  const fixture = await createFixture();
  const input = bookingInput("09:00");

  const results = await Promise.all([
    createPublicBooking(prisma, fixture.event.token, input, FIXED_NOW),
    createPublicBooking(prisma, fixture.event.token, input, FIXED_NOW),
  ]);

  assert.equal(results.filter((result) => result.ok).length, 1);
  const bookings = await prisma.booking.findMany({
    where: { eventId: fixture.event.id, status: "CONFIRMED" },
  });
  assert.equal(bookings.length, 1);
});

test("permite reservar la misma hora en eventos independientes", async () => {
  const fixture = await createFixture();
  const secondEvent = await createEventForOwner(fixture.ownerId);
  const input = bookingInput("09:00");

  const results = await Promise.all([
    createPublicBooking(prisma, fixture.event.token, input, FIXED_NOW),
    createPublicBooking(prisma, secondEvent.token, input, FIXED_NOW),
  ]);

  assert.deepEqual(results.map((result) => result.ok), [true, true]);
});

test("un usuario distinto del dueño no puede cancelar una reserva", async () => {
  const fixture = await createFixture();
  const otherOwnerId = await createOwner();
  const result = await createPublicBooking(
    prisma,
    fixture.event.token,
    bookingInput("09:00"),
    FIXED_NOW,
  );
  assert.equal(result.ok, true);

  const booking = await prisma.booking.findFirstOrThrow({
    where: { eventId: fixture.event.id, status: "CONFIRMED" },
  });
  const cancellation = await cancelBookingForOwner(
    prisma,
    otherOwnerId,
    fixture.event.id,
    booking.id,
    FIXED_NOW,
  );

  assert.equal(cancellation.ok, false);
  const unchanged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
  assert.equal(unchanged.status, "CONFIRMED");
});

test("rechaza cambios semanales que invalidarían una reserva futura", async () => {
  const fixture = await createFixture();
  const reservation = await createPublicBooking(
    prisma,
    fixture.event.token,
    bookingInput("09:00"),
    FIXED_NOW,
  );
  assert.equal(reservation.ok, true);

  const change = await updateEventConfiguration(
    prisma,
    fixture.ownerId,
    fixture.event.id,
    configuration({ enabledWeekdays: Array(7).fill(false) }),
    FIXED_NOW,
  );

  assert.equal(change.ok, false);
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: fixture.event.id },
    include: { weekdays: true },
  });
  assert.equal(event.weekdays.some((day) => day.enabled), true);
});

test("no elimina una apertura fechada que sostiene una reserva futura", async () => {
  const fixture = await createFixture({ enabledWeekdays: Array(7).fill(false) });
  const exception = await createDateException(
    prisma,
    fixture.ownerId,
    fixture.event.id,
    {
      date: "2026-03-02",
      kind: "OPEN",
      startMinute: 8 * 60,
      endMinute: 10 * 60,
    },
    FIXED_NOW,
  );
  assert.equal(exception.ok, true);

  const reservation = await createPublicBooking(
    prisma,
    fixture.event.token,
    bookingInput("09:00"),
    FIXED_NOW,
  );
  assert.equal(reservation.ok, true);

  const savedException = await prisma.dateException.findFirstOrThrow({
    where: { eventId: fixture.event.id },
  });
  const deletion = await deleteDateException(
    prisma,
    fixture.ownerId,
    fixture.event.id,
    savedException.id,
    FIXED_NOW,
  );

  assert.equal(deletion.ok, false);
  assert.equal(
    await prisma.dateException.count({ where: { id: savedException.id } }),
    1,
  );
});

test("una reserva iniciada sigue ocupando su franja hasta la hora de término", async () => {
  const fixture = await createFixture();
  const now = new Date("2026-03-02T12:05:00.000Z");
  const startAt = localDateTimeToInstants("2026-03-02", 9 * 60)[0];
  assert.ok(startAt);
  await prisma.booking.create({
    data: {
      eventId: fixture.event.id,
      firstName: "Reserva",
      lastName: "En curso",
      startAt,
      endAt: new Date(startAt.getTime() + 30 * 60_000),
    },
  });

  const attempt = await createPublicBooking(
    prisma,
    fixture.event.token,
    bookingInput("09:15"),
    now,
  );

  assert.equal(attempt.ok, false);
});

test("serializa cambio de disponibilidad y reserva en el mismo evento", async () => {
  const fixture = await createFixture();
  const [booking, change] = await Promise.all([
    createPublicBooking(
      prisma,
      fixture.event.token,
      bookingInput("09:00"),
      FIXED_NOW,
    ),
    updateEventConfiguration(
      prisma,
      fixture.ownerId,
      fixture.event.id,
      configuration({ enabledWeekdays: Array(7).fill(false) }),
      FIXED_NOW,
    ),
  ]);

  assert.equal(Number(booking.ok) + Number(change.ok), 1);
  const savedBookings = await prisma.booking.count({
    where: { eventId: fixture.event.id, status: "CONFIRMED" },
  });
  assert.equal(savedBookings, booking.ok ? 1 : 0);
});

async function createFixture(options = {}) {
  const ownerId = await createOwner();
  const event = await createEventForOwner(ownerId, options);
  return { ownerId, event };
}

async function createOwner() {
  const id = `test-${randomUUID()}`;
  ownerIds.add(id);
  await prisma.user.create({
    data: {
      id,
      name: "Cuenta de prueba",
      email: `${randomUUID()}@example.test`,
    },
  });
  return id;
}

async function createEventForOwner(ownerId, options = {}) {
  const enabledWeekdays = options.enabledWeekdays ?? Array(7).fill(true);
  const weeklyWindows = options.weeklyWindows ?? WEEKLY_WINDOWS;
  return prisma.event.create({
    data: {
      ownerId,
      token: randomBytes(32).toString("base64url"),
      title: "Reunión de prueba",
      durationMinutes: 30,
      startDate: EVENT_START,
      endDate: EVENT_END,
      timeZone: "America/Santiago",
      weekdays: {
        create: enabledWeekdays.map((enabled, weekday) => ({ weekday, enabled })),
      },
      weeklyWindows: { create: weeklyWindows },
    },
  });
}

function bookingInput(startTime) {
  return {
    date: "2026-03-02",
    startTime,
    firstName: "Persona",
    lastName: "Invitada",
    mode: "standard",
  };
}

function configuration(overrides = {}) {
  return {
    title: "Reunión de prueba",
    description: null,
    durationMinutes: 30,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    enabledWeekdays: Array(7).fill(true),
    weeklyWindows: WEEKLY_WINDOWS,
    ...overrides,
  };
}

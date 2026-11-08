import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateSlots,
  getWeekday,
  intervalsOverlap,
  isValidDateString,
  localDateTimeToInstants,
  parseTimeToMinute,
  resolveWindowsForDate,
  validateTimeWindows,
} from "../lib/availability.ts";

const date = "2026-11-09";
const now = new Date("2026-11-01T12:00:00Z");
const morning = { startMinute: 480, endMinute: 600 };

test("valida fechas reales, minutos y franjas sin solapamientos", () => {
  assert.equal(isValidDateString("2028-02-29"), true);
  assert.equal(isValidDateString("2026-02-29"), false);
  assert.equal(isValidDateString("2026-13-01"), false);
  assert.equal(getWeekday(date), 1);
  assert.equal(parseTimeToMinute("14:50"), 890);
  assert.equal(parseTimeToMinute("24:00"), null);
  assert.equal(validateTimeWindows([morning, { startMinute: 720, endMinute: 840 }]), null);
  assert.ok(validateTimeWindows([morning, { startMinute: 590, endMinute: 700 }]));
  assert.ok(validateTimeWindows([{ startMinute: 1320, endMinute: 60 }]));
});

test("la pausa general y un bloqueo parcial se respetan incluso sobre aperturas", () => {
  const windows = resolveWindowsForDate({
    date,
    weekdayEnabled: true,
    weeklyWindows: [morning, { startMinute: 720, endMinute: 840 }],
    exceptions: [
      { date, kind: "OPEN", startMinute: 830, endMinute: 1000 },
      { date, kind: "BLOCK", startMinute: 890, endMinute: 960 },
      { date: "2026-11-10", kind: "BLOCK", startMinute: 0, endMinute: 1440 },
    ],
  });
  assert.deepEqual(windows, [
    morning,
    { startMinute: 720, endMinute: 890 },
    { startMinute: 960, endMinute: 1000 },
  ]);
});

test("una apertura habilita un día semanal cerrado, sin reemplazar otros intervalos", () => {
  assert.deepEqual(resolveWindowsForDate({
    date,
    weekdayEnabled: false,
    weeklyWindows: [morning],
    exceptions: [{ date, kind: "OPEN", startMinute: 890, endMinute: 960 }],
  }), [{ startMinute: 890, endMinute: 960 }]);
});

test("los inicios estándar mantienen la cuadrícula y los precisos admiten 14:50", () => {
  const options = {
    date, now, windows: [{ startMinute: 890, endMinute: 960 }], durationMinutes: 30,
  };
  assert.deepEqual(calculateSlots(options).map((slot) => slot.startTime), ["15:00", "15:15", "15:30"]);
  const precise = calculateSlots({ ...options, incrementMinutes: 1 });
  assert.equal(precise[0].startTime, "14:50");
  assert.equal(precise.at(-1).endTime, "16:00");
});

test("la reserva completa debe caber y no puede atravesar la pausa", () => {
  const slots = calculateSlots({
    date, now, windows: [morning, { startMinute: 720, endMinute: 840 }], durationMinutes: 45,
  });
  assert.equal(slots.some((slot) => slot.startTime === "09:30"), false);
  assert.equal(slots.some((slot) => slot.startTime === "09:15"), true);
  assert.equal(slots.some((slot) => slot.startTime === "11:45"), false);
});

test("los intervalos contiguos no se solapan y la ocupación funciona sin identificador", () => {
  assert.equal(intervalsOverlap({ startAt: 0, endAt: 30 }, { startAt: 30, endAt: 60 }), false);
  const [startAt] = localDateTimeToInstants(date, 480);
  const endAt = new Date(startAt.getTime() + 30 * 60_000);
  const slots = calculateSlots({
    date, now, windows: [morning], durationMinutes: 30, bookings: [{ startAt, endAt }],
  });
  assert.equal(slots.some((slot) => slot.startTime === "08:00"), false);
  assert.equal(slots.some((slot) => slot.startTime === "08:15"), false);
  assert.equal(slots.some((slot) => slot.startTime === "08:30"), true);
});

test("al reprogramar se excluye solo la propia reserva", () => {
  const [first] = localDateTimeToInstants(date, 480);
  const [second] = localDateTimeToInstants(date, 510);
  const slots = calculateSlots({
    date, now, windows: [morning], durationMinutes: 30, excludeBookingId: "mine",
    bookings: [
      { id: "mine", startAt: first, endAt: new Date(first.getTime() + 30 * 60_000) },
      { id: "other", startAt: second, endAt: new Date(second.getTime() + 30 * 60_000) },
    ],
  });
  assert.equal(slots.some((slot) => slot.startTime === "08:00"), true);
  assert.equal(slots.some((slot) => slot.startTime === "08:30"), false);
});

test("las reservas pasadas y las que comienzan exactamente ahora se rechazan", () => {
  const [startAt] = localDateTimeToInstants(date, 480);
  assert.equal(calculateSlots({ date: "2026-10-31", now, windows: [morning], durationMinutes: 30 }).length, 0);
  const slots = calculateSlots({ date, now: startAt, windows: [morning], durationMinutes: 30 });
  assert.equal(slots.some((slot) => slot.startTime === "08:00"), false);
  assert.equal(slots[0].startTime, "08:15");
});

test("Chile distingue una hora inexistente de una ambigua y de una normal", () => {
  assert.equal(localDateTimeToInstants("2026-09-06", 30).length, 0);
  assert.equal(localDateTimeToInstants("2026-04-04", 23 * 60 + 30).length, 2);
  assert.deepEqual(localDateTimeToInstants(date, 480).map((instant) => instant.toISOString()), ["2026-11-09T11:00:00.000Z"]);
});

test("no se ofrecen inicios ni finales ambiguos en el cambio de horario", () => {
  const slots = calculateSlots({
    date: "2026-04-04",
    now: new Date("2026-04-01T12:00:00Z"),
    windows: [{ startMinute: 22 * 60, endMinute: 24 * 60 }],
    durationMinutes: 30,
  });
  assert.equal(slots.some((slot) => slot.startTime === "23:00"), false);
  assert.equal(slots.some((slot) => slot.endTime === "23:00"), false);
  assert.equal(slots.some((slot) => slot.startTime === "22:00"), true);
});

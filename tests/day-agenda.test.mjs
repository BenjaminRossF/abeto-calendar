import assert from "node:assert/strict";
import { test } from "node:test";
import { getAgendaStartMinute, layoutAgendaBlocks } from "../lib/day-agenda.ts";

function block(id, startMinute, endMinute) {
  return {
    id,
    title: id,
    startMinute,
    endMinute,
    startTime: "09:00",
    endTime: "10:00",
  };
}

test("la agenda se desplaza una hora antes de la primera actividad y usa las ventanas", () => {
  assert.equal(getAgendaStartMinute([block("reunión", 570, 630)]), 480);
  assert.equal(getAgendaStartMinute([], [{ startMinute: 405, endMinute: 600 }]), 300);
  assert.equal(getAgendaStartMinute([]), 480);
});

test("ubica bloques proporcionalmente y crea columnas solo cuando se cruzan", () => {
  const layouts = layoutAgendaBlocks([
    block("primera", 540, 600),
    block("segunda", 570, 630),
    block("después", 630, 660),
  ]);

  assert.deepEqual(layouts.map(({ block: item, top, height, lane, lanes }) => ({
    id: item.id, top, height, lane, lanes,
  })), [
    { id: "primera", top: 576, height: 64, lane: 0, lanes: 2 },
    { id: "segunda", top: 608, height: 64, lane: 1, lanes: 2 },
    { id: "después", top: 672, height: 32, lane: 0, lanes: 1 },
  ]);
});

test("recorta los bloques a los límites del día e ignora intervalos vacíos", () => {
  const layouts = layoutAgendaBlocks([
    block("antes", -30, 15),
    block("cruza medianoche", 1430, 1500),
    block("vacío", 500, 500),
  ]);

  assert.deepEqual(layouts.map(({ block: item, top, height }) => ({ id: item.id, top, height })), [
    { id: "antes", top: 0, height: 16 },
    { id: "cruza medianoche", top: 1430 / 60 * 64, height: 10 / 60 * 64 },
  ]);
});

"use client";

import { useActionState, useOptimistic, useState } from "react";
import { CalendarPlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createDateExceptionAction, deleteDateExceptionAction } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { EventExceptionSummary } from "@/components/events/types";

const initialState: ActionState = { ok: false };
type OptimisticException = EventExceptionSummary & { pending?: boolean };
type ExceptionOptimisticAction =
  | { type: "add"; exception: OptimisticException }
  | { type: "remove"; id: string };

export function EventExceptions({
  eventId,
  startDate,
  endDate,
  today,
  exceptions,
}: {
  eventId: string;
  startDate: string;
  endDate: string;
  today: string;
  exceptions: EventExceptionSummary[];
}) {
  const [visibleExceptions, updateOptimisticExceptions] = useOptimistic<OptimisticException[], ExceptionOptimisticAction>(
    exceptions,
    (current, action) => action.type === "add"
      ? [...current, action.exception]
      : current.filter((exception) => exception.id !== action.id),
  );
  const [removeError, setRemoveError] = useState<string | null>(null);
  const createAction = createDateExceptionAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => {
      const date = String(formData.get("date") ?? "");
      const kind = formData.get("kind") === "OPEN" ? "OPEN" : "BLOCK";
      const startTime = String(formData.get("startTime") ?? "");
      const endTime = String(formData.get("endTime") ?? "");
      const startMinute = parseTime(startTime);
      const endMinute = parseTime(endTime);
      if (isDate(date) && startMinute !== null && endMinute !== null) {
        updateOptimisticExceptions({ type: "add", exception: {
          id: `pending-${date}-${startTime}`,
          date,
          kind,
          startMinute,
          endMinute,
          pending: true,
        } });
      }
      return createAction(_previous, formData);
    },
    initialState,
  );
  const initialDate = today >= startDate && today <= endDate ? today : startDate;
  const [date, setDate] = useState(initialDate);
  const [kind, setKind] = useState<"OPEN" | "BLOCK">("BLOCK");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");

  function removeOptimistic(id: string) {
    setRemoveError(null);
    updateOptimisticExceptions({ type: "remove", id });
  }

  return (
    <section aria-labelledby="event-exceptions-title" className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-primary">Ajustes puntuales</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight" id="event-exceptions-title">Excepciones por fecha</h2>
        <p className="mt-1 text-sm text-muted-foreground">Agrega una hora especial o bloquea una parte de un día concreto.</p>
      </div>

      <form action={formAction} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
            <CalendarPlus aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Agregar una excepción</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Los bloqueos tienen prioridad sobre cualquier disponibilidad para la misma fecha.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="exception-date">Fecha</label>
            <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="exception-date" max={endDate} min={startDate} name="date" onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="exception-kind">Qué quieres hacer</label>
            <select className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="exception-kind" name="kind" onChange={(event) => setKind(event.target.value as "OPEN" | "BLOCK")} value={kind}>
              <option value="BLOCK">Bloquear horario</option>
              <option value="OPEN">Agregar disponibilidad</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="exception-start">Desde</label>
            <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="exception-start" name="startTime" onChange={(event) => setStartTime(event.target.value)} required type="time" value={startTime} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="exception-end">Hasta</label>
            <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="exception-end" name="endTime" onChange={(event) => setEndTime(event.target.value)} required type="time" value={endTime} />
          </div>
        </div>
        {state.error ? <p aria-live="polite" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{state.error}</p> : null}
        {state.success ? <p aria-live="polite" className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm" role="status">{state.success}</p> : null}
        <div className="mt-4 flex justify-end">
          <Button disabled={pending} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : <Plus aria-hidden="true" data-icon="inline-start" />}
            {pending ? "Guardando…" : kind === "OPEN" ? "Agregar disponibilidad" : "Bloquear horario"}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Fechas con cambios</h3>
            <p className="mt-1 text-xs text-muted-foreground">Las reglas puntuales se aplican sobre el horario semanal.</p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{visibleExceptions.filter((item) => !item.id.startsWith("remove:")).length}</span>
        </div>
        {visibleExceptions.filter((item) => !item.id.startsWith("remove:")).length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Aún no hay ajustes por fecha. Puedes bloquear una pausa o abrir un horario extra arriba.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {visibleExceptions.filter((item) => !item.id.startsWith("remove:")).map((exception) => (
              <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={exception.id}>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{formatDate(exception.date)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${exception.kind === "BLOCK" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-foreground"}`}>
                      {exception.kind === "BLOCK" ? "Bloqueo" : "Disponibilidad extra"}
                    </span>
                    {exception.pending ? <span className="text-xs text-muted-foreground">Guardando…</span> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(exception.startMinute)}–{formatTime(exception.endMinute)} · hora de Chile</p>
                </div>
                {!exception.pending ? (
                  <ExceptionRemoveButton
                    eventId={eventId}
                    exception={exception}
                    onError={setRemoveError}
                    onOptimisticRemove={removeOptimistic}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {removeError ? <p aria-live="polite" className="mt-3 text-sm text-destructive" role="alert">{removeError}</p> : null}
      </div>
    </section>
  );
}

function ExceptionRemoveButton({
  eventId,
  exception,
  onError,
  onOptimisticRemove,
}: {
  eventId: string;
  exception: EventExceptionSummary;
  onError: (message: string | null) => void;
  onOptimisticRemove: (id: string) => void;
}) {
  const deleteAction = deleteDateExceptionAction.bind(null, eventId, exception.id);
  const [, formAction, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => {
      onOptimisticRemove(exception.id);
      const result = await deleteAction(formData);
      onError(result.error ?? null);
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Button aria-label={`Quitar excepción del ${formatDate(exception.date)}`} disabled={pending} size="sm" type="submit" variant="ghost">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : <Trash2 aria-hidden="true" data-icon="inline-start" />}
        {pending ? "Quitando…" : "Quitar"}
      </Button>
    </form>
  );
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isDate(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value);
}

function formatTime(value: number) {
  return `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${value}T12:00:00Z`));
}

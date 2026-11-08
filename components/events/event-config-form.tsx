"use client";

import { useActionState, useState } from "react";
import { Clock3, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { updateEventConfigAction } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { EventConfigPreview, EventSummary, TimeWindow } from "@/components/events/types";

const initialState: ActionState = { ok: false };
const weekdayOptions = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

type WindowValue = { start: string; end: string };

export function EventConfigForm({
  event,
  weekdays,
  weeklyWindows,
  onOptimisticChange,
}: {
  event: EventSummary;
  weekdays: boolean[];
  weeklyWindows: TimeWindow[];
  onOptimisticChange: (preview: EventConfigPreview) => void;
}) {
  const updateAction = updateEventConfigAction.bind(null, event.id);
  const [state, formAction, pending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const enabledDays = formData.getAll("enabledDays")
        .map((value) => Number(value))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
      const nextWindows: TimeWindow[] = [];
      for (let index = 0; index < 8; index += 1) {
        const start = timeToMinute(String(formData.get(`windowStart_${index}`) ?? ""));
        const end = timeToMinute(String(formData.get(`windowEnd_${index}`) ?? ""));
        if (start !== null && end !== null) nextWindows.push({ startMinute: start, endMinute: end });
      }
      const duration = Number(formData.get("durationMinutes"));
      onOptimisticChange({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? "").trim() || null,
        durationMinutes: Number.isFinite(duration) ? duration : event.durationMinutes,
        startDate: String(formData.get("startDate") ?? event.startDate),
        endDate: String(formData.get("endDate") ?? event.endDate),
        weekdays: Array.from({ length: 7 }, (_, day) => enabledDays.includes(day)),
        weeklyWindows: nextWindows,
      });
      return updateAction(previous, formData);
    },
    initialState,
  );
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [duration, setDuration] = useState(String(event.durationMinutes));
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate);
  const [enabledDays, setEnabledDays] = useState(() => weekdays.flatMap((enabled, day) => enabled ? [String(day)] : []));
  const [windows, setWindows] = useState<WindowValue[]>(() => weeklyWindows.map((window) => ({
    start: minuteToTime(window.startMinute),
    end: minuteToTime(window.endMinute),
  })));

  function toggleDay(day: string) {
    setEnabledDays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day]);
  }

  function updateWindow(index: number, field: keyof WindowValue, value: string) {
    setWindows((current) => current.map((window, windowIndex) =>
      windowIndex === index ? { ...window, [field]: value } : window));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="config-title">Nombre del evento</label>
          <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="config-title" maxLength={100} name="title" onChange={(event) => setTitle(event.target.value)} required value={title} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="config-description">Descripción <span className="font-normal text-muted-foreground">(opcional)</span></label>
          <textarea className="min-h-20 resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="config-description" maxLength={500} name="description" onChange={(event) => setDescription(event.target.value)} value={description} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="config-duration">Duración de cada reserva (minutos)</label>
          <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="config-duration" max={1440} min={1} name="durationMinutes" onChange={(event) => setDuration(event.target.value)} required type="number" value={duration} />
        </div>
        <p className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
          <Clock3 aria-hidden="true" className="size-4 shrink-0 text-primary" />
          Hora local de Chile ({event.timeZone}); fechas inclusivas.
        </p>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="config-start-date">Disponible desde</label>
          <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="config-start-date" name="startDate" onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="config-end-date">Disponible hasta</label>
          <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="config-end-date" min={startDate} name="endDate" onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Días habilitados</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {weekdayOptions.map((day) => (
            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring" key={day.value}>
              <input checked={enabledDays.includes(String(day.value))} className="size-4 accent-primary" name="enabledDays" onChange={() => toggleDay(String(day.value))} type="checkbox" value={day.value} />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Franjas semanales</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mt-1 text-xs text-muted-foreground">Las mismas franjas se aplican a todos los días habilitados.</p>
          </div>
          <Button disabled={windows.length >= 8} onClick={() => setWindows((current) => [...current, { start: "14:00", end: "16:00" }])} type="button" variant="outline">
            <Plus aria-hidden="true" data-icon="inline-start" /> Agregar franja
          </Button>
        </div>
        {windows.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            No hay horarios semanales. Agrega una franja para ofrecer disponibilidad recurrente.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {windows.map((window, index) => (
              <div className="grid items-end gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-[1fr_1fr_auto]" key={index}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor={`config-window-start-${index}`}>Desde</label>
                  <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id={`config-window-start-${index}`} name={`windowStart_${index}`} onChange={(event) => updateWindow(index, "start", event.target.value)} required type="time" value={window.start} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor={`config-window-end-${index}`}>Hasta</label>
                  <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id={`config-window-end-${index}`} name={`windowEnd_${index}`} onChange={(event) => updateWindow(index, "end", event.target.value)} required type="time" value={window.end} />
                </div>
                <Button aria-label={`Quitar franja ${index + 1}`} className="justify-self-end" disabled={windows.length <= 1} onClick={() => setWindows((current) => current.filter((_, windowIndex) => windowIndex !== index))} size="icon" type="button" variant="ghost">
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Puedes guardar hasta 8 franjas. Los cambios de disponibilidad no alteran las reservas existentes.</p>
      </fieldset>

      {state.error ? <p aria-live="polite" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.success ? <p aria-live="polite" className="rounded-xl border border-border bg-muted px-4 py-3 text-sm" role="status">{state.success}</p> : null}
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Las franjas y los días quedan compartidos dentro de este evento.</p>
        <Button className="w-fit" disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : <Save aria-hidden="true" data-icon="inline-start" />}
          {pending ? "Guardando cambios…" : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}

function minuteToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function timeToMinute(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

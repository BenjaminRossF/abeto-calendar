"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Clock3, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createEventAction } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { ok: false };
const weekdayOptions = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "0", label: "Domingo" },
];

type WindowValue = { start: string; end: string };

export function EventCreateForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [enabledDays, setEnabledDays] = useState(["1", "2", "3", "4", "5"]);
  const [windows, setWindows] = useState<WindowValue[]>([
    { start: "08:00", end: "10:00" },
    { start: "12:00", end: "14:00" },
  ]);

  function toggleDay(value: string) {
    setEnabledDays((current) => current.includes(value)
      ? current.filter((day) => day !== value)
      : [...current, value]);
  }

  function updateWindow(index: number, field: keyof WindowValue, value: string) {
    setWindows((current) => current.map((window, windowIndex) =>
      windowIndex === index ? { ...window, [field]: value } : window));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Detalles del evento</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lo que verán las personas cuando abras tu enlace.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="event-title">Nombre del evento</label>
            <input
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="event-title"
              maxLength={100}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="event-description">Descripción <span className="font-normal text-muted-foreground">(opcional)</span></label>
            <textarea
              className="min-h-24 resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="event-description"
              maxLength={500}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="event-duration">Duración de cada reserva</label>
            <select
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="event-duration"
              name="durationMinutes"
              onChange={(event) => setDuration(event.target.value)}
              value={duration}
            >
              {[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutos</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span>Las horas se muestran en Chile (America/Santiago).</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Fechas disponibles</h2>
          <p className="mt-1 text-sm text-muted-foreground">El rango incluye tanto el primer día como el último.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="event-start-date">Desde</label>
            <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="event-start-date" min={today} name="startDate" onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="event-end-date">Hasta</label>
            <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="event-end-date" min={startDate} name="endDate" onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <fieldset>
          <legend className="text-base font-semibold">Días de la semana</legend>
          <p className="mt-1 text-sm text-muted-foreground">Elige qué días se repite tu disponibilidad.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {weekdayOptions.map((day) => (
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring" key={day.value}>
                <input
                  checked={enabledDays.includes(day.value)}
                  className="size-4 accent-primary"
                  name="enabledDays"
                  onChange={() => toggleDay(day.value)}
                  type="checkbox"
                  value={day.value}
                />
                {day.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Franjas disponibles</h2>
            <p className="mt-1 text-sm text-muted-foreground">Estos horarios se repiten en los días seleccionados. Puedes agregar pausas.</p>
          </div>
          <Button disabled={windows.length >= 8} onClick={() => setWindows((current) => [...current, { start: "14:00", end: "16:00" }])} type="button" variant="outline">
            <Plus aria-hidden="true" data-icon="inline-start" /> Agregar franja
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {windows.map((window, index) => (
            <div className="grid items-end gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-[1fr_1fr_auto]" key={index}>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`window-start-${index}`}>Desde</label>
                <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id={`window-start-${index}`} name={`windowStart_${index}`} onChange={(event) => updateWindow(index, "start", event.target.value)} required type="time" value={window.start} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`window-end-${index}`}>Hasta</label>
                <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id={`window-end-${index}`} name={`windowEnd_${index}`} onChange={(event) => updateWindow(index, "end", event.target.value)} required type="time" value={window.end} />
              </div>
              <Button aria-label={`Quitar franja ${index + 1}`} className="justify-self-end" disabled={windows.length <= 1} onClick={() => setWindows((current) => current.filter((_, windowIndex) => windowIndex !== index))} size="icon" type="button" variant="ghost">
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Por defecto, Abeto ofrece 08:00–10:00 y 12:00–14:00 en hora de Chile. Máximo 8 franjas.</p>
      </section>

      {state.error ? <p aria-live="polite" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{state.error}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/dashboard">
          <ArrowLeft aria-hidden="true" className="size-4" /> Volver a mis eventos
        </Link>
        <Button className="h-11" disabled={pending} size="lg" type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : null}
          {pending ? "Creando evento…" : "Crear evento"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useOptimistic, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, ExternalLink, Link2, LoaderCircle } from "lucide-react";
import { setEventActiveAction } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { EventArchiveDialog } from "@/components/events/event-archive-dialog";
import { EventConfigForm } from "@/components/events/event-config-form";
import { EventExceptions } from "@/components/events/event-exceptions";
import { MonthlyEventCalendar } from "@/components/events/monthly-event-calendar";
import type { EventConfigPreview, EventDetailsProps } from "@/components/events/types";

const initialState: ActionState = { ok: false };

export function EventManagement({
  event,
  weekdays,
  weeklyWindows,
  exceptions,
  bookings,
  month,
  selectedDate,
  today,
  now,
}: EventDetailsProps) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(event.isActive);
  const [optimisticConfig, setOptimisticConfig] = useOptimistic<EventConfigPreview>({
    title: event.title,
    description: event.description,
    durationMinutes: event.durationMinutes,
    startDate: event.startDate,
    endDate: event.endDate,
    weekdays,
    weeklyWindows,
  });
  const [activeState, activeFormAction, activePending] = useActionState(
    async (_previous: ActionState, formData: FormData) => {
      setOptimisticActive(!event.isActive);
      return setEventActiveAction(event.id, !event.isActive, formData);
    },
    initialState,
  );

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="event-title" className="flex flex-col gap-5">
        <Link className="inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/dashboard">
          <ArrowLeft aria-hidden="true" className="size-4" /> Mis eventos
        </Link>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight">{optimisticConfig.title}</h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${optimisticActive ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground"}`}>
                {optimisticActive ? "Recibiendo reservas" : "Reservas pausadas"}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {optimisticConfig.description || "Configura tu disponibilidad y comparte el enlace con quienes quieran reservar."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDate(optimisticConfig.startDate)}–{formatDate(optimisticConfig.endDate)} · {optimisticConfig.durationMinutes} min · {optimisticConfig.weekdays.filter(Boolean).length} días · {optimisticConfig.weeklyWindows.length} franjas
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <form action={activeFormAction}>
              <Button disabled={activePending} size="sm" type="submit" variant="outline">
                {activePending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : null}
                {optimisticActive ? "Pausar reservas" : "Publicar evento"}
              </Button>
            </form>
            <EventArchiveDialog eventId={event.id} />
          </div>
        </div>
        {activeState.error ? (
          <p aria-live="polite" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {activeState.error}
          </p>
        ) : null}
        <ShareEventLink shareUrl={event.shareUrl} />
      </section>

      <MonthlyEventCalendar
        bookings={bookings}
        event={event}
        exceptions={exceptions}
        month={month}
        selectedDate={selectedDate}
        today={today}
        now={now}
        weekdays={weekdays}
        weeklyWindows={weeklyWindows}
      />

      <section aria-labelledby="weekly-config-title" className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Disponibilidad semanal</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight" id="weekly-config-title">Configurar el evento</h2>
          <p className="mt-1 text-sm text-muted-foreground">Los cambios se aplican a los días y horarios de este evento.</p>
        </div>
        <EventConfigForm
          event={event}
          onOptimisticChange={setOptimisticConfig}
          weekdays={weekdays}
          weeklyWindows={weeklyWindows}
        />
      </section>

      <EventExceptions endDate={event.endDate} exceptions={exceptions} eventId={event.id} startDate={event.startDate} today={today} />
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", day: "numeric", month: "short" })
    .format(new Date(`${value}T12:00:00Z`));
}

function ShareEventLink({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyShareUrl() {
    const url = new URL(shareUrl, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
          <Link2 aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Enlace público de reservas</p>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{new URL(shareUrl, "https://abeto.invalid").pathname}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button className="w-fit" onClick={copyShareUrl} size="sm" type="button" variant="outline">
          {copied ? <Check aria-hidden="true" data-icon="inline-start" /> : <Copy aria-hidden="true" data-icon="inline-start" />}
          {copied ? "Copiado" : "Copiar enlace"}
        </Button>
        <a className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={shareUrl} rel="noreferrer" target="_blank" aria-label="Abrir página pública de reservas en otra pestaña">
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
      <p aria-live="polite" className="sr-only" role="status">
        {copied ? "Enlace copiado al portapapeles." : copyError ? "No se pudo copiar. Puedes seleccionar el enlace que aparece arriba." : ""}
      </p>
      {copyError ? <p className="text-xs text-destructive sm:basis-full">No se pudo copiar el enlace. Puedes abrirlo y copiarlo desde la barra de direcciones.</p> : null}
    </div>
  );
}

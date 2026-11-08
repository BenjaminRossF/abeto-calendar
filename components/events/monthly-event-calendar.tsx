"use client";

import { useActionState, useOptimistic, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, LoaderCircle, X } from "lucide-react";
import { cancelBookingAction, rescheduleBookingAction } from "@/app/dashboard/actions";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BookingSummary, EventExceptionSummary, EventSummary, TimeWindow } from "@/components/events/types";
import { DayAgenda } from "@/components/events/day-agenda";
import { getWeekday, resolveWindowsForDate } from "@/lib/availability";

const initialState: ActionState = { ok: false };
const weekLabels = [
  { short: "Lu", full: "Lunes" },
  { short: "Ma", full: "Martes" },
  { short: "Mi", full: "Miércoles" },
  { short: "Ju", full: "Jueves" },
  { short: "Vi", full: "Viernes" },
  { short: "Sá", full: "Sábado" },
  { short: "Do", full: "Domingo" },
];

type OptimisticBookingAction = { type: "remove"; id: string };

export function MonthlyEventCalendar({
  event,
  weekdays,
  weeklyWindows,
  exceptions,
  bookings,
  month,
  selectedDate: initialDate,
  today,
  now,
}: {
  event: EventSummary;
  weekdays: boolean[];
  weeklyWindows: TimeWindow[];
  exceptions: EventExceptionSummary[];
  bookings: BookingSummary[];
  month: string;
  selectedDate: string;
  today: string;
  now: string;
}) {
  const [visibleBookings, updateOptimisticBookings] = useOptimistic<BookingSummary[], OptimisticBookingAction>(
    bookings,
    (current, action) => action.type === "remove"
      ? current.filter((booking) => booking.id !== action.id)
      : current,
  );
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [activeBooking, setActiveBooking] = useState<BookingSummary | null>(null);
  const focusReturnRef = useRef<HTMLButtonElement | null>(null);
  const cells = getMonthCells(month);
  const rows = Math.ceil(cells.length / 7);
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const firstMonth = event.startDate.slice(0, 7);
  const lastMonth = event.endDate.slice(0, 7);
  const previousDisabled = previousMonth < firstMonth;
  const nextDisabled = nextMonth > lastMonth;
  const monthLabel = formatMonth(month);
  const bookingGroups = groupByDate(visibleBookings, event.timeZone);
  const selectedBookings = bookingGroups.get(selectedDate) ?? [];
  const weekday = getWeekday(selectedDate);
  const selectedWindows = resolveWindowsForDate({
    date: selectedDate,
    weekdayEnabled: weekday !== null && weekdays[weekday] === true,
    weeklyWindows,
    exceptions,
  });
  const agendaBlocks = selectedBookings.map((booking) => ({
    id: booking.id,
    title: `${booking.firstName} ${booking.lastName}`,
    startMinute: getLocalMinute(booking.startAt, event.timeZone),
    endMinute: dateInZone(booking.endAt, event.timeZone) !== dateInZone(booking.startAt, event.timeZone)
      ? 1440
      : getLocalMinute(booking.endAt, event.timeZone),
    startTime: formatTime(booking.startAt, event.timeZone),
    endTime: dateInZone(booking.endAt, event.timeZone) !== dateInZone(booking.startAt, event.timeZone)
      ? "24:00"
      : formatTime(booking.endAt, event.timeZone),
  }));

  function closeBookingSheet() {
    setActiveBooking(null);
    window.requestAnimationFrame(() => {
      if (focusReturnRef.current?.isConnected) {
        focusReturnRef.current.focus();
      } else {
        document.getElementById(`calendar-day-${selectedDate}`)?.focus();
      }
    });
  }

  return (
    <section aria-labelledby="event-calendar-title" className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-primary">Vista mensual</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight" id="event-calendar-title">Calendario de reservas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Selecciona un día para revisar sus reservas. Los horarios están en hora de Chile.</p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary">
                <CalendarDays aria-hidden="true" className="size-4" />
              </span>
              <h3 aria-live="polite" className="text-base font-semibold capitalize">{monthLabel}</h3>
            </div>
            <div className="flex items-center gap-1">
              {previousDisabled ? (
                <Button aria-label="No hay un mes anterior dentro del evento" disabled size="icon" type="button" variant="ghost"><ArrowLeft aria-hidden="true" /></Button>
              ) : (
                <Link aria-label={`Ver ${formatMonth(previousMonth)}`} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/dashboard/events/${event.id}?month=${previousMonth}`} prefetch={true}>
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </Link>
              )}
              {nextDisabled ? (
                <Button aria-label="No hay un mes siguiente dentro del evento" disabled size="icon" type="button" variant="ghost"><ArrowRight aria-hidden="true" /></Button>
              ) : (
                <Link aria-label={`Ver ${formatMonth(nextMonth)}`} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/dashboard/events/${event.id}?month=${nextMonth}`} prefetch={true}>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              )}
            </div>
          </div>

          <div aria-label={`Calendario mensual de ${monthLabel}`} className="flex flex-col gap-1" role="grid">
            <div className="grid grid-cols-7" role="row">
              {weekLabels.map((day) => (
                <div className="py-2 text-center text-xs font-medium text-muted-foreground" key={day.full} role="columnheader">
                  <span className="sm:hidden" title={day.full}>{day.short}</span>
                  <span className="hidden sm:inline">{day.full}</span>
                </div>
              ))}
            </div>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <div className="grid grid-cols-7 gap-1" key={rowIndex} role="row">
                {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell, cellIndex) => {
                  if (!cell.date) return <div aria-hidden="true" className="min-h-16 sm:min-h-[5.5rem]" key={`empty-${rowIndex}-${cellIndex}`} role="gridcell" />;
                  const date = cell.date;
                  const dayBookings = bookingGroups.get(date) ?? [];
                  const inEventRange = date >= event.startDate && date <= event.endDate;
                  const selected = date === selectedDate;
                  const isToday = date === today;
                  const visibleBookings = dayBookings.slice(0, 2);
                  const extraCount = Math.max(0, dayBookings.length - visibleBookings.length);
                  const previewNames = visibleBookings.map((booking) => `${formatTime(booking.startAt, event.timeZone)} ${booking.firstName}`).join(", ");
                  const accessibleLabel = `${formatDateLong(date)}${dayBookings.length ? `, ${dayBookings.length} ${dayBookings.length === 1 ? "reserva" : "reservas"}${previewNames ? `: ${previewNames}` : ""}` : ", sin reservas"}${isToday ? ", hoy" : ""}`;

                  return (
                    <div aria-selected={selected} className="min-h-16 sm:min-h-[5.5rem]" key={date} role="gridcell">
                      <button
                        aria-label={accessibleLabel}
                        aria-pressed={selected}
                        className={`flex h-full min-h-16 w-full flex-col items-start overflow-hidden rounded-xl border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[5.5rem] sm:p-2 ${selected ? "border-primary bg-primary/15 text-foreground" : "border-transparent hover:border-border hover:bg-muted/70"} ${isToday && !selected ? "ring-1 ring-primary/60" : ""} ${!inEventRange ? "cursor-not-allowed opacity-40" : ""}`}
                        disabled={!inEventRange}
                        id={`calendar-day-${date}`}
                        onClick={() => setSelectedDate(date)}
                        onKeyDown={(keyboardEvent) => {
                          const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
                          const offset = keyboardEvent.key === "ArrowLeft" ? -1
                            : keyboardEvent.key === "ArrowRight" ? 1
                              : keyboardEvent.key === "ArrowUp" ? -7
                                : keyboardEvent.key === "ArrowDown" ? 7
                                  : keyboardEvent.key === "Home" ? -weekday
                                    : keyboardEvent.key === "End" ? 6 - weekday
                                      : null;
                          if (offset !== null) {
                            keyboardEvent.preventDefault();
                            focusCalendarDate(date, offset, month, event.startDate, event.endDate, setSelectedDate);
                          }
                        }}
                        tabIndex={selected ? 0 : -1}
                        type="button"
                      >
                        <span className="flex w-full items-center justify-between gap-1">
                          <span className="text-sm font-medium">{cell.day}</span>
                          {dayBookings.length > 0 ? <span aria-hidden="true" className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground">{dayBookings.length}</span> : null}
                        </span>
                        <span className="mt-auto flex w-full flex-col gap-0.5 text-[9px] leading-tight">
                          {visibleBookings.map((booking) => (
                            <span className="block w-full truncate" key={booking.id}>
                              <span className="font-medium tabular-nums">{formatTime(booking.startAt, event.timeZone)}</span>
                              <span className="hidden sm:inline"> {booking.firstName}</span>
                            </span>
                          ))}
                          {extraCount > 0 ? <span className="block truncate font-medium">+{extraCount} más</span> : null}
                          {dayBookings.length === 0 && inEventRange ? <span className="block truncate text-muted-foreground">Libre</span> : null}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Las fechas resaltadas tienen reservas confirmadas. Pulsa un día para ver sus detalles.</p>
        </div>

      </div>

      <DayAgenda
        blocks={agendaBlocks}
        date={selectedDate}
        emptyMessage={selectedBookings.length > 0
          ? undefined
          : selectedWindows.length === 0
            ? "Este día no tiene horas de atención configuradas."
            : "No hay reservas confirmadas para este día."}
        onSelectBlock={(block, trigger) => {
          const booking = selectedBookings.find((item) => item.id === block.id);
          if (!booking) return;
          focusReturnRef.current = trigger;
          setActiveBooking(booking);
        }}
        timeZone={event.timeZone}
        windows={selectedWindows}
      />

      <BookingDetailsSheet
        booking={activeBooking}
        event={event}
        eventId={event.id}
        now={now}
        onClose={closeBookingSheet}
        onOptimisticCancel={(id) => updateOptimisticBookings({ type: "remove", id })}
      />
    </section>
  );
}

function BookingDetailsSheet({
  booking,
  event,
  eventId,
  now,
  onClose,
  onOptimisticCancel,
}: {
  booking: BookingSummary | null;
  event: EventSummary;
  eventId: string;
  now: string;
  onClose: () => void;
  onOptimisticCancel: (id: string) => void;
}) {
  return (
    <Sheet open={Boolean(booking)} onOpenChange={(open) => { if (!open) onClose(); }}>
      {booking ? (
        <SheetContent aria-label="Detalles y acciones de la reserva">
          <div className="relative">
            <SheetHeader className="pr-11">
              <SheetTitle className="text-lg font-semibold">Detalles de la reserva</SheetTitle>
              <SheetDescription className="text-sm leading-5 text-muted-foreground">
                Revisa los datos y administra el horario con la persona.
              </SheetDescription>
            </SheetHeader>
            <SheetClose aria-label="Cerrar detalles de la reserva" className="absolute right-0 top-0">
              <X aria-hidden="true" />
            </SheetClose>
          </div>
          <SheetBody className="px-0 pb-6">
            <BookingSummaryCard booking={booking} event={event} />
            <BookingActions
              booking={booking}
              event={event}
              eventId={eventId}
              now={now}
              onClose={onClose}
              onOptimisticCancel={onOptimisticCancel}
            />
          </SheetBody>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function BookingSummaryCard({ booking, event }: { booking: BookingSummary; event: EventSummary }) {
  return (
    <section aria-label="Datos de la reserva" className="rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{booking.firstName} {booking.lastName}</p>
          <p className="mt-1 text-xs text-muted-foreground">Reserva confirmada</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium">Activa</span>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Fecha</dt>
          <dd className="text-right font-medium capitalize">{formatDateLong(dateInZone(booking.startAt, event.timeZone))}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Horario</dt>
          <dd className="font-medium tabular-nums">{formatTime(booking.startAt, event.timeZone)}–{formatTime(booking.endAt, event.timeZone)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Duración</dt>
          <dd className="font-medium">{event.durationMinutes} minutos</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">La hora corresponde a Chile ({event.timeZone}).</p>
    </section>
  );
}

function BookingActions({
  booking,
  event,
  eventId,
  now,
  onClose,
  onOptimisticCancel,
}: {
  booking: BookingSummary;
  event: EventSummary;
  eventId: string;
  now: string;
  onClose: () => void;
  onOptimisticCancel: (id: string) => void;
}) {
  const router = useRouter();
  const canChange = new Date(booking.startAt).getTime() > new Date(now).getTime();
  const rescheduleAction = rescheduleBookingAction.bind(null, eventId, booking.id);
  const [optimisticSlot, setOptimisticSlot] = useOptimistic<{ date: string; time: string } | null>(null);
  const [rescheduleState, rescheduleFormAction, reschedulePending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const date = String(formData.get("date") ?? "");
      const time = String(formData.get("startTime") ?? "");
      setOptimisticSlot({ date, time });
      const result = await rescheduleAction(previous, formData);
      if (result.ok) {
        router.push(`/dashboard/events/${eventId}?month=${date.slice(0, 7)}&date=${date}`);
        onClose();
      }
      return result;
    },
    initialState,
  );
  const cancelAction = cancelBookingAction.bind(null, eventId, booking.id);
  const [cancelState, cancelFormAction, cancelPending] = useActionState(
    async (_previous: ActionState, formData: FormData) => {
      onOptimisticCancel(booking.id);
      const result = await cancelAction(formData);
      if (result.ok) onClose();
      return result;
    },
    initialState,
  );
  const [date, setDate] = useState(dateInZone(booking.startAt, event.timeZone));
  const [startTime, setStartTime] = useState(timeForInput(booking.startAt, event.timeZone));
  const [mode, setMode] = useState<"standard" | "precise">(() => {
    const [hour, minute] = timeForInput(booking.startAt, event.timeZone).split(":").map(Number);
    return (hour * 60 + minute) % 15 === 0 ? "standard" : "precise";
  });
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!canChange) {
    return (
      <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm leading-5 text-muted-foreground">
        Esta reserva ya comenzó o terminó. No se puede reprogramar ni cancelar desde aquí.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="reschedule-title" className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold" id="reschedule-title">Cambiar horario</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">La disponibilidad se vuelve a comprobar al guardar.</p>
        </div>
        <form action={rescheduleFormAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="booking-new-date">Nueva fecha</label>
            <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="booking-new-date" max={event.endDate} min={event.startDate} name="date" onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="booking-new-time">Nueva hora</label>
              <input className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="booking-new-time" name="startTime" onChange={(event) => setStartTime(event.target.value)} required step={mode === "standard" ? 900 : 60} type="time" value={startTime} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="booking-new-mode">Incremento</label>
              <select className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="booking-new-mode" name="mode" onChange={(event) => setMode(event.target.value as "standard" | "precise")} value={mode}>
                <option value="standard">15 minutos</option>
                <option value="precise">1 minuto</option>
              </select>
            </div>
          </div>
          {optimisticSlot ? (
            <p aria-live="polite" className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" role="status">
              Cambiando la reserva a {formatDateLong(optimisticSlot.date)} a las {optimisticSlot.time}…
            </p>
          ) : null}
          {rescheduleState.error ? <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{rescheduleState.error}</p> : null}
          <Button disabled={reschedulePending} type="submit">
            {reschedulePending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : null}
            {reschedulePending ? "Reprogramando…" : "Guardar nuevo horario"}
          </Button>
        </form>
      </section>

      <section aria-labelledby="cancel-booking-title" className="flex flex-col gap-3 border-t border-border pt-5">
        <div>
          <h3 className="text-sm font-semibold" id="cancel-booking-title">Cancelar reserva</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">La persona dejará de ocupar este horario.</p>
        </div>
        {cancelState.error ? <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{cancelState.error}</p> : null}
        {confirmCancel ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium">¿Cancelar la reserva de {booking.firstName}?</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Esta acción liberará el horario para nuevas reservas.</p>
            <form action={cancelFormAction} className="mt-3 flex flex-wrap gap-2">
              <Button disabled={cancelPending} size="sm" type="submit" variant="destructive">
                {cancelPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : null}
                {cancelPending ? "Cancelando…" : "Confirmar cancelación"}
              </Button>
              <Button disabled={cancelPending} onClick={() => setConfirmCancel(false)} size="sm" type="button" variant="outline">Volver</Button>
            </form>
          </div>
        ) : (
          <Button className="w-fit" onClick={() => setConfirmCancel(true)} type="button" variant="outline">Cancelar reserva</Button>
        )}
      </section>
    </div>
  );
}

function getMonthCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const mondayOffset = (firstDay + 6) % 7;
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - mondayOffset + 1;
    if (day < 1 || day > daysInMonth) return { date: null, day: null };
    return { date: `${month}-${String(day).padStart(2, "0")}`, day };
  });
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", month: "long", year: "numeric" })
    .format(new Date(`${month}-01T12:00:00Z`));
}

function groupByDate(bookings: BookingSummary[], timeZone: string) {
  const grouped = new Map<string, BookingSummary[]>();
  for (const booking of bookings) {
    const date = dateInZone(booking.startAt, timeZone);
    const current = grouped.get(date) ?? [];
    current.push(booking);
    grouped.set(date, current);
  }
  return grouped;
}

function dateInZone(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function timeForInput(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function getLocalMinute(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone,
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function formatDateLong(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function focusCalendarDate(
  currentDate: string,
  dayOffset: number,
  month: string,
  eventStart: string,
  eventEnd: string,
  setSelectedDate: (date: string) => void,
) {
  const [year, monthNumber, day] = currentDate.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, monthNumber - 1, day + dayOffset))
    .toISOString()
    .slice(0, 10);
  if (targetDate.slice(0, 7) !== month || targetDate < eventStart || targetDate > eventEnd) return;

  setSelectedDate(targetDate);
  window.requestAnimationFrame(() => {
    document.getElementById(`calendar-day-${targetDate}`)?.focus();
  });
}

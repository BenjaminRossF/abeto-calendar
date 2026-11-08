"use client";

import { useActionState, useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, LoaderCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { DayAgenda } from "@/components/events/day-agenda";
import type { ActionState } from "@/app/actions/auth";
import { minuteToTime } from "@/lib/availability";

type BookingSlot = Readonly<{ startMinute: number; startTime: string; endTime: string }>;
type BookingWindow = Readonly<{ startMinute: number; endMinute: number; startTime: string; endTime: string }>;
type OccupiedBlock = Readonly<{ startMinute: number; endMinute: number; startTime: string; endTime: string }>;

export type PublicBookingView = Readonly<{
  title: string;
  description: string | null;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  selectedDate: string;
  timeZone: "America/Santiago";
  windows: readonly BookingWindow[];
  slots: readonly BookingSlot[];
  occupiedBlocks: readonly OccupiedBlock[];
  hasPreciseAvailability: boolean;
  firstPreciseTime: string | null;
}>;

type PublicBookingActionState = ActionState;
type PublicBookingAction = (formData: FormData) => Promise<PublicBookingActionState>;
type BookingMode = "standard" | "precise";
export type PublicBookingSection = "calendar" | "timeline";
type Confirmation = Readonly<{ firstName: string; lastName: string; date: string; startTime: string; endTime: string }>;

const initialState: PublicBookingActionState = { ok: false };
const weekdayLabels = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export function PublicBookingFlow({
  view,
  action,
  initialSection,
}: {
  view: PublicBookingView;
  action: PublicBookingAction;
  initialSection: PublicBookingSection;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [changingDate, startChangingDate] = useTransition();
  const [visibleMonth, setVisibleMonth] = useState(() => monthOf(view.selectedDate));
  const [openSections, setOpenSections] = useState<PublicBookingSection[]>([initialSection]);
  const [mode, setMode] = useState<BookingMode>("standard");
  const [startTime, setStartTime] = useState(view.slots[0]?.startTime ?? view.firstPreciseTime ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const actionWithState = useCallback(async (
    _previousState: PublicBookingActionState,
    formData: FormData,
  ): Promise<PublicBookingActionState> => {
    const result = await action(formData);

    if (result.ok) {
      const submittedDate = stringValue(formData.get("date"));
      const submittedTime = stringValue(formData.get("startTime"));
      const submittedFirstName = stringValue(formData.get("firstName")).trim();
      const submittedLastName = stringValue(formData.get("lastName")).trim();
      const minute = timeToMinute(submittedTime);
      if (minute !== null) {
        setConfirmation({
          firstName: submittedFirstName,
          lastName: submittedLastName,
          date: submittedDate,
          startTime: submittedTime,
          endTime: minuteToTime(minute + view.durationMinutes),
        });
      }
    } else if (result.error?.includes("acaba de ocuparse")) {
      router.refresh();
    }

    return result;
  }, [action, router, view.durationMinutes]);

  const [state, formAction, pending] = useActionState(actionWithState, initialState);

  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-CL", { dateStyle: "full", timeZone: "UTC" }),
    [],
  );
  const dateLabel = useMemo(
    () => formatDate(view.selectedDate),
    [view.selectedDate],
  );
  const slotIsCurrent = view.slots.some((slot) => slot.startTime === startTime);
  const canBookPrecisely = view.hasPreciseAvailability && startTime.length > 0;
  const canSubmit = mode === "standard" ? slotIsCurrent : canBookPrecisely;
  const agendaBlocks = view.occupiedBlocks.map((block, index) => ({
    id: `${block.startMinute}-${index}`,
    title: "Ocupado",
    startMinute: block.startMinute,
    endMinute: block.endMinute,
    startTime: block.startTime,
    endTime: block.endTime,
  }));

  function selectDate(date: string) {
    if (changingDate || pending) return;
    setOpenSections(["timeline"]);
    if (date === view.selectedDate) return;
    startChangingDate(() => router.push(`${pathname}?date=${date}&section=timeline`, { scroll: false }));
  }

  if (confirmation) {
    return <BookingConfirmation confirmation={confirmation} durationMinutes={view.durationMinutes} timeZone={view.timeZone} />;
  }

  return (
    <div className="flex flex-col gap-7 md:h-full md:min-h-0 md:gap-5">
      <header className="max-w-3xl">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{view.title}</h1>
        {view.description ? (
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{view.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-4 text-primary" />{view.durationMinutes} minutos</span>
          <span>{formatDateRange(view.startDate, view.endDate)}</span>
          <span>{view.timeZone}</span>
        </div>
      </header>

      <div className="grid gap-y-6 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:gap-x-6 md:gap-y-0">
        <div className="flex min-w-0 flex-col md:col-start-1 md:row-start-1 md:min-h-0">
          <Card className="flex min-h-0 flex-1 flex-col gap-0 p-0">
            <Accordion
              className="flex min-h-0 flex-1 flex-col"
              onValueChange={(value) => {
                if (value.length > 0) setOpenSections(value as PublicBookingSection[]);
              }}
              value={openSections}
            >
              <AccordionItem value="calendar">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pt-5 pb-3">
                  <AccordionTrigger className="min-w-0 flex-1 p-0 hover:no-underline">
                    <span className="min-w-0 text-left">
                      <span className="block text-base font-semibold" id="booking-date-heading">Elige una fecha</span>
                      <span className="mt-1 block text-sm font-normal text-muted-foreground">Los horarios se muestran en hora de Chile.</span>
                    </span>
                  </AccordionTrigger>
                  <CardAction className="mt-0 flex shrink-0 items-center gap-1">
                    <Button aria-label="Mostrar mes anterior" disabled={!canMoveMonth(visibleMonth, view.startDate) || changingDate || pending} onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))} size="icon" type="button" variant="ghost">
                      <ChevronLeft aria-hidden="true" />
                    </Button>
                    <Button aria-label="Mostrar mes siguiente" disabled={!canMoveMonth(visibleMonth, view.endDate, true) || changingDate || pending} onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))} size="icon" type="button" variant="ghost">
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </CardAction>
                </CardHeader>

                <AccordionContent>
                  <CardContent className="flex flex-col gap-3 pt-0">
                    <div aria-label="Calendario de fechas disponibles" className="flex flex-col gap-3">
                      <h3 aria-live="polite" className="text-center text-sm font-semibold capitalize">{formatMonth(visibleMonth)}</h3>
                      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
                        <thead>
                          <tr>
                            {weekdayLabels.map((weekday) => <th className="pb-1 text-xs font-medium text-muted-foreground" key={weekday} scope="col">{weekday}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {monthDays.map((week, weekIndex) => (
                            <tr key={`${visibleMonth}-${weekIndex}`}>
                              {week.map((date, dayIndex) => {
                                if (!date) return <td aria-hidden="true" key={`blank-${weekIndex}-${dayIndex}`} />;
                                const inRange = date >= view.startDate && date <= view.endDate;
                                const selectable = inRange && date >= getTodayInChile();
                                const selected = date === view.selectedDate;
                                return (
                                  <td key={date}>
                                    <Button
                                      aria-label={dateFormatter.format(dateAtNoonUtc(date))}
                                      aria-pressed={selected}
                                      className="aspect-square w-full px-0"
                                      disabled={!selectable || changingDate || pending}
                                      onClick={() => selectDate(date)}
                                      size="sm"
                                      type="button"
                                      variant={selected ? "default" : "ghost"}
                                    >
                                      {dayOfMonth(date)}
                                    </Button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p aria-live="polite" className="min-h-5 text-center text-xs text-muted-foreground" role="status">
                        {changingDate ? "Actualizando horarios…" : `${dateLabel}`}
                      </p>
                    </div>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="min-h-0 md:flex md:flex-1 md:flex-col" value="timeline">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-medium text-primary">Agenda del día</span>
                    <span className="mt-1 block text-base font-semibold capitalize">{dateLabel}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="min-h-0" fillAvailableHeight>
                  <div className="flex h-full min-h-0 flex-col px-6 pb-6">
                    <DayAgenda
                      blocks={agendaBlocks}
                      date={view.selectedDate}
                      emptyMessage={view.windows.length === 0
                        ? "Este día no tiene horas de atención configuradas."
                        : "No hay reservas confirmadas para este día."}
                      privacyNote="Las reservas existentes se muestran sin datos de sus participantes."
                      fillAvailableHeight
                      timeZone={view.timeZone}
                      windows={view.windows}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>

        <Separator className="md:hidden" />

        <form action={formAction} className="flex min-w-0 flex-col gap-5 md:col-start-3 md:row-start-1 md:min-h-0 md:justify-center">
          <section aria-labelledby="booking-details-heading" className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="booking-details-heading">Tus datos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Completa tu nombre para reservar este horario.</p>
          </div>
          <input name="mode" type="hidden" value={mode} />
          <input name="date" type="hidden" value={view.selectedDate} />

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="public-booking-first-name">Nombre</FieldLabel>
              <Input className="h-11 bg-background" id="public-booking-first-name" maxLength={80} name="firstName" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
            </Field>
            <Field>
              <FieldLabel htmlFor="public-booking-last-name">Apellido</FieldLabel>
              <Input className="h-11 bg-background" id="public-booking-last-name" maxLength={80} name="lastName" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
            </Field>
          </FieldGroup>
          </section>

          <Separator />

          <FieldSet className="gap-3">
            <FieldLegend className="mb-0" id="available-times-heading" variant="label">Elige una hora</FieldLegend>
            <FieldDescription>{dateLabel} · {view.durationMinutes} minutos</FieldDescription>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
              <Field>
                <FieldLabel htmlFor={mode === "precise" ? "public-booking-start-time" : "public-booking-available-time"}>
                  {mode === "precise" ? "Hora exacta de inicio" : "Hora disponible"}
                </FieldLabel>
                {mode === "precise" ? (
                  <Input
                    className="h-11 bg-background"
                    disabled={!view.hasPreciseAvailability || pending || changingDate}
                    id="public-booking-start-time"
                    name="startTime"
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                    step={60}
                    type="time"
                    value={startTime}
                  />
                ) : view.slots.length > 0 ? (
                  <NativeSelect
                    className="w-full"
                    disabled={pending || changingDate}
                    id="public-booking-available-time"
                    name="startTime"
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                    size="lg"
                    value={slotIsCurrent ? startTime : ""}
                  >
                    <NativeSelectOption disabled value="">Elige un horario</NativeSelectOption>
                    {view.slots.map((slot) => (
                      <NativeSelectOption key={slot.startTime} value={slot.startTime}>{slot.startTime} – {slot.endTime}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : (
                  <FieldDescription>
                    {view.hasPreciseAvailability
                      ? "No quedan horarios de 15 minutos. Elige una hora exacta."
                      : "No hay horarios disponibles para esta fecha. Prueba con otro día."}
                  </FieldDescription>
                )}
              </Field>
              <RadioGroup
                aria-label="Precisión del horario"
                className="flex flex-col gap-2"
                disabled={pending || changingDate}
                onValueChange={(value) => {
                  if (value === "standard") {
                    setMode("standard");
                    setStartTime(slotIsCurrent ? startTime : view.slots[0]?.startTime ?? "");
                  } else if (value === "precise") {
                    setMode("precise");
                    setStartTime(slotIsCurrent ? startTime : view.firstPreciseTime ?? "");
                  }
                }}
                value={mode}
              >
                <Field orientation="horizontal" className="items-center gap-2">
                  <RadioGroupItem disabled={view.slots.length === 0} id="public-booking-mode-standard" value="standard" />
                  <FieldLabel className="cursor-pointer" htmlFor="public-booking-mode-standard">Disponible</FieldLabel>
                </Field>
                <Field orientation="horizontal" className="items-center gap-2">
                  <RadioGroupItem disabled={!view.hasPreciseAvailability} id="public-booking-mode-precise" value="precise" />
                  <FieldLabel className="cursor-pointer" htmlFor="public-booking-mode-precise">Hora exacta</FieldLabel>
                </Field>
              </RadioGroup>
            </div>
          </FieldSet>

          {state.error ? <p className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive" id="booking-error" role="alert">{state.error}</p> : null}

          <Button className="mt-1 w-full" disabled={!canSubmit || pending || changingDate} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" data-icon="inline-start" /> : null}
            {pending ? "Confirmando reserva…" : "Reservar reunión"}
          </Button>
          <p aria-live="polite" className="sr-only" role="status">{pending ? "Guardando tu reserva." : ""}</p>
          <p className="text-center text-xs leading-5 text-muted-foreground">No necesitas una cuenta ni compartir tu correo electrónico.</p>
        </form>
        <Separator orientation="vertical" className="hidden md:col-start-2 md:row-start-1 md:block" />
      </div>
    </div>
  );
}

function BookingConfirmation({
  confirmation,
  durationMinutes,
  timeZone,
}: {
  confirmation: Confirmation;
  durationMinutes: number;
  timeZone: string;
}) {
  return (
    <section aria-labelledby="booking-confirmation-title" className="mx-auto max-w-2xl rounded-3xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 sm:py-12">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 aria-hidden="true" className="size-6" />
      </div>
      <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight" id="booking-confirmation-title">Tu reunión está reservada</h1>
      <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">La reserva quedó confirmada para {confirmation.firstName} {confirmation.lastName}.</p>
      <dl className="mt-7 grid gap-4 rounded-2xl bg-muted/50 p-5 sm:grid-cols-2">
        <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</dt><dd className="mt-1 font-medium">{formatDate(confirmation.date)}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hora de Chile</dt><dd className="mt-1 font-medium tabular-nums">{confirmation.startTime}–{confirmation.endTime}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Duración</dt><dd className="mt-1 font-medium">{durationMinutes} minutos</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Zona horaria</dt><dd className="mt-1 font-medium">{timeZone}</dd></div>
      </dl>
      <p className="mt-6 text-center text-sm text-muted-foreground">Si necesitas hacer algún cambio, contacta a la persona que organiza el evento.</p>
    </section>
  );
}

function getMonthDays(month: string): Array<Array<string | null>> {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const dates: Array<string | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push(`${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  while (dates.length % 7 !== 0) dates.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < dates.length; index += 7) weeks.push(dates.slice(index, index + 7));
  return weeks;
}

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${month}-01T12:00:00.000Z`));
}

function canMoveMonth(month: string, boundary: string, forward = false): boolean {
  return forward ? month < boundary.slice(0, 7) : month > boundary.slice(0, 7);
}

function dateAtNoonUtc(date: string): Date {
  return new Date(`${date}T12:00:00.000Z`);
}

function dayOfMonth(date: string): string {
  return String(Number(date.slice(8, 10)));
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "full", timeZone: "UTC" }).format(dateAtNoonUtc(date));
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDate(startDate);
  const format = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${format.format(dateAtNoonUtc(startDate))} – ${format.format(dateAtNoonUtc(endDate))}`;
}

function getTodayInChile(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function stringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function timeToMinute(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

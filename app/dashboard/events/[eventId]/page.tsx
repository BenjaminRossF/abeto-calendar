import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { EventManagement } from "@/components/events/event-management";
import type { EventDetailsProps } from "@/components/events/types";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ date?: string | string[]; month?: string | string[] }>;
};

function EventPageSkeleton() {
  return (
    <div aria-label="Cargando calendario del evento" className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="h-8 w-64 rounded-lg bg-muted motion-safe:animate-pulse" />
        <div aria-hidden="true" className="h-4 w-80 max-w-full rounded-lg bg-muted motion-safe:animate-pulse" />
      </div>
      <div aria-hidden="true" className="h-[31rem] rounded-2xl border border-border bg-card motion-safe:animate-pulse" />
      <div aria-hidden="true" className="h-[38rem] rounded-2xl border border-border bg-card motion-safe:animate-pulse" />
      <div aria-hidden="true" className="h-72 rounded-2xl border border-border bg-card motion-safe:animate-pulse" />
    </div>
  );
}

export default function EventPage({ params, searchParams }: EventPageProps) {
  const eventDetailsPromise = loadEventDetails(params, searchParams);

  return (
    <Suspense fallback={<EventPageSkeleton />}>
      <EventPageContent eventDetailsPromise={eventDetailsPromise} />
    </Suspense>
  );
}

async function EventPageContent({ eventDetailsPromise }: { eventDetailsPromise: Promise<EventDetailsProps> }) {
  const details = await eventDetailsPromise;
  return <EventManagement key={`${details.event.id}:${details.month}:${details.selectedDate}:${details.event.updatedAt}`} {...details} />;
}

async function loadEventDetails(
  params: EventPageProps["params"],
  searchParams: EventPageProps["searchParams"],
): Promise<EventDetailsProps> {
  const [{ eventId }, query, session] = await Promise.all([
    params,
    searchParams,
    getCurrentSession(),
  ]);
  if (!session?.user.id) redirect("/");

  const row = await prisma.event.findFirst({
    where: { id: eventId, ownerId: session.user.id, deletedAt: null },
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      durationMinutes: true,
      startDate: true,
      endDate: true,
      timeZone: true,
      isActive: true,
      updatedAt: true,
      weekdays: { select: { weekday: true, enabled: true } },
      weeklyWindows: { orderBy: { startMinute: "asc" }, select: { startMinute: true, endMinute: true } },
      exceptions: { orderBy: [{ date: "asc" }, { startMinute: "asc" }], select: { id: true, date: true, kind: true, startMinute: true, endMinute: true } },
    },
  });
  if (!row) notFound();

  const startDate = row.startDate.toISOString().slice(0, 10);
  const endDate = row.endDate.toISOString().slice(0, 10);
  const currentNow = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: row.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(currentNow);
  const defaultDate = today < startDate ? startDate : today > endDate ? endDate : today;
  const requestedMonth = firstValue(query.month);
  const minMonth = startDate.slice(0, 7);
  const maxMonth = endDate.slice(0, 7);
  const month = isMonth(requestedMonth) && requestedMonth >= minMonth && requestedMonth <= maxMonth
    ? requestedMonth
    : defaultDate.slice(0, 7);
  const fallbackDate = defaultDate.slice(0, 7) === month
    ? defaultDate
    : startDate.slice(0, 7) === month
      ? startDate
      : `${month}-01`;
  const requestedDate = firstValue(query.date);
  const selectedDate = isDate(requestedDate) && requestedDate >= startDate && requestedDate <= endDate && requestedDate.slice(0, 7) === month
    ? requestedDate
    : fallbackDate;

  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = Date.UTC(year, monthNumber - 1, 1);
  const monthEnd = Date.UTC(year, monthNumber, 1);
  const rangePadding = 36 * 60 * 60 * 1000;
  const bookings = await prisma.booking.findMany({
    where: {
      eventId: row.id,
      status: "CONFIRMED",
      startAt: {
        gte: new Date(monthStart - rangePadding),
        lt: new Date(monthEnd + rangePadding),
      },
    },
    orderBy: { startAt: "asc" },
    select: { id: true, firstName: true, lastName: true, startAt: true, endAt: true, status: true },
  });

  return {
    event: {
      id: row.id,
      title: row.title,
      description: row.description,
      durationMinutes: row.durationMinutes,
      startDate,
      endDate,
      timeZone: row.timeZone,
      isActive: row.isActive,
      shareUrl: `/reservar/${row.token}`,
      updatedAt: row.updatedAt.toISOString(),
    },
    weekdays: Array.from({ length: 7 }, (_, weekday) => row.weekdays.find((day) => day.weekday === weekday)?.enabled === true),
    weeklyWindows: row.weeklyWindows,
    exceptions: row.exceptions.map((exception) => ({
      id: exception.id,
      date: exception.date.toISOString().slice(0, 10),
      kind: exception.kind,
      startMinute: exception.startMinute,
      endMinute: exception.endMinute,
    })),
    bookings: bookings.map((booking) => ({
      id: booking.id,
      firstName: booking.firstName,
      lastName: booking.lastName,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      status: booking.status,
    })),
    month,
    selectedDate,
    today,
    now: currentNow.toISOString(),
  };
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isMonth(value: string | undefined): value is string {
  return value !== undefined && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function isDate(value: string | undefined): value is string {
  return value !== undefined && /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value);
}

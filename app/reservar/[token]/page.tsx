import { Suspense } from "react";
import { createPublicBookingAction } from "@/app/dashboard/actions";
import { PublicBookingFlow, type PublicBookingSection, type PublicBookingView } from "@/components/public-booking/public-booking-flow";
import { PublicBookingSkeleton } from "@/components/public-booking/public-booking-skeleton";
import {
  CALENDAR_TIME_ZONE,
  calculateSlots,
  getLocalDateTime,
  getWeekday,
  isValidDateString,
  minuteToTime,
  resolveWindowsForDate,
  type BookingInterval,
  type TimeWindow,
} from "@/lib/availability";
import { prisma } from "@/lib/prisma";

type PublicBookingParams = Promise<{ token: string }>;
type PublicBookingSearchParams = Promise<{ date?: string | string[]; section?: string | string[] }>;

type PublicBookingPageData =
  | { kind: "unavailable" }
  | {
      kind: "available";
      view: PublicBookingView;
      action: (formData: FormData) => Promise<{ ok: boolean; error?: string; success?: string }>;
    };

export default function PublicBookingPage({
  params,
  searchParams,
}: {
  params: PublicBookingParams;
  searchParams: PublicBookingSearchParams;
}) {
  const pageDataPromise = Promise.all([params, searchParams]).then(
    async ([{ token }, query]) => {
      const pageData = await loadPublicBookingPageData(token, query.date);
      const section = Array.isArray(query.section) ? query.section[0] : query.section;
      return {
        initialSection: section === "timeline" ? "timeline" : "calendar",
        pageData,
      } satisfies PublicBookingPagePayload;
    },
  );

  return (
    <main className="min-h-screen bg-muted px-4 py-5 text-foreground sm:px-6 sm:py-6 md:h-svh md:min-h-0 md:overflow-hidden">
      <div className="mx-auto w-full max-w-6xl md:h-full">
        <Suspense fallback={<PublicBookingSkeleton />}>
          <PublicBookingContent pageDataPromise={pageDataPromise} />
        </Suspense>
      </div>
    </main>
  );
}

async function PublicBookingContent({
  pageDataPromise,
}: {
  pageDataPromise: Promise<PublicBookingPagePayload>;
}) {
  const { initialSection, pageData } = await pageDataPromise;

  if (pageData.kind === "unavailable") {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm sm:px-10">
        <p className="text-sm font-medium text-primary">Reserva de reunión</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Este enlace de reserva no está disponible</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Puede que el evento haya terminado o que su organizador haya pausado las reservas. Si necesitas coordinar una reunión, contacta directamente a quien te compartió el enlace.
        </p>
      </section>
    );
  }

  return <PublicBookingFlow action={pageData.action} initialSection={initialSection} key={pageData.view.selectedDate} view={pageData.view} />;
}

type PublicBookingPagePayload = {
  initialSection: PublicBookingSection;
  pageData: PublicBookingPageData;
};

async function loadPublicBookingPageData(
  token: string,
  queryDate: string | string[] | undefined,
): Promise<PublicBookingPageData> {
  if (token.length < 1 || token.length > 64) return { kind: "unavailable" };

  const event = await prisma.event.findUnique({
    where: { token },
    select: {
      id: true,
      title: true,
      description: true,
      durationMinutes: true,
      startDate: true,
      endDate: true,
      timeZone: true,
      isActive: true,
      deletedAt: true,
      weekdays: { select: { weekday: true, enabled: true } },
      weeklyWindows: { select: { startMinute: true, endMinute: true } },
      exceptions: {
        select: { date: true, kind: true, startMinute: true, endMinute: true },
      },
    },
  });

  if (!event || event.deletedAt || !event.isActive) return { kind: "unavailable" };

  const startDate = event.startDate.toISOString().slice(0, 10);
  const endDate = event.endDate.toISOString().slice(0, 10);
  const timeZone = CALENDAR_TIME_ZONE;
  const today = getLocalDateTime(new Date(), timeZone)?.date ?? startDate;
  const firstFutureDate = today < startDate ? startDate : today;
  const defaultDate = firstFutureDate <= endDate ? firstFutureDate : endDate;
  const requestedDate = Array.isArray(queryDate) ? queryDate[0] : queryDate;
  const selectedDate =
    requestedDate &&
    isValidDateString(requestedDate) &&
    requestedDate >= startDate &&
    requestedDate <= endDate
      ? requestedDate
      : defaultDate;

  const dayStartUtc = Date.parse(`${selectedDate}T00:00:00.000Z`);
  const bookingRows = await prisma.booking.findMany({
    where: {
      eventId: event.id,
      status: "CONFIRMED",
      startAt: {
        gte: new Date(dayStartUtc - 18 * 60 * 60_000),
        lt: new Date(dayStartUtc + 42 * 60 * 60_000),
      },
    },
    select: { startAt: true, endAt: true },
  });

  const bookings: BookingInterval[] = bookingRows.map((booking) => ({
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: "CONFIRMED",
  }));
  const weekday = getWeekday(selectedDate);
  const enabledWeekdays = Array.from({ length: 7 }, (_, index) =>
    event.weekdays.some((day) => day.weekday === index && day.enabled),
  );
  const weeklyWindows: TimeWindow[] = event.weeklyWindows.map((window) => ({
    startMinute: window.startMinute,
    endMinute: window.endMinute,
  }));
  const exceptions = event.exceptions.map((exception) => ({
    date: exception.date.toISOString().slice(0, 10),
    kind: exception.kind,
    startMinute: exception.startMinute,
    endMinute: exception.endMinute,
  }));
  const windows = resolveWindowsForDate({
    date: selectedDate,
    weekdayEnabled:
      weekday !== null && enabledWeekdays[weekday] === true,
    weeklyWindows,
    exceptions,
  });
  const slots = calculateSlots({
    date: selectedDate,
    windows,
    durationMinutes: event.durationMinutes,
    bookings,
    timeZone: event.timeZone || timeZone,
    incrementMinutes: 15,
  });
  const preciseSlots = calculateSlots({
    date: selectedDate,
    windows,
    durationMinutes: event.durationMinutes,
    bookings,
    timeZone: event.timeZone || timeZone,
    incrementMinutes: 1,
  });

  const occupiedBlocks = bookingRows.flatMap((booking) => {
    const localStart = getLocalDateTime(booking.startAt, event.timeZone || timeZone);
    if (localStart?.date !== selectedDate) return [];
    const localEnd = getLocalDateTime(booking.endAt, event.timeZone || timeZone);
    const duration = Math.max(1, Math.round((booking.endAt.getTime() - booking.startAt.getTime()) / 60_000));
    const endMinute = Math.min(24 * 60, localStart.minute + duration);
    return [{
      startMinute: localStart.minute,
      endMinute,
      startTime: minuteToTime(localStart.minute),
      endTime: localEnd?.date === selectedDate ? minuteToTime(localEnd.minute) : "24:00",
    }];
  });

  const view: PublicBookingView = {
    title: event.title,
    description: event.description,
    durationMinutes: event.durationMinutes,
    startDate,
    endDate,
    selectedDate,
    timeZone,
    windows: windows.map((window) => ({
      ...window,
      startTime: minuteToTime(window.startMinute),
      endTime: minuteToTime(window.endMinute),
    })),
    slots: slots.map(({ startMinute, startTime, endTime }) => ({
      startMinute,
      startTime,
      endTime,
    })),
    occupiedBlocks,
    hasPreciseAvailability: preciseSlots.length > 0,
    firstPreciseTime: preciseSlots[0]?.startTime ?? null,
  };

  return {
    kind: "available",
    view,
    action: createPublicBookingAction.bind(null, token),
  };
}

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarPlus, CalendarRange, Clock3, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const chileDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function EventsSkeleton() {
  return (
    <div aria-label="Cargando eventos" className="flex flex-col gap-7">
      <div aria-hidden="true" className="h-8 w-48 rounded-lg bg-muted motion-safe:animate-pulse" />
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="h-56 rounded-2xl border border-border bg-card motion-safe:animate-pulse" key={index} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dashboardPromise = loadDashboardData();
  return (
    <Suspense fallback={<EventsSkeleton />}>
      <OwnedEventList dashboardPromise={dashboardPromise} />
    </Suspense>
  );
}

type DashboardData = {
  today: string;
  events: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    shareUrl: string;
    bookingCount: number;
  }[];
};

async function loadDashboardData(): Promise<DashboardData> {
  const session = await getCurrentSession();
  if (!session?.user.id) redirect("/");

  const today = chileDate.format(new Date());
  const rows = await prisma.event.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      durationMinutes: true,
      startDate: true,
      endDate: true,
      isActive: true,
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });

  const events = rows.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    durationMinutes: event.durationMinutes,
    startDate: event.startDate.toISOString().slice(0, 10),
    endDate: event.endDate.toISOString().slice(0, 10),
    isActive: event.isActive,
    shareUrl: `/reservar/${event.token}`,
    bookingCount: event._count.bookings,
  }));

  return { today, events };
}

async function OwnedEventList({ dashboardPromise }: { dashboardPromise: Promise<DashboardData> }) {
  const { today, events } = await dashboardPromise;

  const current = events.filter((event) => event.endDate >= today && event.startDate <= today);
  const upcoming = events.filter((event) => event.startDate > today);
  const past = events.filter((event) => event.endDate < today);
  const sortedEvents = [...current, ...upcoming, ...past];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mis eventos</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Organiza tus horarios y comparte una página para recibir reservas.
          </p>
        </div>
        <Button className="w-fit" nativeButton={false} render={<Link href="/dashboard/new" prefetch={true} />}>
          <CalendarPlus aria-hidden="true" data-icon="inline-start" />
          Crear evento
        </Button>
      </section>

      {sortedEvents.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-primary">
            <CalendarRange aria-hidden="true" className="size-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Tu agenda empieza con un evento</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Define tus días y horarios disponibles. Después podrás compartir un enlace para que te reserven.
          </p>
          <Button className="mt-6" nativeButton={false} render={<Link href="/dashboard/new" prefetch={true} />}>
            Crear mi primer evento <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Button>
        </section>
      ) : (
        <section aria-label="Lista de eventos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedEvents.map((event) => {
            const isPast = event.endDate < today;
            const dates = `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`;
            return (
              <article className="flex min-h-56 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm" key={event.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight">{event.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{dates}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${event.isActive && !isPast ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground"}`}>
                    {isPast ? "Finalizado" : event.isActive ? "Publicado" : "Pausado"}
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  {event.description || "Sin descripción"}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {event.bookingCount} {event.bookingCount === 1 ? "reserva" : "reservas"} · {event.durationMinutes} min
                  </span>
                  <Link className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/dashboard/events/${event.id}`} prefetch={true}>
                    Gestionar <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

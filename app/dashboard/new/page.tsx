import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { EventCreateForm } from "@/components/events/event-create-form";
import { getCurrentSession } from "@/lib/session";

const chileDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function NewEventSkeleton() {
  return (
    <div aria-label="Cargando formulario de evento" className="flex flex-col gap-6">
      <div aria-hidden="true" className="h-8 w-56 rounded-lg bg-muted motion-safe:animate-pulse" />
      {[0, 1, 2, 3].map((item) => <div aria-hidden="true" className="h-40 rounded-2xl border border-border bg-card motion-safe:animate-pulse" key={item} />)}
    </div>
  );
}

export default function NewEventPage() {
  const sessionPromise = getCurrentSession();

  return (
    <Suspense fallback={<NewEventSkeleton />}>
      <NewEventContent sessionPromise={sessionPromise} />
    </Suspense>
  );
}

async function NewEventContent({
  sessionPromise,
}: {
  sessionPromise: ReturnType<typeof getCurrentSession>;
}) {
  await io();
  const today = chileDate.format(new Date());
  const session = await sessionPromise;
  if (!session?.user.id) redirect("/");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <div>
        <Link className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/dashboard">
          <ArrowLeft aria-hidden="true" className="size-4" /> Mis eventos
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <CalendarPlus aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Crear un evento</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Define el período, los días y las horas en que quieres recibir reservas.
            </p>
          </div>
        </div>
      </div>
      <EventCreateForm today={today} />
    </div>
  );
}

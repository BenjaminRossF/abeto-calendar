import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowDownRight, CalendarDays, Check, Clock3, Sprout } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentSession } from "@/lib/session";

function AuthPanelSkeleton() {
  return (
    <div aria-label="Cargando acceso" className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
      <div aria-hidden="true" className="mb-8 h-7 w-36 rounded-md bg-muted motion-safe:animate-pulse" />
      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className="h-11 rounded-lg bg-muted motion-safe:animate-pulse" />
        <div className="h-11 rounded-lg bg-muted motion-safe:animate-pulse" />
        <div className="h-10 rounded-lg bg-muted motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

async function SignedOutAuthPanel({ sessionPromise }: { sessionPromise: ReturnType<typeof getCurrentSession> }) {
  const session = await sessionPromise;
  if (session?.user) redirect("/dashboard");
  return <AuthForm />;
}

export default function Home() {
  const sessionPromise = getCurrentSession();
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-12">
      <section aria-labelledby="welcome-title" className="flex flex-col gap-10">
        <BrandMark />
        <div className="max-w-xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sprout aria-hidden="true" className="size-4 text-primary" />
            Agenda simple, tiempo para lo importante
          </p>
          <h1 id="welcome-title" className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Tu tiempo, <span className="text-primary">bien cuidado.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Comparte un enlace, recibe reservas y deja que Abeto ordene tu agenda por ti.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
              <CalendarDays aria-hidden="true" className="size-5" />
            </div>
            <p className="text-sm font-medium">Disponibilidad clara</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Define cuándo puedes recibir a alguien.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
              <Clock3 aria-hidden="true" className="size-5" />
            </div>
            <p className="text-sm font-medium">Sin cruces</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Cada reserva ocupa su lugar al instante.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-muted text-primary">
              <Check aria-hidden="true" className="size-5" />
            </div>
            <p className="text-sm font-medium">Tú tienes el control</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Reprograma o cancela cuando haga falta.</p>
          </div>
        </div>

        <p className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
          Hecho para coordinar con calma <ArrowDownRight aria-hidden="true" className="size-4" />
        </p>
      </section>

      <section aria-label="Acceso a Abeto Calendar" className="mx-auto w-full max-w-md">
        <Suspense fallback={<AuthPanelSkeleton />}>
          <SignedOutAuthPanel sessionPromise={sessionPromise} />
        </Suspense>
        <p className="mt-5 px-4 text-center text-xs leading-5 text-muted-foreground">
          Al crear una cuenta podrás publicar enlaces para que otras personas reserven contigo.
        </p>
      </section>
    </main>
  );
}

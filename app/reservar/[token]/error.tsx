"use client";

import { Button } from "@/components/ui/button";

export default function PublicBookingError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="min-h-[60vh] px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-xl rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
        <h1 className="text-2xl font-semibold tracking-tight">No pudimos cargar la disponibilidad</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Inténtalo de nuevo en unos momentos. Si el problema continúa, contacta a la persona que te compartió el enlace.
        </p>
        <Button className="mt-6" onClick={() => retry()}>Volver a intentar</Button>
      </section>
    </main>
  );
}

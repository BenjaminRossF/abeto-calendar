import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PublicBookingSkeleton() {
  return (
    <section aria-busy="true" aria-label="Cargando horarios de reserva" className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:h-full md:min-h-0">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-8 w-3/4 max-w-md rounded bg-muted" />
        <div className="h-4 w-full max-w-xl rounded bg-muted" />
      </div>
      <div className="grid gap-8 md:min-h-0 md:flex-1 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:gap-0">
        <div className="flex flex-col gap-6 md:min-h-0 md:pr-8">
        <Card className="shrink-0 gap-0 overflow-hidden p-0">
          <CardHeader className="py-5">
            <div className="h-7 w-40 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, index) => (
                <div className="aspect-square rounded-lg bg-muted" key={index} />
              ))}
            </div>
          </CardContent>
        <div aria-hidden="true" className="flex h-12 items-center justify-between border-t border-border px-6">
          <div className="h-5 w-52 rounded bg-muted" />
          <div className="size-4 rounded bg-muted" />
        </div>
        </Card>
        </div>
        <div className="flex flex-col gap-5 border-t border-border pt-6 md:justify-center md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div className="h-6 w-44 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-11 rounded-lg bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:gap-4">
            <div className="h-11 rounded-lg bg-muted" />
            <div className="flex flex-col justify-center gap-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 h-11 rounded-lg bg-muted" />
        </div>
      </div>
      <p className="sr-only" role="status">Cargando la disponibilidad del evento.</p>
    </section>
  );
}

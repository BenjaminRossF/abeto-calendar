export default function DashboardLoading() {
  return (
    <div aria-label="Cargando eventos" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="h-8 w-44 rounded-lg bg-muted motion-safe:animate-pulse" />
        <div aria-hidden="true" className="h-4 w-72 max-w-full rounded-lg bg-muted motion-safe:animate-pulse" />
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="flex min-h-52 flex-col gap-4 rounded-2xl border border-border bg-card p-5" key={index}>
            <div className="h-5 w-3/5 rounded bg-muted motion-safe:animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
            <div className="mt-auto h-9 w-32 rounded-lg bg-muted motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventLoading() {
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

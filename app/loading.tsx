export default function Loading() {
  return (
    <main aria-label="Cargando Abeto Calendar" className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-12">
      <section aria-hidden="true" className="hidden flex-col gap-8 lg:flex">
        <div className="h-10 w-36 rounded-xl bg-muted motion-safe:animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="h-12 w-4/5 rounded-lg bg-muted motion-safe:animate-pulse" />
          <div className="h-5 w-3/5 rounded-lg bg-muted motion-safe:animate-pulse" />
        </div>
      </section>
      <div aria-hidden="true" className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-sm">
        <div className="mb-8 h-7 w-40 rounded-md bg-muted motion-safe:animate-pulse" />
        <div className="flex flex-col gap-5">
          <div className="h-10 rounded-lg bg-muted motion-safe:animate-pulse" />
          <div className="h-11 rounded-lg bg-muted motion-safe:animate-pulse" />
          <div className="h-11 rounded-lg bg-muted motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  );
}

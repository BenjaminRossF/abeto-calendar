import Link from "next/link";
import { Sprout } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="Abeto Calendar, inicio"
      className="inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href="/"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Sprout aria-hidden="true" className="size-5" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Abeto</span>
          <span className="text-xs text-muted-foreground">Calendar</span>
        </span>
      ) : null}
    </Link>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { AGENDA_PIXELS_PER_HOUR, getAgendaStartMinute, layoutAgendaBlocks, MINUTES_PER_DAY } from "@/lib/day-agenda";
import type { AgendaBlock, AgendaWindow } from "@/lib/day-agenda";

export function DayAgenda({
  date,
  timeZone,
  blocks,
  windows = [],
  fillAvailableHeight = false,
  onSelectBlock,
  emptyMessage,
  privacyNote,
}: {
  date: string;
  timeZone: string;
  blocks: readonly AgendaBlock[];
  windows?: readonly AgendaWindow[];
  fillAvailableHeight?: boolean;
  onSelectBlock?: (block: AgendaBlock, trigger: HTMLButtonElement) => void;
  emptyMessage?: string;
  privacyNote?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startMinute = getAgendaStartMinute(blocks, windows);
  const layouts = useMemo(() => layoutAgendaBlocks(blocks), [blocks]);
  const dayLabel = useMemo(() => new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`)), [date]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (startMinute / 60) * AGENDA_PIXELS_PER_HOUR;
    }
  }, [date, startMinute]);

  return (
    <section aria-labelledby="day-agenda-title" className={fillAvailableHeight ? "flex min-h-0 flex-col gap-4 md:flex-1" : "flex flex-col gap-4"}>
      {blocks.length === 0 && emptyMessage ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : null}
      <div ref={scrollRef} aria-label={`Agenda de ${dayLabel}`} className={fillAvailableHeight ? "max-h-[35rem] min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-h-none" : "max-h-[35rem] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"} role="region" tabIndex={0}>
        <div className="relative w-full min-w-0" style={{ height: `${(MINUTES_PER_DAY / 60) * AGENDA_PIXELS_PER_HOUR}px` }}>
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-14 border-r border-border bg-muted/30">
            {Array.from({ length: 24 }, (_, hour) => (
              <span className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground" key={hour} style={{ top: `${Math.max(10, hour * AGENDA_PIXELS_PER_HOUR)}px` }}>
                {`${String(hour).padStart(2, "0")}:00`}
              </span>
            ))}
            <span className="absolute bottom-0 right-2 translate-y-1/2 text-[11px] tabular-nums text-muted-foreground">24:00</span>
          </div>
          <div aria-hidden="true" className="absolute inset-y-0 left-14 right-0 bg-muted/20">
            {Array.from({ length: 25 }, (_, hour) => (
              <div className="absolute inset-x-0 border-t border-border" key={hour} style={{ top: `${hour * AGENDA_PIXELS_PER_HOUR}px` }} />
            ))}
            {windows.map((window, index) => {
              const start = Math.max(0, Math.min(MINUTES_PER_DAY, window.startMinute));
              const end = Math.max(0, Math.min(MINUTES_PER_DAY, window.endMinute));
              if (end <= start) return null;
              return <div className="absolute inset-x-0 bg-primary/5" key={`${window.startMinute}-${index}`} style={{ top: `${(start / 60) * AGENDA_PIXELS_PER_HOUR}px`, height: `${((end - start) / 60) * AGENDA_PIXELS_PER_HOUR}px` }} />;
            })}
          </div>
          <div className="absolute inset-y-0 left-14 right-2">
            {layouts.map(({ block, top, height, lane, lanes }) => {
              const style = {
                top: `${top}px`, height: `${height}px`,
                left: `calc(${(lane / lanes) * 100}% + 4px)`,
                width: `calc(${100 / lanes}% - 8px)`,
              };
              const accessibleLabel = `${block.title}, ${block.startTime} a ${block.endTime}`;
              const content = (
                <>
                  <span className="block truncate text-xs font-semibold sm:text-sm">{block.title}</span>
                  <span className="block truncate text-[11px] tabular-nums sm:text-xs">{block.startTime}–{block.endTime}</span>
                </>
              );
              return onSelectBlock ? (
                <button aria-label={accessibleLabel} className="absolute overflow-hidden rounded-md border border-primary/30 bg-primary px-2 py-1 text-left text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" key={block.id} onClick={(event) => onSelectBlock(block, event.currentTarget)} style={style} type="button">
                  {content}
                </button>
              ) : (
                <div aria-label={accessibleLabel} className="absolute overflow-hidden rounded-md border border-border bg-muted px-2 py-1 text-foreground" key={block.id} style={style} title={accessibleLabel}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {windows.length > 0 ? <>
          <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-sm bg-primary/15" />Horario de atención</span>
          <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-sm bg-muted" />Fuera de atención</span>
        </> : null}
        {onSelectBlock ? <span><span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-sm bg-primary" />Reserva confirmada</span> : null}
      </div>
      {privacyNote ? <p className="text-xs text-muted-foreground">{privacyNote}</p> : null}
    </section>
  );
}

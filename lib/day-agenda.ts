export const MINUTES_PER_DAY = 24 * 60;
export const AGENDA_PIXELS_PER_HOUR = 64;

export type AgendaBlock = Readonly<{
  id: string;
  title: string;
  startMinute: number;
  endMinute: number;
  startTime: string;
  endTime: string;
}>;

export type AgendaWindow = Readonly<{ startMinute: number; endMinute: number }>;

export type AgendaBlockLayout<T extends AgendaBlock = AgendaBlock> = Readonly<{
  block: T;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}>;

export function getAgendaStartMinute(
  blocks: readonly AgendaBlock[],
  windows: readonly AgendaWindow[] = [],
): number {
  const firstBlock = Math.min(...blocks.map((block) => block.startMinute));
  const firstWindow = Math.min(...windows.map((window) => window.startMinute));
  const firstRelevant = Math.min(firstBlock, firstWindow);
  if (!Number.isFinite(firstRelevant)) return 8 * 60;
  return Math.max(0, Math.floor(firstRelevant / 60) * 60 - 60);
}

export function layoutAgendaBlocks<T extends AgendaBlock>(
  blocks: readonly T[],
): AgendaBlockLayout<T>[] {
  const sorted = blocks
    .map((block, index) => ({
      block,
      index,
      start: Math.max(0, Math.min(MINUTES_PER_DAY, block.startMinute)),
      end: Math.max(0, Math.min(MINUTES_PER_DAY, block.endMinute)),
    }))
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);

  const layouts: Array<AgendaBlockLayout<T> | undefined> = Array(blocks.length);
  let cluster: typeof sorted = [];
  let clusterEnd = -1;

  function layoutCluster() {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const assigned: Array<{ item: (typeof cluster)[number]; lane: number }> = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      assigned.push({ item, lane });
    }
    const lanes = laneEnds.length;
    for (const { item, lane } of assigned) {
      layouts[item.index] = {
        block: item.block,
        top: (item.start / 60) * AGENDA_PIXELS_PER_HOUR,
        height: ((item.end - item.start) / 60) * AGENDA_PIXELS_PER_HOUR,
        lane,
        lanes,
      };
    }
    cluster = [];
    clusterEnd = -1;
  }

  for (const item of sorted) {
    if (cluster.length > 0 && item.start >= clusterEnd) layoutCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  layoutCluster();

  return layouts.filter((layout): layout is AgendaBlockLayout<T> => layout !== undefined);
}

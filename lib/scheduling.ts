import { Task, ScheduleEntry } from './types';

export interface AutoSchedulePlacement {
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Greedy bin-packing: sorts unscheduled tasks by priority (must-win, then
 * P1/P2/P3), then places each into the first available gap in the day's
 * timeline that's large enough, respecting existing schedule entries.
 * Never overlaps a fixed calendar/schedule block.
 */
export function computeAutoSchedule(
  unscheduledTasks: Task[],
  existingEntries: ScheduleEntry[],
  date: string,
  windowStart = '08:00',
  windowEnd = '22:00'
): { placements: AutoSchedulePlacement[]; unplaced: Task[] } {
  const dayEntries = existingEntries
    .filter((e) => e.date === date && e.status !== 'CANCELLED')
    .sort((a, b) => timeToMinutes(a.plannedStartTime) - timeToMinutes(b.plannedStartTime));

  // Build the initial list of free gaps within the working window
  let gaps: { start: number; end: number }[] = [];
  let cursor = timeToMinutes(windowStart);
  const windowEndMin = timeToMinutes(windowEnd);

  for (const e of dayEntries) {
    const s = timeToMinutes(e.plannedStartTime);
    const en = timeToMinutes(e.plannedEndTime);
    if (s > cursor) gaps.push({ start: cursor, end: Math.min(s, windowEndMin) });
    cursor = Math.max(cursor, en);
  }
  if (cursor < windowEndMin) gaps.push({ start: cursor, end: windowEndMin });
  gaps = gaps.filter((g) => g.end - g.start >= 15);

  const sorted = [...unscheduledTasks].sort((a, b) => {
    if (a.isMustWin !== b.isMustWin) return a.isMustWin ? -1 : 1;
    const order: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
    return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
  });

  const placements: AutoSchedulePlacement[] = [];
  const unplaced: Task[] = [];

  for (const task of sorted) {
    const duration = task.estimatedMinutes || 45;
    const gapIndex = gaps.findIndex((g) => g.end - g.start >= duration);

    if (gapIndex === -1) {
      unplaced.push(task);
      continue;
    }

    const gap = gaps[gapIndex];
    const startMin = gap.start;
    const endMin = startMin + duration;

    placements.push({
      taskId: task.id,
      date,
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
    });

    if (endMin >= gap.end) {
      gaps.splice(gapIndex, 1);
    } else {
      gaps[gapIndex] = { start: endMin, end: gap.end };
    }
  }

  return { placements, unplaced };
}

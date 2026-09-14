import { Task, ScheduleEntry } from './types';

/** Format a JS Date as a local 'YYYY-MM-DD' string (no UTC shifting). */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a 'YYYY-MM-DD' string into a local Date at midnight. */
export function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Sunday-start week containing dateStr, returned as 7 'YYYY-MM-DD' strings. */
export function getWeekDates(dateStr: string): string[] {
  const d = parseDateStr(dateStr);
  const dow = d.getDay(); // 0 = Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => addDays(toDateStr(start), i));
}

/**
 * Calendar grid (weeks x 7 days) for the month containing dateStr, padded
 * with leading/trailing days from adjacent months so every week is complete.
 * Each cell carries its date string and whether it belongs to the target month.
 */
export function getMonthGrid(dateStr: string): { date: string; inMonth: boolean }[][] {
  const d = parseDateStr(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startDow);

  const weeks: { date: string; inMonth: boolean }[][] = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: { date: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: toDateStr(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // Stop once we've completed the month and filled a full last week.
    if (cursor.getMonth() !== month && w >= 3) break;
  }
  return weeks;
}

/** All 'YYYY-MM-DD' day strings for a given month (0-indexed) of a year. */
export function getMonthDates(year: number, month: number): string[] {
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => toDateStr(new Date(year, month, i + 1)));
}

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

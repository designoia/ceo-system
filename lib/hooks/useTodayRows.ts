'use client';

import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { topLevel } from '@/lib/work';
import { useToday } from './useToday';

const ORDER: Record<string, number> = { OVERDUE: 0, TODAY: 1, BLOCKED: 2, DONE: 3 };

/** Everything that belongs on "today": late tasks, today's, pending ones, and what was finished today. */
export function useTodayRows() {
  const { tasks, settings } = useStore();
  const today = useToday();
  const tz = settings.timezone || 'Asia/Kolkata';

  const doneToday = (t: Task) => !!t.completedAt && new Date(t.completedAt).toLocaleDateString('en-CA', { timeZone: tz }) === today;

  const rows = topLevel(tasks)
    .filter(
      (t) =>
        t.status === 'TODAY' ||
        t.status === 'OVERDUE' ||
        (t.status === 'BLOCKED' && (t.scheduledDate ?? today) <= today) ||
        (t.status === 'DONE' && doneToday(t))
    )
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));

  const done = rows.filter((t) => t.status === 'DONE').length;
  const pending = rows.filter((t) => t.status === 'BLOCKED').length;
  return { rows, today, done, pending, todo: rows.length - done - pending };
}

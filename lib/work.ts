import { Task, TaskStatus, Quadrant } from './types';

export const CAL_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];
export const NO_CAL_COLOR = '#94a3b8';

export const QUADRANTS: { id: Quadrant; label: string; hint: string; color: string }[] = [
  { id: 'DO', label: 'Do', hint: 'Urgent & important — do it now', color: '#10b981' },
  { id: 'DECIDE', label: 'Decide', hint: 'Important, not urgent — schedule it', color: '#6366f1' },
  { id: 'DELEGATE', label: 'Delegate', hint: 'Urgent, not important — hand it off', color: '#f59e0b' },
  { id: 'DELETE', label: 'Delete', hint: 'Neither — drop it', color: '#ef4444' },
];

export type BoardColumnId = 'LATER' | 'UPCOMING' | 'TODAY' | 'BLOCKED' | 'DONE';

export const BOARD_COLUMNS: { id: BoardColumnId; label: string; color: string; statuses: TaskStatus[] }[] = [
  { id: 'LATER', label: 'Later', color: '#94a3b8', statuses: ['INBOX', 'BACKLOG'] },
  { id: 'UPCOMING', label: 'Upcoming', color: '#6366f1', statuses: ['NEXT', 'THIS_WEEK'] },
  { id: 'TODAY', label: 'Today', color: '#f59e0b', statuses: ['TODAY', 'OVERDUE'] },
  { id: 'BLOCKED', label: 'Blocked', color: '#ef4444', statuses: ['BLOCKED'] },
  { id: 'DONE', label: 'Done', color: '#10b981', statuses: ['DONE'] },
];

/** Status a task should have when planned for `date` (undefined = no date yet). */
export function statusForDate(date: string | undefined, today: string): TaskStatus {
  if (!date) return 'INBOX';
  if (date === today) return 'TODAY';
  if (date < today) return 'OVERDUE';
  const ahead = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
  return ahead <= 7 ? 'THIS_WEEK' : 'NEXT';
}

/** The day a task shows on in the calendar. */
export const taskDay = (t: Task) => t.scheduledDate || t.dueDate || undefined;

export const topLevel = (tasks: Task[]) => tasks.filter((t) => !t.isDeleted && !t.parentTaskId);

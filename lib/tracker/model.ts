import { addDays, addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';

export type Status = 'backlog' | 'todo' | 'progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Quadrant = 'do' | 'decide' | 'delegate' | 'delete';
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TTask {
  id: string;
  title: string;
  notes?: string;
  status: Status;
  priority: Priority;
  quadrant: Quadrant;
  assignee?: string; // Person id
  project?: string;
  start?: string; // 'YYYY-MM-DD'
  due?: string; // 'YYYY-MM-DD'
  progress: number; // 0-100
  repeat: Repeat;
  createdAt: string;
  completedAt?: string;
}

export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  minutes: number;
  at: string; // ISO timestamp
}

export const STATUSES: { id: Status; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: '#94a3b8' },
  { id: 'todo', label: 'To-do', color: '#f59e0b' },
  { id: 'progress', label: 'In progress', color: '#6366f1' },
  { id: 'review', label: 'Review', color: '#ec4899' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: '#38bdf8' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export const QUADRANTS: { id: Quadrant; label: string; hint: string; color: string }[] = [
  { id: 'do', label: 'Do', hint: 'Urgent & important', color: '#10b981' },
  { id: 'decide', label: 'Decide', hint: 'Important, not urgent', color: '#6366f1' },
  { id: 'delegate', label: 'Delegate', hint: 'Urgent, not important', color: '#f59e0b' },
  { id: 'delete', label: 'Delete', hint: 'Neither', color: '#ef4444' },
];

export const REPEATS: { id: Repeat; label: string }[] = [
  { id: 'none', label: 'No repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const PERSON_COLORS = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f97316'];

export const statusMeta = (id: Status) => STATUSES.find((s) => s.id === id) ?? STATUSES[0];
export const priorityMeta = (id: Priority) => PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];
export const quadrantMeta = (id: Quadrant) => QUADRANTS.find((q) => q.id === id) ?? QUADRANTS[0];

export const tint = (color: string, pct = 16) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayYmd = () => ymd(new Date());
export const toDate = (s: string) => parseISO(s);
export const shiftDay = (s: string, n: number) => ymd(addDays(parseISO(s), n));
export const dayDiff = (a: string, b: string) => differenceInCalendarDays(parseISO(a), parseISO(b));

export const prettyDate = (s?: string) => (s ? format(parseISO(s), 'MMM d') : '');

export function relativeDue(due: string, today: string): string {
  const d = dayDiff(due, today);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d < 0) return `${-d}d late`;
  if (d < 7) return format(parseISO(due), 'EEE');
  return prettyDate(due);
}

export const isOverdue = (t: TTask, today: string) => t.status !== 'done' && !!t.due && t.due < today;

export function nextOccurrence(date: string, repeat: Repeat): string {
  const d = parseISO(date);
  if (repeat === 'daily') return ymd(addDays(d, 1));
  if (repeat === 'weekly') return ymd(addDays(d, 7));
  if (repeat === 'monthly') return ymd(addMonths(d, 1));
  return date;
}

export function nextStatus(s: Status): Status {
  const i = STATUSES.findIndex((x) => x.id === s);
  return STATUSES[Math.min(i + 1, STATUSES.length - 1)].id;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Sample workspace so every view has something to show on first open. Dates are relative to today. */
export function buildSeed(today: string): { tasks: TTask[]; people: Person[] } {
  const people: Person[] = [
    { id: 'p-mia', name: 'Mia', color: PERSON_COLORS[0] },
    { id: 'p-noah', name: 'Noah', color: PERSON_COLORS[1] },
    { id: 'p-ava', name: 'Ava', color: PERSON_COLORS[2] },
    { id: 'p-leo', name: 'Leo', color: PERSON_COLORS[3] },
  ];
  const createdAt = new Date().toISOString();
  const mk = (
    title: string,
    status: Status,
    priority: Priority,
    quadrant: Quadrant,
    assignee: string,
    project: string,
    startOff: number,
    dueOff: number,
    progress: number,
    repeat: Repeat = 'none'
  ): TTask => ({
    id: uid(),
    title,
    status,
    priority,
    quadrant,
    assignee,
    project,
    start: shiftDay(today, startOff),
    due: shiftDay(today, dueOff),
    progress: status === 'done' ? 100 : progress,
    repeat,
    createdAt,
    completedAt: status === 'done' ? new Date(Date.now() - Math.abs(dueOff) * 3600_000).toISOString() : undefined,
  });

  const W = 'Website Refresh';
  const L = 'Launch Prep';
  const H = 'Home & Life';
  const tasks: TTask[] = [
    mk('Draft homepage copy', 'done', 'urgent', 'do', 'p-mia', W, -14, -9, 100),
    mk('Fix checkout bug', 'done', 'high', 'do', 'p-noah', W, -10, -6, 100),
    mk('Schedule photo shoot', 'done', 'medium', 'delegate', 'p-ava', W, -9, -5, 100),
    mk('Book vendor tasting', 'review', 'medium', 'delegate', 'p-ava', L, -6, -1, 85),
    mk('Test payment gateway', 'progress', 'urgent', 'do', 'p-leo', W, -3, 0, 60),
    mk('Client kickoff call', 'progress', 'high', 'do', 'p-noah', L, -2, 1, 40),
    mk('Write blog post', 'progress', 'medium', 'decide', 'p-leo', W, -1, 3, 25),
    mk('Update pricing page', 'todo', 'high', 'decide', 'p-mia', W, 0, 4, 0),
    mk('Onboard new client', 'todo', 'high', 'do', 'p-mia', L, 1, 5, 0),
    mk('Record demo video', 'todo', 'medium', 'decide', 'p-noah', L, 2, 7, 0),
    mk('Design newsletter', 'todo', 'low', 'delegate', 'p-ava', L, 3, 9, 0),
    mk('Reconcile expenses', 'backlog', 'medium', 'delegate', 'p-leo', L, 5, 10, 0),
    mk('Plan team offsite', 'backlog', 'low', 'decide', 'p-ava', L, 8, 16, 0),
    mk('Refresh product photos', 'backlog', 'low', 'delete', 'p-mia', W, 6, 14, 0),
    mk('Clean office', 'todo', 'low', 'delegate', 'p-leo', H, 0, 0, 0, 'weekly'),
    mk('Water the plants', 'todo', 'low', 'delegate', 'p-mia', H, 0, 0, 0, 'daily'),
    mk('Weekly team standup', 'todo', 'medium', 'do', 'p-noah', H, 0, 2, 0, 'weekly'),
    mk('Back up files', 'backlog', 'medium', 'decide', 'p-leo', H, 1, 4, 0, 'weekly'),
  ];
  return { tasks, people };
}

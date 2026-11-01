'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { cn, calculateDaysOverdue } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { NO_CAL_COLOR, topLevel } from '@/lib/work';
import { StatusSelect } from './StatusSelect';
import { useToday } from './TaskParts';

const ORDER: Record<string, number> = { OVERDUE: 0, TODAY: 1, BLOCKED: 2, DONE: 3 };

/** Home's "Today": Task · Calendar · Status. No durations, no workload bar. */
export function TodayTable({ onOpenTask }: { onOpenTask: (t: Task) => void }) {
  const { tasks, businesses, settings } = useStore();
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
  const todo = rows.length - done - pending;

  return (
    <section className="surface-1 rounded-xl border border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-bold">Today</h2>
          <span className="text-xs text-muted-foreground">
            {format(parseISO(today), 'EEEE d MMMM')} · {rows.length} task{rows.length === 1 ? '' : 's'}
          </span>
        </div>
        {rows.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done} done · {pending} pending · {todo} to do
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing planned for today. Use Quick Add to add a task.</p>
      ) : (
        <div>
          <div className="hidden grid-cols-[minmax(0,1fr)_170px_190px] gap-4 border-b border-border/60 px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground md:grid">
            <span>Task</span>
            <span>Calendar</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-border/60">
            {rows.map((t) => {
              const biz = businesses.find((b) => b.code === t.businessCode);
              const late = t.status === 'OVERDUE' ? calculateDaysOverdue(t.scheduledDate ?? t.dueDate, today) : 0;
              return (
                <li key={t.id} className="flex flex-col gap-2.5 px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_170px_190px] md:items-center md:gap-4">
                  <button onClick={() => onOpenTask(t)} className="min-w-0 text-left">
                    <span className={cn('block text-[15px] font-medium leading-snug', t.status === 'DONE' && 'text-muted-foreground line-through')}>{t.title}</span>
                    {late > 0 && <span className="text-xs font-semibold text-red-400">{late === 1 ? '1 day late' : `${late} days late`}</span>}
                  </button>
                  <div className="flex items-center justify-between gap-3 md:contents">
                    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: biz?.color ?? NO_CAL_COLOR }} />
                      {biz?.name ?? 'No calendar'}
                    </span>
                    <StatusSelect task={t} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTracker } from '@/lib/tracker/store';
import { STATUSES, TTask, dayDiff, greeting, isOverdue, prettyDate, toDate, ymd } from '@/lib/tracker/model';
import { Card, Donut, EmptyState, SectionTitle, TaskCard } from './ui';

function Stat({ label, value, color, hint }: { label: string; value: number | string; color: string; hint?: string }) {
  return (
    <Card className="p-3.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] tk-muted">{label}</div>
      <div className="mt-1 text-3xl font-extrabold leading-none" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mt-1.5 text-[11px] tk-muted">{hint}</div>}
    </Card>
  );
}

function MiniCalendar({ tasks, selected, onSelect, today }: { tasks: TTask[]; selected: string; onSelect: (d: string) => void; today: string }) {
  const [cursor, setCursor] = useState(() => startOfMonth(toDate(selected)));
  const days = eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) });
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tasks) if (t.due && t.status !== 'done') m.set(t.due, (m.get(t.due) ?? 0) + 1);
    return m;
  }, [tasks]);

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <button aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full tk-soft" onClick={() => setCursor(addMonths(cursor, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-bold">{format(cursor, 'MMMM yyyy')}</div>
        <button aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full tk-soft" onClick={() => setCursor(addMonths(cursor, 1))}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tk-muted">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const key = ymd(d);
          const isSel = key === selected;
          const isToday = key === today;
          const n = counts.get(key) ?? 0;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="relative flex h-11 flex-col items-center justify-center rounded-xl text-[13px] font-semibold"
              style={{
                opacity: isSameMonth(d, cursor) ? 1 : 0.35,
                background: isSel ? 'hsl(var(--tk-accent))' : isToday ? 'color-mix(in srgb, hsl(var(--tk-accent)) 16%, transparent)' : undefined,
                color: isSel ? '#fff' : undefined,
              }}
            >
              {format(d, 'd')}
              {n > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                    <span key={i} className="h-1 w-1 rounded-full" style={{ background: isSel ? '#fff' : '#f59e0b' }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="min-w-0 flex-1 space-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i.color }} />
          <span className="flex-1 truncate">{i.label}</span>
          <span className="font-bold tabular-nums">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { tasks, people, sessions, today, personById } = useTracker();
  const [selected, setSelected] = useState(today);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => isOverdue(t, today)).length;
    const dueToday = tasks.filter((t) => t.status !== 'done' && t.due === today).length;
    const focusToday = sessions.filter((s) => s.at.slice(0, 10) === today || ymd(new Date(s.at)) === today).reduce((a, s) => a + s.minutes, 0);
    return { done, overdue, dueToday, focusToday, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  }, [tasks, sessions, today]);

  const dayTasks = tasks.filter((t) => t.due === selected).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  const overdueTasks = tasks.filter((t) => isOverdue(t, today)).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''));
  const upcoming = tasks
    .filter((t) => t.status !== 'done' && t.due && t.due > today)
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
    .slice(0, 6);

  const byStatus = STATUSES.map((s) => ({ label: s.label, color: s.color, value: tasks.filter((t) => t.status === s.id).length }));
  const byPerson = [
    ...people.map((p) => ({ label: p.name, color: p.color, value: tasks.filter((t) => t.assignee === p.id).length })),
    { label: 'Unassigned', color: '#94a3b8', value: tasks.filter((t) => !t.assignee || !personById(t.assignee)).length },
  ].filter((x) => x.value > 0);

  const selectedLabel = selected === today ? "Today's tasks" : `Tasks · ${prettyDate(selected)}`;
  const monthCount = tasks.length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tk-muted">{format(new Date(), 'EEEE, d MMMM')}</div>
          <h2 className="text-2xl font-extrabold tracking-tight">{greeting()} 👋</h2>
        </div>
      </div>

      {/* Overall progress */}
      <Card className="flex items-center gap-4" style={{ background: 'color-mix(in srgb, #f59e0b 14%, hsl(var(--tk-card)))' }}>
        <Donut size={96} stroke={13} segments={[{ value: stats.done, color: '#10b981' }, { value: Math.max(monthCount - stats.done, 0), color: 'transparent' }]} center={`${stats.pct}%`} />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] tk-muted">Overall completed</div>
          <div className="mt-1 text-lg font-extrabold">
            {stats.done} of {monthCount} done
          </div>
          <div className="mt-0.5 text-xs tk-muted">
            {stats.overdue > 0 ? `${stats.overdue} overdue — tackle those first` : 'Nothing overdue. Nice.'}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Due today" value={stats.dueToday} color="#6366f1" />
        <Stat label="Overdue" value={stats.overdue} color={stats.overdue ? '#ef4444' : '#10b981'} />
        <Stat label="Completed" value={stats.done} color="#10b981" />
        <Stat label="Focus today" value={`${stats.focusToday}m`} color="#ec4899" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <MiniCalendar tasks={tasks} selected={selected} onSelect={setSelected} today={today} />

          <div>
            <SectionTitle>{selectedLabel}</SectionTitle>
            <div className="space-y-2">
              {dayTasks.length === 0 ? <EmptyState>Nothing due {selected === today ? 'today' : 'that day'}.</EmptyState> : dayTasks.map((t) => <TaskCard key={t.id} task={t} showStatus />)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <div>
              <SectionTitle>
                <span style={{ color: '#ef4444' }}>Overdue</span>
              </SectionTitle>
              <div className="space-y-2">
                {overdueTasks.slice(0, 4).map((t) => (
                  <TaskCard key={t.id} task={t} showStatus />
                ))}
                {overdueTasks.length > 4 && (
                  <button onClick={() => onNavigate('tasks')} className="h-11 w-full text-xs font-semibold tk-accent-text">
                    See all {overdueTasks.length} overdue →
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Upcoming</SectionTitle>
            <div className="space-y-2">
              {upcoming.length === 0 ? <EmptyState>No upcoming deadlines.</EmptyState> : upcoming.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle>Status</SectionTitle>
          <div className="flex items-center gap-4">
            <Donut segments={byStatus} center={tasks.length} sub="tasks" />
            <Legend items={byStatus} />
          </div>
        </Card>
        <Card>
          <SectionTitle>By person</SectionTitle>
          <div className="flex items-center gap-4">
            <Donut segments={byPerson} center={tasks.length} sub="tasks" />
            <Legend items={byPerson} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3 pb-2">
        {[
          { v: 'matrix', label: 'Decision Matrix' },
          { v: 'board', label: 'Kanban Board' },
          { v: 'timeline', label: 'Timeline' },
        ].map((q) => (
          <button key={q.v} onClick={() => onNavigate(q.v)} className="tk-card flex min-h-[56px] items-center justify-center p-2 text-center text-xs font-bold">
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Re-exported so other views can reuse the same “days until” wording.
export const daysUntil = (due: string, today: string) => dayDiff(due, today);

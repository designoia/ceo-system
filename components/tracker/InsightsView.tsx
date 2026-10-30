'use client';

import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useTracker } from '@/lib/tracker/store';
import { PRIORITIES, ymd } from '@/lib/tracker/model';
import { Card, PersonDot, ProgressBar, SectionTitle } from './ui';

export function InsightsView() {
  const { tasks, people, sessions, today } = useTracker();

  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = ymd(d);
      return {
        key,
        label: format(d, 'EEEEE'),
        done: tasks.filter((t) => t.completedAt && ymd(new Date(t.completedAt)) === key).length,
        focus: sessions.filter((s) => ymd(new Date(s.at)) === key).reduce((a, s) => a + s.minutes, 0),
      };
    });
    const doneWithDue = tasks.filter((t) => t.status === 'done' && t.due && t.completedAt);
    const onTime = doneWithDue.filter((t) => ymd(new Date(t.completedAt!)) <= t.due!).length;

    // Consecutive days (ending today, or yesterday if nothing yet today) with at least one completion.
    const doneDays = new Set(tasks.filter((t) => t.completedAt).map((t) => ymd(new Date(t.completedAt!))));
    let streak = 0;
    let cursor = doneDays.has(today) ? new Date() : subDays(new Date(), 1);
    while (doneDays.has(ymd(cursor))) {
      streak++;
      cursor = subDays(cursor, 1);
    }
    return { days, onTimePct: doneWithDue.length ? Math.round((onTime / doneWithDue.length) * 100) : null, streak };
  }, [tasks, sessions, today]);

  const maxDone = Math.max(1, ...data.days.map((d) => d.done));
  const maxFocus = Math.max(1, ...data.days.map((d) => d.focus));
  const weekDone = data.days.reduce((a, d) => a + d.done, 0);
  const weekFocus = data.days.reduce((a, d) => a + d.focus, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Done this week', v: weekDone, c: '#10b981' },
          { l: 'Focus (min)', v: weekFocus, c: '#6366f1' },
          { l: 'Day streak', v: `${data.streak}🔥`, c: '#f59e0b' },
          { l: 'On time', v: data.onTimePct == null ? '—' : `${data.onTimePct}%`, c: '#ec4899' },
        ].map((s) => (
          <Card key={s.l} className="p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] tk-muted">{s.l}</div>
            <div className="mt-1 text-3xl font-extrabold leading-none" style={{ color: s.c }}>
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>Tasks completed · last 7 days</SectionTitle>
        <div className="flex h-36 items-end gap-2">
          {data.days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold tabular-nums">{d.done || ''}</span>
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max((d.done / maxDone) * 100, d.done ? 8 : 3)}%`, background: d.done ? '#10b981' : 'hsl(var(--tk-soft))' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tk-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Focus minutes · last 7 days</SectionTitle>
        <div className="flex h-28 items-end gap-2">
          {data.days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold tabular-nums">{d.focus || ''}</span>
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max((d.focus / maxFocus) * 100, d.focus ? 8 : 3)}%`, background: d.focus ? '#6366f1' : 'hsl(var(--tk-soft))' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tk-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle>By priority</SectionTitle>
          <div className="space-y-3">
            {PRIORITIES.map((p) => {
              const all = tasks.filter((t) => t.priority === p.id);
              const done = all.filter((t) => t.status === 'done').length;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{p.label}</span>
                    <span className="tk-muted tabular-nums">
                      {done}/{all.length}
                    </span>
                  </div>
                  <ProgressBar value={all.length ? (done / all.length) * 100 : 0} color={p.color} />
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <SectionTitle>By person</SectionTitle>
          <div className="space-y-3">
            {people.length === 0 && <div className="text-sm tk-muted">Add people in Setup to see this.</div>}
            {people.map((p) => {
              const all = tasks.filter((t) => t.assignee === p.id);
              const done = all.filter((t) => t.status === 'done').length;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <PersonDot person={p} size={18} />
                      {p.name}
                    </span>
                    <span className="tk-muted tabular-nums">
                      {done}/{all.length}
                    </span>
                  </div>
                  <ProgressBar value={all.length ? (done / all.length) * 100 : 0} color={p.color} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

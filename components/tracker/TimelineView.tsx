'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTracker } from '@/lib/tracker/store';
import { dayDiff, prettyDate, shiftDay, statusMeta, tint, toDate, ymd, STATUSES } from '@/lib/tracker/model';
import { Card, EmptyState, SectionTitle } from './ui';

const ROW_H = 52;

export function TimelineView() {
  const { tasks, today, openSheet } = useTracker();
  const [zoom, setZoom] = useState<'week' | 'month'>('week');
  const [project, setProject] = useState<string>('all');
  const scroller = useRef<HTMLDivElement>(null);
  const dayW = zoom === 'week' ? 44 : 18;

  const projects = useMemo(() => Array.from(new Set(tasks.map((t) => t.project ?? 'No project'))), [tasks]);
  const scheduled = useMemo(
    () => tasks.filter((t) => (t.start || t.due) && (project === 'all' || (t.project ?? 'No project') === project)),
    [tasks, project]
  );

  const range = useMemo(() => {
    if (scheduled.length === 0) return null;
    let min = today;
    let max = today;
    for (const t of scheduled) {
      const s = t.start ?? t.due!;
      const e = t.due ?? t.start!;
      if (s < min) min = s;
      if (e > max) max = e;
    }
    const start = shiftDay(min, -3);
    const end = shiftDay(max, 4);
    return { start, end, days: dayDiff(end, start) + 1 };
  }, [scheduled, today]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof scheduled>();
    for (const t of scheduled) {
      const k = t.project ?? 'No project';
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    m.forEach((list) => list.sort((a, b) => (a.start ?? a.due!).localeCompare(b.start ?? b.due!)));
    return Array.from(m.entries());
  }, [scheduled]);

  // Land on today whenever the data or zoom changes.
  useEffect(() => {
    if (!range || !scroller.current) return;
    scroller.current.scrollLeft = Math.max(0, dayDiff(today, range.start) * dayW - 100);
  }, [range?.start, zoom, dayW, today]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!range) return <EmptyState>Give tasks a start or due date and they appear here.</EmptyState>;

  const width = range.days * dayW;
  const dayList = Array.from({ length: range.days }, (_, i) => addDays(toDate(range.start), i));
  const todayX = dayDiff(today, range.start) * dayW;
  const stats = {
    total: scheduled.length,
    done: scheduled.filter((t) => t.status === 'done').length,
    span: dayDiff(range.end, range.start) + 1,
  };
  const overall = stats.total ? Math.round(scheduled.reduce((a, t) => a + t.progress, 0) / stats.total) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="tk-scroll-x -mx-1 flex max-w-full gap-2 overflow-x-auto px-1">
          {['all', ...projects].map((p) => (
            <button
              key={p}
              onClick={() => setProject(p)}
              className={cn('min-h-[36px] shrink-0 rounded-full px-3 text-xs font-bold', project === p ? 'tk-accent-bg' : 'tk-soft')}
            >
              {p === 'all' ? 'All projects' : p}
            </button>
          ))}
        </div>
        <div className="flex rounded-full p-1 tk-soft">
          {(['week', 'month'] as const).map((z) => (
            <button key={z} onClick={() => setZoom(z)} className={cn('min-h-[36px] rounded-full px-3 text-xs font-bold capitalize', zoom === z && 'tk-accent-bg')}>
              {z}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Tasks', v: stats.total },
          { l: 'Span', v: `${stats.span}d` },
          { l: 'Progress', v: `${overall}%` },
        ].map((s) => (
          <Card key={s.l} className="p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider tk-muted">{s.l}</div>
            <div className="mt-0.5 text-xl font-extrabold">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {STATUSES.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-[11px] font-semibold tk-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="tk-card overflow-hidden p-0">
        <div ref={scroller} className="tk-scroll-x overflow-x-auto overscroll-x-contain">
          <div className="relative" style={{ width }}>
            {/* Header: month names + day numbers */}
            <div className="sticky top-0 z-10 border-b tk-line" style={{ background: 'hsl(var(--tk-card))' }}>
              <div className="relative h-6">
                {dayList.map((d, i) =>
                  i === 0 || d.getDate() === 1 ? (
                    <span key={i} className="absolute top-1 text-[10px] font-extrabold uppercase tracking-wider tk-accent-text" style={{ left: i * dayW + 4 }}>
                      {format(d, 'MMM yyyy')}
                    </span>
                  ) : null
                )}
              </div>
              <div className="flex">
                {dayList.map((d, i) => {
                  const key = ymd(d);
                  const showNum = zoom === 'week' || d.getDay() === 1 || d.getDate() === 1;
                  return (
                    <div key={i} className="flex shrink-0 flex-col items-center py-1" style={{ width: dayW }}>
                      {zoom === 'week' && <span className="text-[9px] font-bold uppercase tk-muted">{format(d, 'EEEEE')}</span>}
                      <span
                        className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[10px] font-bold"
                        style={key === today ? { background: '#ef4444', color: '#fff' } : undefined}
                      >
                        {showNum ? format(d, 'd') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekend shading + today line */}
            {dayList.map((d, i) =>
              d.getDay() === 0 || d.getDay() === 6 ? (
                <div key={i} className="pointer-events-none absolute bottom-0 top-[58px]" style={{ left: i * dayW, width: dayW, background: 'hsl(var(--tk-soft) / 0.6)' }} />
              ) : null
            )}
            <div className="pointer-events-none absolute bottom-0 top-[58px] z-[5] w-0.5 bg-red-500" style={{ left: todayX + dayW / 2 - 1 }} />

            {groups.map(([name, list]) => (
              <div key={name}>
                <div className="relative z-[6] h-7 border-b tk-line" style={{ background: tint('#6366f1', 14) }}>
                  <span className="sticky left-3 inline-block pt-1.5 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: '#6366f1' }}>
                    {name} · {list.length}
                  </span>
                </div>
                {list.map((t) => {
                  const s = t.start ?? t.due!;
                  const e = t.due ?? t.start!;
                  const left = dayDiff(s, range.start) * dayW;
                  const w = Math.max((dayDiff(e, s) + 1) * dayW, dayW);
                  const meta = statusMeta(t.status);
                  return (
                    <button
                      key={t.id}
                      onClick={() => openSheet(t.id)}
                      className="relative z-[6] block w-full border-b text-left tk-line"
                      style={{ height: ROW_H }}
                      aria-label={`${t.title}, ${prettyDate(s)} to ${prettyDate(e)}`}
                    >
                      {/* Title stays pinned to the left edge of the viewport while scrolling sideways */}
                      <span className={cn('sticky left-3 block max-w-[70vw] truncate pt-1.5 text-xs font-semibold', t.status === 'done' && 'line-through opacity-60')} style={{ width: 'fit-content' }}>
                        {t.title}
                      </span>
                      <span className="absolute bottom-2.5 h-3.5 overflow-hidden rounded-full" style={{ left, width: w, background: tint(meta.color, 28) }}>
                        <span className="block h-full rounded-full" style={{ width: `${t.progress}%`, background: meta.color }} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <SectionTitle>Tap a bar to edit · swipe sideways to scroll the timeline</SectionTitle>
    </div>
  );
}

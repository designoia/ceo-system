'use client';

import React, { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTracker } from '@/lib/tracker/store';
import { TTask, nextOccurrence, priorityMeta, statusMeta, toDate, ymd, prettyDate, PRIORITIES, STATUSES } from '@/lib/tracker/model';
import { Chip, EmptyState, PersonDot, SectionTitle, TaskCard } from './ui';

interface Occurrence {
  task: TTask;
  date: string;
  virtual: boolean; // auto-filled repeat of a recurring task
}

export function CalendarView() {
  const { tasks, people, today, toggleDone, openSheet } = useTracker();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [colourBy, setColourBy] = useState<'status' | 'priority'>('status');
  const [person, setPerson] = useState<string | 'all'>('all');
  const [hideDone, setHideDone] = useState(false);

  const monthKey = cursor.getTime();
  const { gridStart, gridEnd, days } = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return { gridStart: start, gridEnd: end, days: eachDayOfInterval({ start, end }) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  // Build occurrences for the visible grid, auto-filling recurring tasks forward from their due date.
  const byDay = useMemo(() => {
    const first = ymd(gridStart);
    const last = ymd(gridEnd);
    const map = new Map<string, Occurrence[]>();
    const push = (o: Occurrence) => {
      const list = map.get(o.date) ?? [];
      list.push(o);
      map.set(o.date, list);
    };
    for (const t of tasks) {
      if (person !== 'all' && t.assignee !== person) continue;
      if (hideDone && t.status === 'done') continue;
      if (t.due && t.due >= first && t.due <= last) push({ task: t, date: t.due, virtual: false });
      if (t.repeat !== 'none' && t.due && t.status !== 'done') {
        let d = nextOccurrence(t.due, t.repeat);
        let guard = 0;
        while (d <= last && guard++ < 400) {
          if (d >= first) push({ task: t, date: d, virtual: true });
          d = nextOccurrence(d, t.repeat);
        }
      }
    }
    map.forEach((list) => list.sort((a, b) => Number(a.task.status === 'done') - Number(b.task.status === 'done')));
    return map;
  }, [tasks, person, hideDone, gridStart, gridEnd]);

  const colourOf = (t: TTask) => (colourBy === 'status' ? statusMeta(t.status).color : priorityMeta(t.priority).color);
  const selectedList = byDay.get(selected) ?? [];
  const legend = colourBy === 'status' ? STATUSES : PRIORITIES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-full tk-soft" onClick={() => setCursor(addMonths(cursor, -1))}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-[8.5rem] text-center text-lg font-extrabold">{format(cursor, 'MMMM yyyy')}</h2>
          <button aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-full tk-soft" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          className="h-11 rounded-full px-4 text-xs font-bold tk-soft"
          onClick={() => {
            setCursor(startOfMonth(new Date()));
            setSelected(today);
          }}
        >
          Today
        </button>
      </div>

      {/* Controls: colour by, person filter, hide completed */}
      <div className="tk-scroll-x -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        <div className="flex shrink-0 rounded-full p-1 tk-soft">
          {(['status', 'priority'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setColourBy(m)}
              className={cn('min-h-[36px] rounded-full px-3 text-xs font-bold capitalize', colourBy === m && 'tk-accent-bg')}
            >
              {m}
            </button>
          ))}
        </div>
        <Chip color="#94a3b8" active={person === 'all'} onClick={() => setPerson('all')}>
          Everyone
        </Chip>
        {people.map((p) => (
          <Chip key={p.id} color={p.color} active={person === p.id} onClick={() => setPerson(p.id)}>
            {p.name}
          </Chip>
        ))}
        <button
          onClick={() => setHideDone((v) => !v)}
          className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold tk-soft"
          aria-pressed={hideDone}
        >
          {hideDone ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {hideDone ? 'Completed hidden' : 'Hide completed'}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {legend.map((l) => (
          <span key={l.id} className="flex items-center gap-1.5 text-[11px] font-semibold tk-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Month grid */}
      <div className="tk-card overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b tk-line text-center text-[10px] font-bold uppercase tracking-wider tk-muted">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-2">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = ymd(d);
            const list = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, cursor);
            const isToday = key === today;
            const isSel = key === selected;
            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(key)}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(key)}
                className="min-h-[62px] cursor-pointer border-b border-r p-1 tk-line sm:min-h-[104px] sm:p-1.5"
                style={{
                  background: isSel ? 'color-mix(in srgb, hsl(var(--tk-accent)) 10%, transparent)' : inMonth ? undefined : 'hsl(var(--tk-soft))',
                  opacity: inMonth ? 1 : 0.55,
                }}
              >
                <div className="mb-1 flex justify-center sm:justify-start">
                  <span
                    className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-bold"
                    style={isToday ? { background: '#ef4444', color: '#fff' } : undefined}
                  >
                    {format(d, 'd')}
                  </span>
                </div>

                {/* Phones: colour bars. Tablet+: readable chips like the printed template. */}
                <div className="flex flex-col gap-0.5 sm:hidden">
                  {list.slice(0, 3).map((o, i) => (
                    <span key={i} className="h-1.5 rounded-full" style={{ background: colourOf(o.task), opacity: o.task.status === 'done' ? 0.35 : o.virtual ? 0.55 : 1 }} />
                  ))}
                  {list.length > 3 && <span className="text-center text-[9px] font-bold tk-muted">+{list.length - 3}</span>}
                </div>
                <div className="hidden flex-col gap-0.5 sm:flex">
                  {list.slice(0, 3).map((o, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        openSheet(o.task.id);
                      }}
                      className="flex items-center gap-1 truncate rounded-md px-1 py-0.5 text-left text-[11px] font-medium tk-soft"
                      style={{ opacity: o.virtual ? 0.7 : 1 }}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colourOf(o.task) }} />
                      <span className={cn('truncate', o.task.status === 'done' && 'line-through opacity-60')}>{o.task.title}</span>
                    </button>
                  ))}
                  {list.length > 3 && <span className="px-1 text-[10px] font-bold tk-muted">+{list.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected-day agenda (the main way to read a day on a phone) */}
      <div>
        <SectionTitle>{selected === today ? 'Today' : prettyDate(selected)} · {selectedList.length} item{selectedList.length === 1 ? '' : 's'}</SectionTitle>
        <div className="space-y-2">
          {selectedList.length === 0 && <EmptyState>Nothing scheduled.</EmptyState>}
          {selectedList.map((o, i) =>
            o.virtual ? (
              <button
                key={i}
                onClick={() => openSheet(o.task.id)}
                className="tk-card flex w-full items-center gap-3 border-dashed p-3 text-left"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed tk-line tk-muted text-xs">↻</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{o.task.title}</div>
                  <div className="text-[11px] tk-muted">Repeats {o.task.repeat} · auto-filled</div>
                </div>
                <PersonDot person={people.find((p) => p.id === o.task.assignee)} />
              </button>
            ) : (
              <TaskCard key={o.task.id} task={o.task} showStatus />
            )
          )}
        </div>
        <button
          onClick={() => openSheet(null, { due: selected })}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-bold tk-line tk-muted"
        >
          <Check className="h-4 w-4 opacity-0" /> + Add task on {prettyDate(selected)}
        </button>
      </div>
    </div>
  );
}

export const _calendarDate = toDate; // keeps tree-shaken helper import stable for tests

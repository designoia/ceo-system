'use client';

import React, { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { taskDay } from '@/lib/work';
import { DndArea, Draggable, DropZone } from './dnd';
import { CheckBox, QuickAddBar, TaskRow, useCalendarColor, useToday, useToggleTask } from './TaskParts';

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

export function MonthView({ tasks, filter, onOpen }: { tasks: Task[]; filter: string; onOpen: (id: string) => void }) {
  const { rescheduleTask } = useStore();
  const today = useToday();
  const color = useCalendarColor();
  const toggle = useToggleTask();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [hideDone, setHideDone] = useState(false);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) }),
    [cursor]
  );

  const shown = useMemo(() => tasks.filter((t) => !(hideDone && t.status === 'DONE')), [tasks, hideDone]);
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of shown) {
      const d = taskDay(t);
      if (!d) continue;
      m.set(d, [...(m.get(d) ?? []), t]);
    }
    m.forEach((list) => list.sort((a, b) => Number(a.status === 'DONE') - Number(b.status === 'DONE')));
    return m;
  }, [shown]);
  const unscheduled = useMemo(() => shown.filter((t) => !taskDay(t) && t.status !== 'DONE'), [shown]);
  const selectedTasks = byDay.get(selected) ?? [];

  const onDrop = (taskId: string, overId: string) => {
    if (overId.startsWith('day:')) {
      rescheduleTask(taskId, overId.slice(4));
      setSelected(overId.slice(4));
    }
  };

  return (
    <DndArea
      onDrop={onDrop}
      renderOverlay={(id) => {
        const t = tasks.find((x) => x.id === id);
        return t ? <div className="max-w-[220px] truncate rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium">{t.title}</div> : null;
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <button aria-label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))} className="flex h-11 w-11 items-center justify-center rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="min-w-[7.5rem] text-center text-base font-bold sm:min-w-[8.5rem]">{format(cursor, 'MMMM yyyy')}</h2>
            <button aria-label="Next month" onClick={() => setCursor(addMonths(cursor, 1))} className="flex h-11 w-11 items-center justify-center rounded-full">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideDone((v) => !v)}
              aria-pressed={hideDone}
              aria-label={hideDone ? 'Show completed tasks' : 'Hide completed tasks'}
              className={cn('flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold', hideDone ? 'border-primary text-primary' : 'border-border text-muted-foreground')}
            >
              {hideDone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="hidden sm:inline">{hideDone ? 'Done hidden' : 'Hide done'}</span>
            </button>
            <button
              onClick={() => {
                setCursor(startOfMonth(new Date()));
                setSelected(today);
              }}
              className="min-h-[40px] whitespace-nowrap rounded-full border border-border px-3.5 text-xs font-semibold"
            >
              Today
            </button>
          </div>
        </div>

        <div className="surface-1 overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
              const isSel = key === selected;
              const isToday = key === today;
              return (
                <DropZone
                  key={key}
                  id={`day:${key}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(key)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(key)}
                  aria-label={format(d, 'EEEE d MMMM')}
                  className={cn('min-h-[64px] cursor-pointer border-b border-r border-border p-1 sm:min-h-[112px] sm:p-1.5', !inMonth && 'opacity-45', isSel && 'bg-primary/10')}
                  overClassName="!bg-primary/25 ring-2 ring-inset ring-primary"
                >
                  <div className="mb-1 flex justify-center sm:justify-start">
                    <span className={cn('flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[11px] font-bold', isToday && 'bg-red-500 text-white')}>{format(d, 'd')}</span>
                  </div>

                  {/* Phones: coloured bars (tap the day to read it below) */}
                  <div className="flex flex-col gap-[3px] sm:hidden">
                    {list.slice(0, 3).map((t) => (
                      <span key={t.id} className="h-1.5 rounded-full" style={{ background: color(t.businessCode), opacity: t.status === 'DONE' ? 0.3 : t.status === 'OVERDUE' ? 1 : 0.85 }} />
                    ))}
                    {list.length > 3 && <span className="text-center text-[9px] font-bold text-muted-foreground">+{list.length - 3}</span>}
                  </div>

                  {/* Larger screens: checkbox + title, draggable */}
                  <div className="hidden flex-col gap-0.5 sm:flex">
                    {list.slice(0, 4).map((t) => (
                      <Draggable key={t.id} id={t.id}>
                        <div className="flex items-center gap-1.5 rounded-md bg-secondary/60 px-1.5 py-1" onClick={(e) => e.stopPropagation()}>
                          <span className="-my-2.5 -ml-1.5 scale-[0.7]"><CheckBox checked={t.status === 'DONE'} onToggle={() => toggle(t)} color={color(t.businessCode)} /></span>
                          <button onClick={() => onOpen(t.id)} className={cn('min-w-0 flex-1 truncate text-left text-[11px] font-medium', t.status === 'DONE' && 'text-muted-foreground line-through', t.status === 'OVERDUE' && 'text-red-500')}>
                            {t.title}
                          </button>
                        </div>
                      </Draggable>
                    ))}
                    {list.length > 4 && <span className="px-1 text-[10px] font-bold text-muted-foreground">+{list.length - 4} more</span>}
                  </div>
                </DropZone>
              );
            })}
          </div>
        </div>

        {/* The day you tapped: tick off, drag out, or add */}
        <section>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {selected === today ? 'Today' : format(parseISO(selected), 'EEEE d MMMM')} · {selectedTasks.length}
          </h3>
          <div className="space-y-2">
            {selectedTasks.map((t) => (
              <Draggable key={t.id} id={t.id}>
                <TaskRow task={t} onOpen={(x) => onOpen(x.id)} expandable />
              </Draggable>
            ))}
            <QuickAddBar date={selected} businessCode={filter === 'ALL' ? '' : filter} placeholder={`Add to ${format(parseISO(selected), 'd MMM')}…`} />
          </div>
        </section>

        {unscheduled.length > 0 && (
          <section>
            <h3 className="mb-1 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Unscheduled · {unscheduled.length}</h3>
            <p className="mb-2 px-1 text-xs text-muted-foreground">Drag onto a day above to plan it.</p>
            <div className="space-y-2">
              {unscheduled.map((t) => (
                <Draggable key={t.id} id={t.id}>
                  <TaskRow task={t} onOpen={(x) => onOpen(x.id)} compact />
                </Draggable>
              ))}
            </div>
          </section>
        )}
      </div>
    </DndArea>
  );
}

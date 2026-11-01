'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCalendarFilter } from '@/lib/hooks/useCalendarFilter';
import { PageTransition } from '@/components/motion/PageTransition';
import { CalendarChips } from '@/components/work/CalendarChips';
import { TaskSheet } from '@/components/work/TaskSheet';
import { BoardView } from '@/components/work/BoardView';
import { MatrixView } from '@/components/work/MatrixView';
import { MonthView } from '@/components/work/MonthView';
import { topLevel } from '@/lib/work';

const VIEWS = [
  { id: 'month', label: 'Calendar' },
  { id: 'board', label: 'Board' },
  { id: 'matrix', label: 'Matrix' },
] as const;
type ViewId = (typeof VIEWS)[number]['id'];

export default function CalendarPage() {
  const { tasks } = useStore();
  const [filter, setFilter] = useCalendarFilter();
  const [view, setView] = useState<ViewId>('month');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => topLevel(tasks).filter((t) => filter === 'ALL' || t.businessCode === filter), [tasks, filter]);

  return (
    <PageTransition className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          {view === 'month' && 'Drag a task to another day to move it.'}
          {view === 'board' && 'Drag a task across stages as work moves along.'}
          {view === 'matrix' && 'Decide what to do, schedule, delegate or drop.'}
        </p>
      </div>

      <CalendarChips value={filter} onChange={setFilter} />

      <div className="flex rounded-xl bg-secondary p-1" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={cn('min-h-[44px] flex-1 rounded-lg text-sm font-semibold transition-colors', view === v.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'month' && <MonthView tasks={list} filter={filter} onOpen={(id) => setOpenId(id)} />}
      {view === 'board' && <BoardView tasks={list} onOpen={(id) => setOpenId(id)} />}
      {view === 'matrix' && <MatrixView tasks={list} onOpen={(id) => setOpenId(id)} />}

      <TaskSheet taskId={openId} onClose={() => setOpenId(null)} />
    </PageTransition>
  );
}

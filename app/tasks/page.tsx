'use client';

import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Settings2, Trash2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCalendarFilter } from '@/lib/hooks/useCalendarFilter';
import { Task } from '@/lib/types';
import { topLevel } from '@/lib/work';
import { PageTransition } from '@/components/motion/PageTransition';
import { TrashModal } from '@/components/tasks/TrashModal';
import { CalendarChips, ManageCalendarsSheet } from '@/components/work/CalendarChips';
import { QuickAddBar, TaskRow, useToday } from '@/components/work/TaskParts';
import { TaskSheet } from '@/components/work/TaskSheet';

function Section({
  title,
  tone,
  tasks,
  onOpen,
  pull,
  hint,
}: {
  title: string;
  tone?: 'red' | 'muted';
  tasks: Task[];
  onOpen: (t: Task) => void;
  pull?: boolean;
  hint?: string;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <h2 className={cn('text-[11px] font-bold uppercase tracking-[0.12em]', tone === 'red' ? 'text-red-500' : 'text-muted-foreground')}>{title}</h2>
        <span className="text-[11px] text-muted-foreground">{tasks.length}</span>
        {hint && <span className="ml-auto text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onOpen={onOpen} expandable pullToToday={pull} />
        ))}
      </div>
    </section>
  );
}

export default function TasksPage() {
  const { tasks, deletedTasks, clearAllTasks } = useStore();
  const [filter, setFilter] = useCalendarFilter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [manage, setManage] = useState(false);
  const [trash, setTrash] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const today = useToday();

  const groups = useMemo(() => {
    const list = topLevel(tasks).filter((t) => filter === 'ALL' || t.businessCode === filter);
    const by = (...s: Task['status'][]) => list.filter((t) => s.includes(t.status));
    const date = (t: Task) => t.scheduledDate || t.dueDate || '9999';
    return {
      total: list.length,
      overdue: by('OVERDUE').sort((a, b) => date(a).localeCompare(date(b))),
      today: by('TODAY'),
      inbox: by('INBOX', 'BACKLOG'),
      upcoming: by('NEXT', 'THIS_WEEK').sort((a, b) => date(a).localeCompare(date(b))),
      blocked: by('BLOCKED'),
      done: by('DONE').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    };
  }, [tasks, filter]);

  const left = groups.overdue.length + groups.today.length;
  const open = (t: Task) => setOpenId(t.id);

  return (
    <PageTransition className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {groups.total === 0 ? 'Nothing here yet' : left === 0 ? 'All clear for today' : `${left} left for today`}
          </p>
        </div>
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} aria-label="More" className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
              <div className="surface-2 absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border shadow-xl">
                <button onClick={() => { setMenu(false); setManage(true); }} className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left text-sm hover:bg-secondary">
                  <Settings2 className="h-4 w-4" /> Manage calendars
                </button>
                <button onClick={() => { setMenu(false); setTrash(true); }} className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left text-sm hover:bg-secondary">
                  <Trash2 className="h-4 w-4" /> Recently deleted ({deletedTasks.length})
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    if (confirm('Delete ALL tasks? Your calendars, goals and projects stay.')) clearAllTasks();
                  }}
                  className="flex min-h-[48px] w-full items-center gap-3 border-t border-border px-4 text-left text-sm text-red-500 hover:bg-secondary"
                >
                  <XCircle className="h-4 w-4" /> Clear all tasks
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <CalendarChips value={filter} onChange={setFilter} />
      <QuickAddBar date={today} businessCode={filter === 'ALL' ? '' : filter} placeholder="Add a task for today — press Enter" />

      {groups.total === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-[15px] font-semibold">Start by typing a task above.</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">New tasks are added to <b>today</b>. Open one to change its day, or drag it to another day in Calendar.</p>
        </div>
      )}

      <Section title="Overdue" tone="red" tasks={groups.overdue} onOpen={open} />
      <Section title="Today" tasks={groups.today} onOpen={open} />
      <Section title="Inbox" tasks={groups.inbox} onOpen={open} pull />
      <Section title="Upcoming" tasks={groups.upcoming} onOpen={open} />
      <Section title="Blocked" tasks={groups.blocked} onOpen={open} />

      {groups.done.length > 0 && (
        <section>
          <button onClick={() => setShowDone((v) => !v)} className="mb-2 flex min-h-[40px] items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Done · {groups.done.length}
            <span className="font-medium normal-case tracking-normal">{showDone ? 'Hide' : 'Show'}</span>
          </button>
          {showDone && (
            <div className="space-y-2">
              {groups.done.slice(0, 30).map((t) => (
                <TaskRow key={t.id} task={t} onOpen={open} />
              ))}
            </div>
          )}
        </section>
      )}

      <TaskSheet taskId={openId} onClose={() => setOpenId(null)} />
      <ManageCalendarsSheet open={manage} onClose={() => setManage(false)} />
      <TrashModal isOpen={trash} onClose={() => setTrash(false)} />
    </PageTransition>
  );
}

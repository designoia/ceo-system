'use client';

import React, { useState } from 'react';
import { addDays, format, nextMonday, parseISO } from 'date-fns';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleDot, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { useToday } from './TaskParts';

type Kind = 'not' | 'done' | 'pending' | 'overdue';

const KINDS: Record<Kind, { label: string; pill: string; icon: React.ReactNode }> = {
  not: { label: 'Not done', pill: 'bg-secondary text-foreground/80', icon: <Circle className="h-3.5 w-3.5" /> },
  done: { label: 'Done', pill: 'bg-emerald-500/15 text-emerald-400', icon: <Check className="h-3.5 w-3.5" strokeWidth={3} /> },
  pending: { label: 'Pending', pill: 'bg-amber-500/15 text-amber-400', icon: <CircleDot className="h-3.5 w-3.5" /> },
  overdue: { label: 'Overdue', pill: 'bg-red-500/15 text-red-400', icon: <Circle className="h-3.5 w-3.5" /> },
};

const kindOf = (t: Task): Kind => (t.status === 'DONE' ? 'done' : t.status === 'BLOCKED' ? 'pending' : t.status === 'OVERDUE' ? 'overdue' : 'not');

/**
 * One dropdown that says where a task stands:
 * Not done · Done · Pending (waiting on someone) · Reschedule (pick a new day).
 */
export function StatusSelect({ task }: { task: Task }) {
  const { updateTaskStatus, undoTaskCompletion, rescheduleTask } = useStore();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'main' | 'date'>('main');
  const kind = kindOf(task);
  const k = KINDS[kind];

  const close = () => {
    setOpen(false);
    setStep('main');
  };

  const choose = (target: 'not' | 'done' | 'pending') => {
    if (target === 'done') {
      if (kind !== 'done') updateTaskStatus(task.id, 'DONE');
    } else {
      if (kind === 'done') undoTaskCompletion(task.id);
      if (target === 'pending') updateTaskStatus(task.id, 'BLOCKED');
      else {
        // "Not done" means: this is on for today. Re-plan it for today so it doesn't stay flagged late.
        updateTaskStatus(task.id, 'TODAY');
        rescheduleTask(task.id, today);
      }
    }
    close();
  };

  const moveTo = (date: string) => {
    if (kind === 'done') undoTaskCompletion(task.id);
    if (kind === 'pending') updateTaskStatus(task.id, 'TODAY'); // leaving "pending" — it has a new day now
    rescheduleTask(task.id, date);
    close();
  };

  const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');
  const nextMon = format(nextMonday(parseISO(today)), 'yyyy-MM-dd');

  const item = (active: boolean) =>
    cn('flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13.5px] font-semibold hover:bg-secondary', active && 'bg-secondary/70');

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${k.label}. Change status`}
        className={cn('inline-flex min-h-[40px] items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold', k.pill)}
      >
        {k.icon}
        {k.label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div role="menu" className="surface-2 absolute right-0 top-full z-40 mt-1.5 w-60 rounded-xl border border-border p-1.5 shadow-2xl">
            {step === 'main' ? (
              <>
                <button role="menuitem" className={item(kind === 'not' || kind === 'overdue')} onClick={() => choose('not')}>
                  <Circle className="h-4 w-4" /> Not done
                </button>
                <button role="menuitem" className={item(kind === 'done')} onClick={() => choose('done')}>
                  <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} /> Done
                </button>
                <button role="menuitem" className={item(kind === 'pending')} onClick={() => choose('pending')}>
                  <CircleDot className="h-4 w-4 text-amber-400" /> Pending
                  <span className="ml-auto text-[11px] font-normal text-muted-foreground">waiting</span>
                </button>
                <button role="menuitem" className={item(false)} onClick={() => setStep('date')}>
                  <RotateCcw className="h-4 w-4 text-indigo-400" /> Reschedule
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <button className="flex min-h-[40px] w-full items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground" onClick={() => setStep('main')}>
                  <ChevronLeft className="h-4 w-4" /> Move to…
                </button>
                <button role="menuitem" className={item(false)} onClick={() => moveTo(tomorrow)}>
                  Tomorrow <span className="ml-auto text-[11px] font-normal text-muted-foreground">{format(parseISO(tomorrow), 'EEE d MMM')}</span>
                </button>
                <button role="menuitem" className={item(false)} onClick={() => moveTo(nextMon)}>
                  Next Monday <span className="ml-auto text-[11px] font-normal text-muted-foreground">{format(parseISO(nextMon), 'd MMM')}</span>
                </button>
                <label className="mt-1 flex min-h-[44px] items-center gap-2 border-t border-border px-3 pt-1 text-[13px] font-semibold text-indigo-300">
                  Pick a date
                  <input
                    type="date"
                    min={today}
                    aria-label="Pick a date"
                    onChange={(e) => e.target.value && moveTo(e.target.value)}
                    className="ml-auto min-h-[36px] rounded-md border border-border bg-transparent px-2 text-sm text-foreground"
                  />
                </label>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

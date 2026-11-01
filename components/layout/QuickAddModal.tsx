'use client';

import React, { useEffect, useRef, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { ChevronDown, X } from 'lucide-react';
import { cn, getTodayDateString } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCloseOnRouteChange } from '@/lib/hooks/useCloseOnRouteChange';
import { statusForDate } from '@/lib/work';

/**
 * Quick add: type, press Enter, done. The task is added to ONE day —
 * today, or the day picked in the Calendar — and can be moved later.
 */
export function QuickAddModal() {
  const { isQuickAddOpen, setQuickAddOpen, addTask, businesses, settings, quickAddDate } = useStore();
  useCloseOnRouteChange(isQuickAddOpen, () => setQuickAddOpen(false));
  const today = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [calendar, setCalendar] = useState('');
  const [details, setDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      setDate(quickAddDate ?? today);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setTitle('');
    setCalendar('');
    setDetails(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuickAddOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && isQuickAddOpen && setQuickAddOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isQuickAddOpen, setQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');
  const dayLabel = date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : format(parseISO(date), 'EEE d MMM');

  const submit = () => {
    const name = title.trim();
    if (!name) return;
    addTask({ title: name, businessCode: calendar, scheduledDate: date, status: statusForDate(date, today) });
    setQuickAddOpen(false);
  };

  const chip = (active: boolean) =>
    cn('min-h-[40px] rounded-full border px-4 text-[13px] font-semibold', active ? 'text-white' : 'border-border text-muted-foreground');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setQuickAddOpen(false)}>
      <div
        className="surface-1 w-full rounded-t-2xl border border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="New task"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">
            New task <span className="font-medium text-muted-foreground">· for {dayLabel}</span>
          </h2>
          <button onClick={() => setQuickAddOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="What needs doing?"
          enterKeyHint="done"
          className="min-h-[52px] w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-primary"
        />

        <button onClick={() => setDetails((v) => !v)} className="mt-2 flex min-h-[40px] items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <ChevronDown className={cn('h-4 w-4 transition-transform', details && 'rotate-180')} />
          Change day or calendar <span className="text-xs">(optional)</span>
        </button>

        {details && (
          <div className="mb-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setDate(today)} className={chip(date === today)} style={date === today ? { background: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' } : undefined}>Today</button>
              <button onClick={() => setDate(tomorrow)} className={chip(date === tomorrow)} style={date === tomorrow ? { background: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' } : undefined}>Tomorrow</button>
              <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a day" className="min-h-[40px] rounded-full border border-border bg-transparent px-3 text-base" />
            </div>
            {businesses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCalendar('')} className={chip(!calendar)} style={!calendar ? { background: '#64748b', borderColor: '#64748b' } : undefined}>No calendar</button>
                {businesses.map((b) => (
                  <button key={b.code} onClick={() => setCalendar(b.code)} className={chip(calendar === b.code)} style={calendar === b.code ? { background: b.color, borderColor: b.color } : undefined}>{b.name}</button>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={submit} disabled={!title.trim()} className="mt-3 h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40">
          Add task
        </button>
      </div>
    </div>
  );
}

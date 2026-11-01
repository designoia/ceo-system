'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn, getTodayDateString } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCloseOnRouteChange } from '@/lib/hooks/useCloseOnRouteChange';
import { statusForDate } from '@/lib/work';

type When = 'INBOX' | 'TODAY' | 'TOMORROW';

/**
 * Quick capture: type, press Enter, done. The task lands in your Inbox.
 * Day and calendar are optional and tucked away.
 */
export function QuickAddModal() {
  const { isQuickAddOpen, setQuickAddOpen, addTask, businesses, settings } = useStore();
  useCloseOnRouteChange(isQuickAddOpen, () => setQuickAddOpen(false));
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState<When>('INBOX');
  const [calendar, setCalendar] = useState('');
  const [details, setDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setTitle('');
    setWhen('INBOX');
    setCalendar('');
    setDetails(false);
  }, [isQuickAddOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && isQuickAddOpen && setQuickAddOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isQuickAddOpen, setQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const submit = () => {
    const name = title.trim();
    if (!name) return;
    const today = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    const date =
      when === 'TODAY' ? today : when === 'TOMORROW' ? new Date(Date.parse(today) + 86_400_000).toISOString().slice(0, 10) : undefined;
    addTask({ title: name, businessCode: calendar, scheduledDate: date, status: statusForDate(date, today) });
    setQuickAddOpen(false);
  };

  const chip = (active: boolean, color?: string) =>
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
          <h2 className="text-sm font-bold">New task</h2>
          <button onClick={() => setQuickAddOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="What's on your mind?"
          enterKeyHint="done"
          className="min-h-[52px] w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-primary"
        />

        <button onClick={() => setDetails((v) => !v)} className="mt-2 flex min-h-[40px] items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <ChevronDown className={cn('h-4 w-4 transition-transform', details && 'rotate-180')} />
          Day &amp; calendar <span className="text-xs">(optional)</span>
        </button>

        {details && (
          <div className="mb-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['INBOX', 'Inbox'],
                  ['TODAY', 'Today'],
                  ['TOMORROW', 'Tomorrow'],
                ] as [When, string][]
              ).map(([id, label]) => (
                <button key={id} onClick={() => setWhen(id)} className={chip(when === id)} style={when === id ? { background: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' } : undefined}>
                  {label}
                </button>
              ))}
            </div>
            {businesses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCalendar('')} className={chip(!calendar)} style={!calendar ? { background: '#64748b', borderColor: '#64748b' } : undefined}>
                  No calendar
                </button>
                {businesses.map((b) => (
                  <button key={b.code} onClick={() => setCalendar(b.code)} className={chip(calendar === b.code)} style={calendar === b.code ? { background: b.color, borderColor: b.color } : undefined}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!title.trim()}
          className="mt-3 h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          Add task
        </button>
      </div>
    </div>
  );
}

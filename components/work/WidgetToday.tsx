'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { useTodayRows } from '@/lib/hooks/useTodayRows';
import { useSync } from '@/lib/sync/SyncProvider';
import { QuickAddBar, TaskRow } from './TaskParts';
import { TaskSheet } from './TaskSheet';

function SyncNote() {
  const sync = useSync();
  if (sync.status === 'loading' || sync.status === 'off') return null;
  const text =
    sync.status === 'signed-out' ? 'Not signed in — only on this device'
    : sync.status === 'offline' ? 'Offline — will sync when you’re back'
    : sync.status === 'error' ? 'Couldn’t sync'
    : sync.status === 'held' ? 'Sync paused — open Settings'
    : sync.status === 'syncing' ? 'Syncing…'
    : `Synced${sync.lastSyncedAt ? ` · ${formatDistanceToNow(parseISO(sync.lastSyncedAt), { addSuffix: true })}` : ''}`;
  const dot = sync.status === 'synced' ? 'bg-emerald-500' : sync.status === 'syncing' ? 'bg-blue-400' : sync.status === 'signed-out' ? 'bg-slate-500' : 'bg-amber-500';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );
}

function AddBox({ today }: { today: string }) {
  // The "Add task" shortcut opens /widget?add=1 so the keyboard is ready straight away.
  const params = useSearchParams();
  return <QuickAddBar date={today} placeholder="Add a task for today…" autoFocus={params.get('add') === '1'} showOptions />;
}

/** A compact "Today" screen: small enough for a pinned window or a home-screen shortcut. */
export function WidgetToday() {
  const { rows, today, done, pending, todo } = useTodayRows();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">{format(parseISO(today), 'EEEE d MMMM')}</p>
        </div>
        <Link href="/" className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border px-3.5 text-[13px] font-semibold">
          Open app <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <p className="-mt-2 text-sm font-semibold">
        {rows.length === 0 ? 'Nothing planned yet' : todo === 0 ? 'All clear 🎉' : `${todo} to do`}
        {pending > 0 && <span className="font-normal text-muted-foreground"> · {pending} pending</span>}
        {done > 0 && <span className="font-normal text-muted-foreground"> · {done} done</span>}
      </p>

      <Suspense fallback={<div className="min-h-[50px]" />}>
        <AddBox today={today} />
      </Suspense>

      <div className="space-y-2">
        {rows.map((t) => (
          <TaskRow key={t.id} task={t} onOpen={(x) => setOpenId(x.id)} />
        ))}
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
        <SyncNote />
        <nav className="flex gap-4" aria-label="Open in the app">
          <Link href="/tasks" className="min-h-[40px] py-2.5 font-semibold">Tasks</Link>
          <Link href="/calendar" className="min-h-[40px] py-2.5 font-semibold">Calendar</Link>
        </nav>
      </footer>

      <TaskSheet taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

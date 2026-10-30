'use client';

import React from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMER_MINUTES, TimerMode, useFocusTimer, useTracker } from '@/lib/tracker/store';
import { ymd } from '@/lib/tracker/model';
import { Card, SectionTitle } from './ui';

export const fmtClock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const MODES: { id: TimerMode; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'short', label: 'Short break' },
  { id: 'long', label: 'Long break' },
];

export function FocusView() {
  const { tasks, sessions, today } = useTracker();
  const t = useFocusTimer();
  const open = tasks.filter((x) => x.status !== 'done');
  const pct = 1 - t.leftMs / t.totalMs;
  const todays = sessions.filter((s) => ymd(new Date(s.at)) === today);
  const minutes = todays.reduce((a, s) => a + s.minutes, 0);
  const R = 110;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-5">
      <div className="flex justify-center rounded-full p-1 tk-soft">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => t.setMode(m.id)}
            className={cn('min-h-[40px] flex-1 rounded-full px-3 text-xs font-bold', t.mode === m.id && 'tk-accent-bg')}
          >
            {m.label} · {TIMER_MINUTES[m.id]}m
          </button>
        ))}
      </div>

      <Card className="flex flex-col items-center gap-5 py-8">
        <div className="relative h-[250px] w-[250px]">
          <svg viewBox="0 0 250 250" className="-rotate-90">
            <circle cx="125" cy="125" r={R} fill="none" stroke="hsl(var(--tk-soft))" strokeWidth="14" />
            <circle
              cx="125"
              cy="125"
              r={R}
              fill="none"
              stroke={t.mode === 'focus' ? '#6366f1' : '#10b981'}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-extrabold tabular-nums tracking-tight" role="timer" aria-live="off">
              {fmtClock(t.leftMs)}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-widest tk-muted">{t.running ? (t.mode === 'focus' ? 'Stay with it' : 'Rest') : 'Ready'}</div>
          </div>
        </div>

        {t.finishedAt && !t.running && <div className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: 'color-mix(in srgb, #10b981 18%, transparent)', color: '#10b981' }}>Session complete 🎉</div>}

        <div className="flex items-center gap-4">
          <button aria-label="Reset" onClick={t.reset} className="flex h-14 w-14 items-center justify-center rounded-full tk-soft">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={t.running ? t.pause : t.start}
            className="tk-accent-bg flex h-[72px] min-w-[160px] items-center justify-center gap-2 rounded-full text-base font-extrabold shadow-lg"
          >
            {t.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {t.running ? 'Pause' : t.leftMs < t.totalMs ? 'Resume' : 'Start'}
          </button>
        </div>
      </Card>

      <div>
        <SectionTitle>Working on</SectionTitle>
        <select className="tk-input" value={t.taskId ?? ''} onChange={(e) => t.setTaskId(e.target.value || undefined)}>
          <option value="">Nothing specific</option>
          {open.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <SectionTitle>Today</SectionTitle>
        <div className="flex items-end gap-6">
          <div>
            <div className="text-3xl font-extrabold">{minutes}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider tk-muted">focus minutes</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold">{todays.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider tk-muted">sessions</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

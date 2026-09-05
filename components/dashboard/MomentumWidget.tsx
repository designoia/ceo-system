'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, CheckCircle, ArrowRight, Calendar } from 'lucide-react';
import { useStore } from '@/lib/store';

export function MomentumWidget() {
  const { tasks, meaningfulDaysThisWeek, currentMonth } = useStore();

  const thisWeekTasks = tasks.filter(
    (t) => t.status === 'THIS_WEEK' || t.status === 'TODAY' || (t.status === 'DONE' && t.completedAt)
  );
  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const totalCount = Math.max(thisWeekTasks.length, 10);
  const progressPercent = Math.min(Math.round((completedCount / totalCount) * 100), 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. THIS WEEK PROGRESS */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs pb-2">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">
            THIS WEEK
          </span>
          <span className="font-bold text-foreground font-mono">
            {completedCount} / {totalCount} completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Weekly completion</span>
          <span className="font-semibold text-foreground">{progressPercent}%</span>
        </div>
      </div>

      {/* 2. MONTHLY STRATEGIC FOCUS */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              MONTH FOCUS
            </span>
            <span className="text-[11px] text-primary font-semibold">
              {currentMonth?.yearMonth || '2026-09'}
            </span>
          </div>

          <h4 className="text-sm font-bold text-foreground mt-1 line-clamp-1">
            {currentMonth?.focusTitle || 'Foundation & Systems'}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {currentMonth?.targetOutcome || 'Master plan setup'}
          </p>
        </div>

        <Link
          href="/goals"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>View 60-Month Strategic Roadmap</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 3. MOMENTUM / MEANINGFUL DAYS */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block pb-1">
            MOMENTUM
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Flame className="h-4 w-4 fill-current" />
            </span>
            <span className="text-sm font-bold text-foreground">
              {meaningfulDaysThisWeek} meaningful days
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tracked by real progress, not streak pressure.
          </p>
        </div>

        <div className="mt-2 text-[11px] text-muted-foreground">
          Ready for tonight's session.
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Calendar, Info, Trophy } from 'lucide-react';
import { useStore } from '@/lib/store';

export function MomentumWidget() {
  const { tasks, momentumStats, currentMonth } = useStore();

  const thisWeekTasks = tasks.filter(
    (t) => !t.isDeleted && (t.status === 'THIS_WEEK' || t.status === 'TODAY' || (t.status === 'DONE' && t.completedAt))
  );
  const completedCount = tasks.filter((t) => !t.isDeleted && t.status === 'DONE').length;
  const totalCount = Math.max(thisWeekTasks.length, 1);
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
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
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

      {/* 3. REAL DATA-DRIVEN MOMENTUM */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              MOMENTUM
            </span>
            <div
              className="group relative cursor-pointer text-muted-foreground hover:text-foreground"
              title="Counts consecutive days with at least one completed qualifying task in your timezone."
            >
              <Info className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 shadow-sm">
                <Flame className="h-5 w-5 fill-current" />
              </span>
              <div>
                <div className="text-lg font-black tracking-tight text-foreground font-mono">
                  {momentumStats.currentStreak} {momentumStats.currentStreak === 1 ? 'day' : 'days'}
                </div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Current Streak
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-foreground font-mono flex items-center justify-end gap-1">
                <Trophy className="h-3 w-3 text-amber-400" />
                <span>{momentumStats.bestStreak} {momentumStats.bestStreak === 1 ? 'day' : 'days'}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Best Momentum
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-2">
          <span>{momentumStats.completedToday ? 'Completed work today' : 'No task completed yet today'}</span>
          <span className="font-semibold text-foreground">{momentumStats.qualifyingDaysCount} total days</span>
        </div>
      </div>
    </div>
  );
}

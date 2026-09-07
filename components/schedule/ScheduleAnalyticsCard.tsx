'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle2, 
  Briefcase, 
  GraduationCap, 
  Moon, 
  ShieldCheck 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatMinutes } from '@/lib/utils';

export function ScheduleAnalyticsCard() {
  const { scheduleWeeklyAnalytics } = useStore();

  return (
    <div className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 space-y-5 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Planned vs Actual Analytics (7-Day Rolling)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Objective calibration metrics to continuously refine daily capacity planning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold font-mono text-primary flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{scheduleWeeklyAnalytics.planningAccuracyPercent}% Planning Accuracy</span>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Planned Time */}
        <div className="rounded-2xl border border-border bg-background/50 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Planned Work
          </span>
          <div className="text-lg font-extrabold font-mono text-foreground">
            {formatMinutes(scheduleWeeklyAnalytics.totalPlannedMinutes)}
          </div>
        </div>

        {/* Actual Time */}
        <div className="rounded-2xl border border-border bg-background/50 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Actual Executed
          </span>
          <div className="text-lg font-extrabold font-mono text-foreground">
            {formatMinutes(scheduleWeeklyAnalytics.totalActualMinutes)}
          </div>
        </div>

        {/* Must-Wins Completed */}
        <div className="rounded-2xl border border-border bg-background/50 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Must-Wins Executed
          </span>
          <div className="text-lg font-extrabold font-mono text-amber-400">
            {scheduleWeeklyAnalytics.completedMustWinsCount} / 7 Days
          </div>
        </div>

        {/* Top Variance Cause */}
        <div className="rounded-2xl border border-border bg-background/50 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Top Delay Factor
          </span>
          <div className="text-sm font-bold text-foreground truncate mt-1">
            Meeting Overrun (~12m)
          </div>
        </div>
      </div>

      {/* Time Allocation Breakdown Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Actual Time Distribution</span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {formatMinutes(scheduleWeeklyAnalytics.totalActualMinutes)} total
          </span>
        </div>

        {/* Progress Multi-Bar */}
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex">
          <div 
            style={{ width: '25%' }} 
            className="h-full bg-primary" 
            title="Business / Ventures: 25%"
          />
          <div 
            style={{ width: '55%' }} 
            className="h-full bg-blue-500" 
            title="School & Teaching: 55%"
          />
          <div 
            style={{ width: '20%' }} 
            className="h-full bg-amber-500" 
            title="Rest & Buffer: 20%"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Business / Projects ({formatMinutes(scheduleWeeklyAnalytics.businessActualMinutes)})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>School &amp; Tuitions ({formatMinutes(scheduleWeeklyAnalytics.schoolTuitionActualMinutes)})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Rest &amp; Buffer ({formatMinutes(scheduleWeeklyAnalytics.restBufferMinutes)})</span>
          </span>
        </div>
      </div>
    </div>
  );
}

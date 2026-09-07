'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Star, 
  Calendar, 
  CheckCircle2, 
  Rocket 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatTime12Hour, getCurrentTimeString } from '@/lib/utils';
import { motion } from 'framer-motion';

export function SchedulePreviewWidget() {
  const { 
    currentDayScheduleEntries,
    currentScheduleBlock,
    nextScheduleBlock,
    todayCapacityMinutes,
    settings,
    setPlanTomorrowOpen,
    startScheduleBlock
  } = useStore();

  const currentTimeStr = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');

  return (
    <div className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 space-y-4 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Today&apos;s Execution Schedule
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              Live Time: {formatTime12Hour(currentTimeStr)} • {currentDayScheduleEntries.length} Scheduled Blocks
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlanTomorrowOpen(true)}
            className="hidden sm:flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Sparkles className="h-3 w-3" />
            <span>Plan Tomorrow</span>
          </button>

          <Link
            href="/schedule"
            className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <span>Open Schedule</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* NOW & UP NEXT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* NOW BLOCK */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>NOW / ACTIVE WINDOW</span>
            </span>
            {currentScheduleBlock && (
              <span className="font-mono text-xs font-bold text-foreground bg-background/80 px-2 py-0.5 rounded-lg border border-border">
                {currentScheduleBlock.plannedStartTime} – {currentScheduleBlock.plannedEndTime}
              </span>
            )}
          </div>

          {currentScheduleBlock ? (
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                {currentScheduleBlock.title}
                {currentScheduleBlock.isMustWin && (
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                )}
              </h4>
              <span className="text-[11px] text-muted-foreground font-medium">
                {currentScheduleBlock.activityType} • {currentScheduleBlock.plannedDurationMinutes} min
              </span>

              {currentScheduleBlock.status === 'PLANNED' && (
                <div className="pt-2">
                  <button
                    onClick={() => startScheduleBlock(currentScheduleBlock.id)}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>START NOW</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No active time block right now. Free buffer or transition period.
            </p>
          )}
        </div>

        {/* UP NEXT BLOCK */}
        <div className="rounded-2xl border border-border bg-background/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              UP NEXT
            </span>
            {nextScheduleBlock && (
              <span className="font-mono text-xs font-bold text-foreground bg-background/80 px-2 py-0.5 rounded-lg border border-border">
                {nextScheduleBlock.plannedStartTime} – {nextScheduleBlock.plannedEndTime}
              </span>
            )}
          </div>

          {nextScheduleBlock ? (
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                {nextScheduleBlock.title}
                {nextScheduleBlock.isMustWin && (
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                )}
              </h4>
              <span className="text-[11px] text-muted-foreground font-medium">
                {nextScheduleBlock.activityType} • {nextScheduleBlock.plannedDurationMinutes} min
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              All scheduled blocks for today are complete. Ready for Nightly Review!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

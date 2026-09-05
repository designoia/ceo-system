'use client';

import React from 'react';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { useStore } from '@/lib/store';

export function CapacityIndicator() {
  const { 
    todayPlannedMinutes, 
    settings, 
    todayTaskCount, 
    isCapacityOverloaded, 
    isTaskCountOverloaded, 
    isTaskCountSeverelyOverloaded 
  } = useStore();

  const capacity = settings.dailyWorkCapacityMinutes || 45;
  const capacityPercent = Math.min(Math.round((todayPlannedMinutes / capacity) * 100), 200);

  return (
    <div className="space-y-3">
      {/* 1. SEVERE TASK COUNT OVERLOAD WARNING (> 8 tasks) */}
      {isTaskCountSeverelyOverloaded && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-500 animate-in slide-in-from-top-2">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block">
              You have {todayTaskCount} tasks scheduled today.
            </span>
            <span>
              This is probably more than your available time. For high-leverage execution, prioritize 1 MUST-WIN and move the rest to This Week.
            </span>
          </div>
        </div>
      )}

      {/* 2. TASK COUNT WARNING (> 5 tasks) */}
      {!isTaskCountSeverelyOverloaded && isTaskCountOverloaded && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-500 animate-in slide-in-from-top-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold block">
              You have {todayTaskCount} tasks scheduled today.
            </span>
            <span>
              For a realistic day, consider moving some to This Week to preserve focus.
            </span>
          </div>
        </div>
      )}

      {/* 3. DAILY WORKLOAD CAPACITY BAR */}
      {todayTaskCount > 0 && isCapacityOverloaded && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>
              Planned: <strong className="text-foreground">{todayPlannedMinutes} min</strong> / Capacity: <strong className="text-foreground">{capacity} min</strong>
            </span>
          </div>

          <span className="text-[11px] font-semibold text-amber-500">
            ⚠️ You may be over-scheduled
          </span>
        </div>
      )}
    </div>
  );
}

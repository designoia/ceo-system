'use client';

import React from 'react';
import { Clock, Plus, Minus, BatteryCharging, Sparkles, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

export function TodayCapacityCard() {
  const {
    todayCapacityMinutes,
    capacitySource,
    energyLevel,
    dailyRecommendation,
    setTodayDifferentModalOpen,
    setTimeAdjustModalOpen,
    setLowEnergyMode,
  } = useStore();

  const planned = dailyRecommendation.totalPlannedMinutes;
  const available = todayCapacityMinutes;
  const isOver = planned > available;
  const percent = available > 0 ? Math.min(Math.round((planned / available) * 100), 100) : 0;
  const remainingMinutes = Math.max(0, available - planned);
  const overMinutes = Math.max(0, planned - available);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-border bg-card/60 p-5 sm:p-6 space-y-4 shadow-sm backdrop-blur-sm"
    >
      {/* Top Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
            isOver ? 'bg-amber-500/10 text-amber-500' :
            energyLevel === 'LOW' ? 'bg-indigo-500/10 text-indigo-400' :
            'bg-primary/10 text-primary'
          }`}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Today&apos;s Execution Capacity</h3>
              {capacitySource !== 'DEFAULT' && (
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {capacitySource === 'SCHEDULE_CALCULATED' ? 'Schedule Adjusted' :
                   capacitySource === 'EXTRA_TIME' ? '+Extra Time' :
                   capacitySource === 'REDUCED_TIME' ? 'Reduced' :
                   capacitySource === 'LOW_ENERGY' ? 'Low Energy' : 'Custom'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {available >= 180 ? 'Expanded project day' :
               available <= 20 ? 'Minimum rescue execution' :
               'Standard CEO execution window'}
            </p>
          </div>
        </div>

        {/* Capacity Stat Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-lg font-black tracking-tight text-foreground">
              {formatHoursMins(available)}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {formatHoursMins(planned)} planned
            </div>
          </div>
        </div>
      </div>

      {/* Progress Capacity Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary/80 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${
              isOver ? 'bg-amber-500' : 'bg-primary'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          {isOver ? (
            <span className="font-semibold text-amber-500 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{overMinutes} min over capacity — Consider moving secondary tasks to This Week</span>
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{remainingMinutes} min buffer available for rest or deep focus</span>
            </span>
          )}
          <span className="font-mono font-medium text-foreground">{percent}% used</span>
        </div>
      </div>

      {/* Fast Adaptive Action Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/60">
        <button
          onClick={() => setTodayDifferentModalOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/60 p-2 text-xs font-semibold text-foreground hover:bg-accent hover:border-primary/40 transition-all shadow-sm"
        >
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>Today is Different</span>
        </button>

        <button
          onClick={() => setTimeAdjustModalOpen(true, 'MORE')}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/60 p-2 text-xs font-semibold text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-500" />
          <span>+ More Time</span>
        </button>

        <button
          onClick={() => setTimeAdjustModalOpen(true, 'LESS')}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/60 p-2 text-xs font-semibold text-foreground hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-500 transition-all shadow-sm"
        >
          <Minus className="h-3.5 w-3.5 text-amber-500" />
          <span>- Less Time</span>
        </button>

        <button
          onClick={setLowEnergyMode}
          className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all shadow-sm ${
            energyLevel === 'LOW'
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
              : 'border-border/80 bg-background/60 text-foreground hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400'
          }`}
        >
          <BatteryCharging className="h-3.5 w-3.5 text-indigo-400" />
          <span>{energyLevel === 'LOW' ? 'Low Energy Active' : 'Low Energy'}</span>
        </button>
      </div>
    </motion.div>
  );
}

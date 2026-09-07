'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Star, 
  Calendar, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Moon, 
  Rocket, 
  Plus, 
  Check, 
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType } from '@/lib/types';
import { getTodayDateString, calculateMinutesBetween } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function PlanTomorrowModal() {
  const {
    isPlanTomorrowOpen,
    setPlanTomorrowOpen,
    settings,
    scheduleBlocks,
    tasks,
    mustWinTask,
    todayCapacityMinutes,
    saveTomorrowPlan
  } = useStore();

  // Compute tomorrow's date string & formatted label in user timezone
  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrowObj = new Date(y, m - 1, d + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const tomorrowDayOfWeek = tomorrowObj.getDay() === 0 ? 7 : tomorrowObj.getDay(); // 1 = Monday, 7 = Sunday
  const tomorrowFormatted = tomorrowObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Candidate tasks for MUST-WIN
  const candidateTasks = useMemo(() => {
    return tasks.filter(t => !t.isDeleted && t.status !== 'DONE' && !t.parentTaskId);
  }, [tasks]);

  const [selectedMustWinId, setSelectedMustWinId] = useState<string>(
    mustWinTask?.id || candidateTasks[0]?.id || ''
  );

  // Baseline schedule blocks for tomorrow
  const baselineBlocks = useMemo(() => {
    return scheduleBlocks.filter(b => b.daysOfWeek.includes(tomorrowDayOfWeek));
  }, [scheduleBlocks, tomorrowDayOfWeek]);

  // Editable items state for tomorrow
  const [items, setItems] = useState<Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    duration: number;
    activityType: ScheduleActivityType;
    isMustWin: boolean;
    taskId?: string;
    enabled: boolean;
  }>>(() => {
    return baselineBlocks.map(b => {
      let actType: ScheduleActivityType = 'OTHER';
      if (b.category === 'SCHOOL') actType = 'SCHOOL';
      else if (b.category === 'TUITION') actType = 'TUITION';
      else if (b.category === 'CLASSES') actType = 'CLASSES';
      else if (b.category === 'REST') actType = 'REST';
      else if (b.category === 'CEO_BLOCK') actType = 'DESIGNOIA';

      const dur = calculateMinutesBetween(b.startTime, b.endTime);
      return {
        id: `plan-item-${b.id}`,
        title: b.isCeoTime && mustWinTask ? mustWinTask.title : b.name,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: dur,
        activityType: actType,
        isMustWin: b.isCeoTime,
        taskId: b.isCeoTime && mustWinTask ? mustWinTask.id : undefined,
        enabled: true,
      };
    });
  });

  // Calculate project planned duration
  const plannedProjectMinutes = useMemo(() => {
    return items
      .filter(i => i.enabled && (i.isMustWin || ['DESIGNOIA', 'COL', 'CLIKIXPRESS', 'DEVELOPMENT', 'CONTENT', 'PLANNING'].includes(i.activityType)))
      .reduce((acc, i) => acc + i.duration, 0);
  }, [items]);

  const capacityMins = todayCapacityMinutes || settings.dailyWorkCapacityMinutes || 45;
  const isOverCapacity = plannedProjectMinutes > capacityMins;

  if (!isPlanTomorrowOpen) return null;

  const handleToggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const handleMustWinChange = (taskId: string) => {
    setSelectedMustWinId(taskId);
    const chosen = tasks.find(t => t.id === taskId);
    if (!chosen) return;

    setItems(prev => prev.map(item => {
      if (item.isMustWin) {
        return {
          ...item,
          title: chosen.title,
          taskId: chosen.id,
          activityType: (chosen.businessCode as ScheduleActivityType) || 'DESIGNOIA',
        };
      }
      return item;
    }));
  };

  const handleSavePlan = () => {
    const finalEntries: Omit<ScheduleEntry, 'id' | 'createdAt'>[] = items
      .filter(i => i.enabled)
      .map(i => {
        const linkedTask = i.taskId ? tasks.find(t => t.id === i.taskId) : null;
        return {
          date: tomorrowStr,
          plannedStartTime: i.startTime,
          plannedEndTime: i.endTime,
          plannedDurationMinutes: i.duration,
          title: i.title,
          description: i.isMustWin ? 'Primary MUST-WIN execution window' : undefined,
          activityType: i.activityType,
          businessCode: linkedTask?.businessCode,
          projectId: linkedTask?.projectId,
          taskId: i.taskId,
          status: 'PLANNED',
          isMustWin: i.isMustWin,
        };
      });

    saveTomorrowPlan(finalEntries);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  NIGHTLY PLANNING HABIT (5–15 MIN)
                </div>
                <h3 className="text-xl font-extrabold text-foreground">Plan Tomorrow</h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>{tomorrowFormatted}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setPlanTomorrowOpen(false)}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Capacity and Buffer Guidance Pill */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Recommended Focus Window:</span>
              <span className="font-bold text-foreground">
                {capacityMins} min capacity (Buffer: 70–85% realistic utilization)
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs ${
              isOverCapacity 
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              {plannedProjectMinutes}m / {capacityMins}m Planned
            </div>
          </div>

          {/* 1. PRIMARY MUST-WIN SELECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span>Tomorrow&apos;s Primary MUST-WIN Task</span>
              </span>
              <span className="text-[10px] text-muted-foreground normal-case font-normal">
                Single dominant business priority
              </span>
            </div>

            <select
              value={selectedMustWinId}
              onChange={(e) => handleMustWinChange(e.target.value)}
              className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-400 focus:outline-none"
            >
              {candidateTasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.businessCode}: {t.title} ({t.estimatedMinutes}m, {t.priority})
                </option>
              ))}
            </select>
          </div>

          {/* 2. TOMORROW'S PROPOSED TIME BLOCKS */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Proposed Execution Blocks</span>
              <span className="text-[10px] text-muted-foreground font-normal">Toggle or adjust times</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                    !item.enabled
                      ? 'border-border/40 bg-muted/10 opacity-50'
                      : item.isMustWin
                      ? 'border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20'
                      : 'border-border bg-card/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleToggleItem(item.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                        {item.isMustWin && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[9px] font-extrabold text-amber-400 uppercase">
                            MUST-WIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {item.activityType} • {item.duration} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-foreground bg-background/80 px-2.5 py-1 rounded-lg border border-border">
                      {item.startTime} – {item.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overcapacity Warning (if any) */}
          {isOverCapacity && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                Planning {plannedProjectMinutes}m exceeds your target capacity of {capacityMins}m. Consider protecting buffer to prevent fatigue.
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              onClick={() => setPlanTomorrowOpen(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>

            <button
              onClick={handleSavePlan}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-98"
            >
              <Check className="h-4 w-4" />
              <span>CREATE TOMORROW&apos;S PLAN</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

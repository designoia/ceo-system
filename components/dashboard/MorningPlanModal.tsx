'use client';

import React from 'react';
import { Sparkles, Check, ArrowRight, Target, Clock, Compass, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export function MorningPlanModal() {
  const {
    isMorningPlanOpen,
    setMorningPlanOpen,
    dailyRecommendation,
    todayCapacityMinutes,
    currentMonth,
    acceptDailyPlan,
    startFocus,
  } = useStore();

  if (!isMorningPlanOpen) return null;

  const { mustWinTask, mustWinReason, projectBreadcrumbs, nextTasks } = dailyRecommendation;

  const handleAcceptAndStart = () => {
    acceptDailyPlan();
    if (mustWinTask) {
      startFocus(mustWinTask, 'NORMAL');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-3xl border border-primary/20 bg-card p-6 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>30-SECOND MORNING BRIEFING</span>
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Good Morning 👋
              </h2>
            </div>

            <button
              onClick={() => setMorningPlanOpen(false)}
              className="rounded-xl p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Context Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-border/80 bg-background/60 p-3 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Available Capacity:</span>
              </span>
              <div className="text-sm font-bold text-foreground">
                {todayCapacityMinutes} minutes
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-background/60 p-3 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Monthly Focus:</span>
              </span>
              <div className="text-sm font-bold text-foreground truncate">
                {currentMonth?.focusTitle || 'System Execution'}
              </div>
            </div>
          </div>

          {/* Recommended MUST-WIN Card */}
          {mustWinTask ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  <span>RECOMMENDED MUST-WIN</span>
                </span>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {mustWinReason}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {projectBreadcrumbs[mustWinTask.id] || mustWinTask.businessCode}
                </div>
                <h4 className="text-base font-bold text-foreground mt-0.5">
                  {mustWinTask.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span>⏱️ {mustWinTask.estimatedMinutes || 45} min</span>
                <span>• Priority: {mustWinTask.priority}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background/60 p-4 text-center text-xs text-muted-foreground">
              All primary priorities are clear! Add or review tasks from your projects.
            </div>
          )}

          {/* Secondary Tasks Preview */}
          {nextTasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Queued if time permits:
              </div>
              <div className="space-y-1 text-xs">
                {nextTasks.slice(0, 2).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-xl bg-background/40 border border-border/60">
                    <span className="truncate text-foreground font-medium">{task.title}</span>
                    <span className="text-muted-foreground font-mono text-[10px] shrink-0 ml-2">{task.estimatedMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMorningPlanOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Adjust Plan
            </button>

            <button
              type="button"
              onClick={handleAcceptAndStart}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-md transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Accept & Start Day</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

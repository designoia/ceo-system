'use client';

import React, { useState } from 'react';
import { 
  Target, 
  Play, 
  Zap, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatMinutes } from '@/lib/utils';
import { Task } from '@/lib/types';

export function MustWinCard() {
  const { 
    mustWinTask, 
    tasks, 
    projects, 
    businesses, 
    startFocus, 
    setMustWin, 
    completeTask,
    setQuickAddOpen
  } = useStore();

  const [isChanging, setIsChanging] = useState(false);

  // Available alternative tasks for Must-Win selection
  const alternativeTasks = tasks.filter(
    (t) => t.status !== 'DONE' && (!mustWinTask || t.id !== mustWinTask.id)
  );

  const project = projects.find((p) => p.id === mustWinTask?.projectId);
  const business = businesses.find((b) => b.code === mustWinTask?.businessCode);

  if (!mustWinTask) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <Target className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No Must-Win Selected Today</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Choose the single most important action to move your businesses forward today.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {alternativeTasks.slice(0, 3).map((task) => (
            <button
              key={task.id}
              onClick={() => setMustWin(task.id)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {task.title}
            </button>
          ))}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Must-Win
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-card via-card to-card/90 p-6 sm:p-8 shadow-xl ceo-card-glow">
      {/* Decorative Accent Glow */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary tracking-wide">
            <Target className="h-3.5 w-3.5" />
            TODAY'S MUST-WIN
          </span>

          {business && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: `${business.color}18`,
                color: business.color,
              }}
            >
              {business.code}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChanging(!isChanging)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Change</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Change Dropdown */}
      {isChanging && (
        <div className="my-3 rounded-xl border border-border bg-background p-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Select Alternate Must-Win:
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {alternativeTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  setMustWin(task.id);
                  setIsChanging(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-accent transition-colors"
              >
                <span className="font-medium truncate">{task.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {task.businessCode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Task Information */}
      <div className="my-5">
        {project && (
          <div className="text-xs font-semibold uppercase tracking-widest text-primary/90 mb-1">
            {project.name}
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
          &ldquo;{mustWinTask.title}&rdquo;
        </h2>

        {mustWinTask.notes && (
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {mustWinTask.notes}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span>Estimated: {formatMinutes(mustWinTask.estimatedMinutes || 45)}</span>
          </div>
          {mustWinTask.scheduledTime && (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Target: {mustWinTask.scheduledTime} (CEO Block)</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Primary START Button */}
        <button
          id="must-win-start-btn"
          onClick={() => startFocus(mustWinTask, 'NORMAL')}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>START (45 MIN)</span>
        </button>

        {/* 10-Minute Rescue Mode */}
        <button
          onClick={() => startFocus(mustWinTask, 'RESCUE_10MIN')}
          title="Tired or limited time? Execute a meaningful 10-minute micro-action."
          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition-all"
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>10-MIN RESCUE</span>
        </button>

        {/* Quick Complete */}
        <button
          onClick={() => completeTask(mustWinTask.id, mustWinTask.estimatedMinutes)}
          title="Mark complete directly"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3.5 text-xs font-semibold text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="hidden sm:inline">DONE</span>
        </button>
      </div>
    </div>
  );
}

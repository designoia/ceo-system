'use client';

import React from 'react';
import { Circle, Play, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';

export function OptionalTasksList() {
  const { optionalTasks, dailyRecommendation, startFocus, completeTask, setMustWin } = useStore();
  const nextTasks = dailyRecommendation.nextTasks;
  const projectBreadcrumbs = dailyRecommendation.projectBreadcrumbs;

  const displayTasks = nextTasks.length > 0 ? nextTasks : optionalTasks;
  if (displayTasks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {nextTasks.length > 0 ? `NEXT IN QUEUE (${nextTasks.length})` : 'OPTIONAL TASKS'}
        </h3>
        <span className="text-[11px] text-muted-foreground">Fits within available daily capacity</span>
      </div>

      <div className="space-y-2.5">
        {displayTasks.map((task: Task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between rounded-xl border border-border/70 bg-background/50 px-3.5 py-2.5 transition-all hover:border-border hover:bg-background"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => completeTask(task.id, task.estimatedMinutes)}
                title="Mark Done"
                className="text-muted-foreground hover:text-emerald-500 transition-colors shrink-0"
              >
                <Circle className="h-4 w-4" />
              </button>

              <div className="truncate">
                <span className="text-xs font-medium text-foreground block truncate">
                  {task.title}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {projectBreadcrumbs[task.id] || task.businessCode} • {task.estimatedMinutes}m • {task.priority}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => setMustWin(task.id)}
                title="Promote to MUST-WIN"
                className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Make Must-Win
              </button>

              <button
                onClick={() => startFocus(task, 'NORMAL')}
                title="Start Focused Session"
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Start</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

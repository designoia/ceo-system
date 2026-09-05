'use client';

import React from 'react';
import { AlertCircle, Clock, X, Check, Calendar, Layers, Archive, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { calculateDaysOverdue, getTodayDateString } from '@/lib/utils';
import { Task } from '@/lib/types';

export function OverdueReviewModal() {
  const { 
    isOverdueReviewOpen, 
    setOverdueReviewOpen, 
    overdueTasks, 
    resolveOverdueTask, 
    settings,
    projects 
  } = useStore();

  if (!isOverdueReviewOpen || overdueTasks.length === 0) return null;

  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-foreground">Overdue Task Review</h2>
              <p className="text-[11px] text-muted-foreground">
                No problem. Decide where each item should land next.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOverdueReviewOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Overdue Task List */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {overdueTasks.map((task: Task) => {
            const daysOverdue = calculateDaysOverdue(task.scheduledDate, todayStr);
            const project = projects.find(p => p.id === task.projectId);

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {project && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        {project.name}
                      </span>
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                      {task.title}
                    </h4>
                  </div>

                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                    {daysOverdue} {daysOverdue === 1 ? 'day overdue' : 'days overdue'}
                  </span>
                </div>

                {task.notes && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {task.notes}
                  </p>
                )}

                {/* Triage Actions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-semibold">
                  <button
                    onClick={() => resolveOverdueTask(task.id, 'TODAY')}
                    className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <span>Do Today</span>
                  </button>

                  <button
                    onClick={() => resolveOverdueTask(task.id, 'THIS_WEEK')}
                    className="flex items-center gap-1 rounded-lg border border-border bg-accent px-2.5 py-1 text-foreground hover:bg-accent/80 transition-colors"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>This Week</span>
                  </button>

                  <button
                    onClick={() => resolveOverdueTask(task.id, 'NEXT')}
                    className="flex items-center gap-1 rounded-lg border border-border bg-accent/60 px-2.5 py-1 text-foreground hover:bg-accent transition-colors"
                  >
                    <Layers className="h-3 w-3" />
                    <span>Next</span>
                  </button>

                  <button
                    onClick={() => resolveOverdueTask(task.id, 'BACKLOG')}
                    className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Archive className="h-3 w-3" />
                    <span>Backlog</span>
                  </button>

                  <button
                    onClick={() => resolveOverdueTask(task.id, 'DELETED')}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-auto"
                    title="Cancel Task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            Tasks can also be triaged from the Tasks page.
          </span>

          <button
            onClick={() => setOverdueReviewOpen(false)}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Review Later
          </button>
        </div>
      </div>
    </div>
  );
}

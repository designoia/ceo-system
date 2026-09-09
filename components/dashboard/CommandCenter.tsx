'use client';

import React from 'react';
import Link from 'next/link';
import { Target, AlertCircle, Clock, Inbox, Layers, ArrowUpRight, CheckCircle2, Circle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getTodayDateString, formatMinutes } from '@/lib/utils';
import { Task } from '@/lib/types';

function TaskLine({ task, projectName, onOpen }: { task: Task; projectName?: string; onOpen: (t: Task) => void }) {
  return (
    <button
      onClick={() => onOpen(task)}
      className="w-full flex items-center gap-2.5 py-1.5 text-left hover:bg-secondary/50 -mx-2 px-2 rounded-md transition-colors group"
    >
      {task.status === 'DONE' ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
      )}
      <span className={`text-[13px] truncate flex-1 ${task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {task.title}
      </span>
      {projectName && <span className="text-[10px] text-muted-foreground/70 shrink-0 hidden sm:inline">{projectName}</span>}
      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{formatMinutes(task.estimatedMinutes)}</span>
    </button>
  );
}

export function CommandCenter({ onOpenTask }: { onOpenTask: (t: Task) => void }) {
  const { tasks, projects, scheduleEntries, todayCapacityMinutes, settings, getProjectProgress } = useStore();

  const today = getTodayDateString(settings.timezone || 'Asia/Kolkata');

  const active = tasks.filter((t) => !t.isDeleted && !t.parentTaskId);
  const todayTasks = active.filter((t) => t.status === 'TODAY');
  const overdueTasks = active.filter((t) => t.status === 'OVERDUE');
  const upcomingTasks = active.filter((t) => t.status === 'NEXT' || t.status === 'THIS_WEEK').slice(0, 6);
  const unscheduledTasks = active.filter(
    (t) => (t.status === 'TODAY' || t.status === 'INBOX') && !t.scheduledDate
  );
  const todaysSchedule = scheduleEntries.filter((e) => e.date === today && e.status !== 'CANCELLED');

  const workloadMinutes = todayTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 45), 0);
  const overCapacity = workloadMinutes > todayCapacityMinutes;

  const mustWin = todayTasks.find((t) => t.isMustWin);
  const focusProject = mustWin?.projectId
    ? projects.find((p) => p.id === mustWin.projectId)
    : projects.find((p) => p.status === 'ACTIVE');

  const projectName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name : undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Today + Overdue + Unscheduled */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-lg border border-border surface-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              <span>Today ({todayTasks.length})</span>
            </div>
            <span className={`text-[11px] font-mono ${overCapacity ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {formatMinutes(workloadMinutes)} / {formatMinutes(todayCapacityMinutes)}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${overCapacity ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (workloadMinutes / Math.max(1, todayCapacityMinutes)) * 100)}%` }}
            />
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-2">Nothing planned for today yet.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {todayTasks.map((t) => (
                <TaskLine key={t.id} task={t} projectName={projectName(t.projectId)} onOpen={onOpenTask} />
              ))}
            </div>
          )}
        </div>

        {overdueTasks.length > 0 && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500 mb-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Overdue ({overdueTasks.length})</span>
            </div>
            <div className="divide-y divide-amber-500/10">
              {overdueTasks.map((t) => (
                <TaskLine key={t.id} task={t} projectName={projectName(t.projectId)} onOpen={onOpenTask} />
              ))}
            </div>
          </div>
        )}

        {unscheduledTasks.length > 0 && (
          <div className="rounded-lg border border-border surface-1 p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              <Inbox className="h-3.5 w-3.5" />
              <span>Unscheduled ({unscheduledTasks.length})</span>
            </div>
            <div className="divide-y divide-border/50">
              {unscheduledTasks.map((t) => (
                <TaskLine key={t.id} task={t} projectName={projectName(t.projectId)} onOpen={onOpenTask} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Focus project, scheduled, upcoming */}
      <div className="space-y-4">
        {focusProject && (
          <div className="rounded-lg border border-border surface-1 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Current Focus</div>
            <Link href="/projects" className="flex items-center justify-between group">
              <span className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">
                {focusProject.name}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <div className="h-1 w-full rounded-full bg-secondary overflow-hidden mt-2">
              <div className="h-full rounded-full bg-primary" style={{ width: `${getProjectProgress(focusProject.id)}%` }} />
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border surface-1 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Scheduled Today ({todaysSchedule.length})</span>
          </div>
          {todaysSchedule.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-1">No fixed commitments today.</p>
          ) : (
            <div className="space-y-1.5">
              {todaysSchedule
                .sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime))
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-[12px]">
                    <span className="font-mono text-[10px] text-muted-foreground w-10 shrink-0">{e.plannedStartTime}</span>
                    <span className="truncate text-foreground/90">{e.title}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {upcomingTasks.length > 0 && (
          <div className="rounded-lg border border-border surface-1 p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              <Layers className="h-3.5 w-3.5" />
              <span>Upcoming</span>
            </div>
            <div className="divide-y divide-border/50">
              {upcomingTasks.map((t) => (
                <TaskLine key={t.id} task={t} projectName={projectName(t.projectId)} onOpen={onOpenTask} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

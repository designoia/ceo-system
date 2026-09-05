'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Play, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreHorizontal, 
  Trash2,
  Inbox,
  Calendar,
  Layers
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority, BusinessCode } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';

const STATUS_COLUMNS: { key: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'TODAY', label: 'Today', icon: Target },
  { key: 'THIS_WEEK', label: 'This Week', icon: Calendar },
  { key: 'NEXT', label: 'Next Up', icon: Layers },
  { key: 'INBOX', label: 'Inbox', icon: Inbox },
  { key: 'BLOCKED', label: 'Blocked', icon: AlertCircle },
  { key: 'BACKLOG', label: 'Backlog', icon: Clock },
  { key: 'DONE', label: 'Done', icon: CheckCircle2 },
];

export default function TasksPage() {
  const { 
    tasks, 
    projects, 
    businesses, 
    updateTaskStatus, 
    setMustWin, 
    startFocus, 
    completeTask, 
    deleteTask,
    setQuickAddOpen 
  } = useStore();

  const [activeTab, setActiveTab] = useState<TaskStatus | 'ALL'>('TODAY');
  const [filterBusiness, setFilterBusiness] = useState<BusinessCode | 'ALL'>('ALL');

  const filteredTasks = tasks.filter((t) => {
    const matchesTab = activeTab === 'ALL' ? true : t.status === activeTab;
    const matchesBiz = filterBusiness === 'ALL' ? true : t.businessCode === filterBusiness;
    return matchesTab && matchesBiz;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            EXECUTION PIPELINE
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tasks Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Concrete actions moving your projects forward. Keep today's workload realistic.
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs & Business Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_COLUMNS.map((col) => {
            const count = tasks.filter((t) => t.status === col.key).length;
            const Icon = col.icon;
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === col.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{col.label}</span>
                <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Business Filter */}
        <select
          value={filterBusiness}
          onChange={(e) => setFilterBusiness(e.target.value as BusinessCode | 'ALL')}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none self-start md:self-auto"
        >
          <option value="ALL">All Focus Areas</option>
          {businesses.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            <p className="text-xs text-muted-foreground">
              No tasks in &ldquo;{activeTab}&rdquo; view.
            </p>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              + Quick Add New Task
            </button>
          </div>
        ) : (
          filteredTasks.map((task: Task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const biz = businesses.find((b) => b.code === task.businessCode);

            return (
              <div
                key={task.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                  task.isMustWin
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm'
                    : task.status === 'DONE'
                    ? 'border-border/50 bg-card/30 opacity-70'
                    : 'border-border bg-card/60 hover:border-border/90 hover:bg-card'
                }`}
              >
                {/* Left Task Content */}
                <div className="flex items-start gap-3 overflow-hidden">
                  <button
                    onClick={() => {
                      if (task.status === 'DONE') {
                        updateTaskStatus(task.id, 'TODAY');
                      } else {
                        completeTask(task.id, task.estimatedMinutes);
                      }
                    }}
                    title={task.status === 'DONE' ? 'Reopen' : 'Mark Done'}
                    className={`mt-0.5 shrink-0 ${
                      task.status === 'DONE'
                        ? 'text-emerald-500'
                        : 'text-muted-foreground hover:text-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {task.code}
                      </span>

                      {task.isMustWin && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.2 text-[10px] font-bold text-primary">
                          🎯 MUST-WIN
                        </span>
                      )}

                      {biz && (
                        <span
                          className="rounded-md px-1.5 py-0.2 text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${biz.color}18`,
                            color: biz.color,
                          }}
                        >
                          {biz.code}
                        </span>
                      )}

                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          task.priority === 'P1'
                            ? 'bg-rose-500/10 text-rose-500'
                            : task.priority === 'P2'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {project && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          • {project.name}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold text-foreground ${
                        task.status === 'DONE' ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {task.notes}
                      </p>
                    )}

                    {task.blockReason && task.status === 'BLOCKED' && (
                      <div className="rounded-lg bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                        <span className="font-semibold">Blocker:</span> {task.blockReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono mr-2">
                    <Clock className="h-3 w-3" />
                    <span>{formatMinutes(task.estimatedMinutes)}</span>
                  </div>

                  {task.status !== 'DONE' && (
                    <>
                      {!task.isMustWin && (
                        <button
                          onClick={() => setMustWin(task.id)}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          title="Set as Today's MUST-WIN"
                        >
                          Must-Win
                        </button>
                      )}

                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none"
                      >
                        <option value="TODAY">Today</option>
                        <option value="THIS_WEEK">This Week</option>
                        <option value="NEXT">Next</option>
                        <option value="INBOX">Inbox</option>
                        <option value="BACKLOG">Backlog</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="DONE">Done</option>
                      </select>

                      <button
                        onClick={() => startFocus(task, 'NORMAL')}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Start</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

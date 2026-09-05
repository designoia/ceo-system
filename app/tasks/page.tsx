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
  Trash2,
  Inbox,
  Calendar,
  Layers,
  ListTodo,
  Undo2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTaskLifecycle } from '@/lib/hooks/useTaskLifecycle';
import { Task, TaskStatus, BusinessCode } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';
import { PageTransition } from '@/components/motion/PageTransition';
import { AnimatedCheckmark } from '@/components/motion/AnimatedCheckmark';
import { RestoreTaskModal } from '@/components/tasks/RestoreTaskModal';
import { DeleteConfirmationModal } from '@/components/tasks/DeleteConfirmationModal';
import { TrashModal } from '@/components/tasks/TrashModal';
import { MilestoneCelebration } from '@/components/feedback/MilestoneCelebration';

const STATUS_COLUMNS: { key: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'TODAY', label: 'Today', icon: Target },
  { key: 'OVERDUE', label: 'Overdue', icon: AlertCircle },
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
    deletedTasks,
    projects, 
    businesses, 
    updateTaskStatus, 
    setMustWin, 
    startFocus, 
    completeTask, 
    undoTaskCompletion,
    addSubtask,
    getSubtasks,
    getSubtaskProgress,
    setQuickAddOpen 
  } = useStore();

  const [activeTab, setActiveTab] = useState<TaskStatus | 'ALL'>('TODAY');
  const [filterBusiness, setFilterBusiness] = useState<BusinessCode | 'ALL'>('ALL');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<{ [taskId: string]: string }>({});

  // Modals state
  const [taskToRestore, setTaskToRestore] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleAddSubtask = (parentTaskId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitle[parentTaskId];
    if (!title || !title.trim()) return;

    addSubtask(parentTaskId, title.trim());
    setNewSubtaskTitle(prev => ({ ...prev, [parentTaskId]: '' }));
    setExpandedTaskIds(prev => new Set(prev).add(parentTaskId));
  };

  const filteredTasks = tasks.filter((t) => {
    if (t.isDeleted) return false;
    if (t.parentTaskId) return false; // Subtasks are shown under parents
    const matchesTab = activeTab === 'ALL' ? true : t.status === activeTab;
    const matchesBiz = filterBusiness === 'ALL' ? true : t.businessCode === filterBusiness;
    return matchesTab && matchesBiz;
  });

  return (
    <PageTransition className="space-y-6">
      {/* Milestone Celebration Modal */}
      <MilestoneCelebration />

      {/* Restore Task Modal */}
      <RestoreTaskModal
        task={taskToRestore}
        isOpen={!!taskToRestore}
        onClose={() => setTaskToRestore(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        task={taskToDelete}
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
      />

      {/* Trash / Soft-Deleted Tasks Modal */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {deletedTasks.length > 0 && (
            <button
              onClick={() => setIsTrashOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-colors min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <span>Trash ({deletedTasks.length})</span>
            </button>
          )}

          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Business Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_COLUMNS.map((col) => {
            const count = tasks.filter((t) => !t.isDeleted && t.status === col.key && !t.parentTaskId).length;
            const Icon = col.icon;
            const isOverdueTab = col.key === 'OVERDUE';
            const isDoneTab = col.key === 'DONE';

            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all min-h-[40px] ${
                  activeTab === col.key
                    ? isOverdueTab 
                      ? 'bg-amber-500 text-black shadow-sm'
                      : isDoneTab
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{col.label}</span>
                <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  isOverdueTab && count > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-background/20'
                }`}>
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
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none self-start md:self-auto min-h-[40px]"
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
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
            <p className="text-xs text-muted-foreground">
              {activeTab === 'DONE' 
                ? 'No completed tasks recorded yet.' 
                : activeTab === 'OVERDUE'
                ? "You're clear! No overdue tasks."
                : `No tasks in “${activeTab}” view.`}
            </p>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline min-h-[44px]"
            >
              + Quick Add New Task
            </button>
          </div>
        ) : (
          filteredTasks.map((task: Task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const biz = businesses.find((b) => b.code === task.businessCode);
            const subtasks = getSubtasks(task.id);
            const subProgress = getSubtaskProgress(task.id);
            const isExpanded = expandedTaskIds.has(task.id);
            const isDone = task.status === 'DONE';

            return (
              <div
                key={task.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all ${
                  task.isMustWin
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm'
                    : task.status === 'OVERDUE'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : isDone
                    ? 'border-border/50 bg-card/40'
                    : 'border-border bg-card/60 hover:border-border/90 hover:bg-card'
                }`}
              >
                {/* Main Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Task Content */}
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="mt-0.5 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
                      <AnimatedCheckmark
                        checked={isDone}
                        size={22}
                        onToggle={() => {
                          if (isDone) {
                            setTaskToRestore(task);
                          } else {
                            completeTask(task.id, task.estimatedMinutes);
                          }
                        }}
                      />
                    </div>

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

                        {task.status === 'OVERDUE' && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-bold text-amber-500">
                            ⚠️ OVERDUE
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
                          isDone ? 'line-through text-muted-foreground' : ''
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

                    {/* If Task is DONE: Dedicated UNDO COMPLETION & RESTORE Actions */}
                    {isDone ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => undoTaskCompletion(task.id)}
                          className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors min-h-[44px]"
                          title="Undo completion and restore to previous status"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          <span>Undo Completion</span>
                        </button>

                        <button
                          onClick={() => setTaskToRestore(task)}
                          className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors min-h-[44px]"
                          title="Restore to a specific list"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore...</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {!task.isMustWin && (
                          <button
                            onClick={() => setMustWin(task.id)}
                            className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] flex items-center"
                            title="Set as Today's MUST-WIN"
                          >
                            Must-Win
                          </button>
                        )}

                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                          className="rounded-lg border border-border bg-background px-2 py-2 text-[11px] text-foreground focus:outline-none min-h-[44px]"
                        >
                          <option value="TODAY">Today</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="THIS_WEEK">This Week</option>
                          <option value="NEXT">Next</option>
                          <option value="INBOX">Inbox</option>
                          <option value="BACKLOG">Backlog</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="DONE">Done</option>
                        </select>

                        <button
                          onClick={() => startFocus(task, 'NORMAL')}
                          className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Start</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => toggleExpand(task.id)}
                      className="p-2 text-muted-foreground hover:text-foreground rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Subtasks"
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Move to Trash"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Section */}
                {(subtasks.length > 0 || isExpanded) && (
                  <div className="pt-2 border-t border-border/60 pl-6 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Subtasks: {subProgress.done}/{subProgress.total} complete</span>
                      <span className="font-mono">{subProgress.percent}%</span>
                    </div>

                    <div className="space-y-1.5">
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-xl bg-background/60 px-3 py-2 border border-border text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateTaskStatus(sub.id, sub.status === 'DONE' ? 'TODAY' : 'DONE')}
                              className={`min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 ${
                                sub.status === 'DONE' ? 'text-emerald-500' : 'text-muted-foreground'
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <span className={sub.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}>
                              {sub.title}
                            </span>
                          </div>

                          <button
                            onClick={() => setTaskToDelete(sub)}
                            className="p-2 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Inline add subtask */}
                    <form
                      onSubmit={(e) => handleAddSubtask(task.id, e)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        value={newSubtaskTitle[task.id] || ''}
                        onChange={(e) => setNewSubtaskTitle(prev => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="+ Add micro-step subtask..."
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px]"
                      />
                      <button
                        type="submit"
                        disabled={!newSubtaskTitle[task.id]?.trim()}
                        className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 disabled:opacity-50 min-h-[44px]"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageTransition>
  );
}

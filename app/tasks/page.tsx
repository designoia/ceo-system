'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Target,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Inbox,
  Calendar,
  Layers,
  Clock,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTaskLifecycle } from '@/lib/hooks/useTaskLifecycle';
import { Task, TaskStatus, BusinessCode } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { RestoreTaskModal } from '@/components/tasks/RestoreTaskModal';
import { DeleteConfirmationModal } from '@/components/tasks/DeleteConfirmationModal';
import { TrashModal } from '@/components/tasks/TrashModal';

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
    completeTask,
    undoTaskCompletion,
    openScheduleModal,
    getSubtaskProgress,
    setQuickAddOpen,
  } = useStore();

  const { deleteWithUndo } = useTaskLifecycle();

  const [activeTab, setActiveTab] = useState<TaskStatus | 'ALL'>('TODAY');
  const [filterBusiness, setFilterBusiness] = useState<BusinessCode | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'TIME' | 'CREATED'>('PRIORITY');
  const [openTask, setOpenTask] = useState<Task | null>(null);

  const [taskToRestore, setTaskToRestore] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const filteredTasks = tasks
    .filter((t) => {
      if (t.isDeleted) return false;
      if (t.parentTaskId) return false;
      const matchesTab = activeTab === 'ALL' ? true : t.status === activeTab;
      const matchesBiz = filterBusiness === 'ALL' ? true : t.businessCode === filterBusiness;
      return matchesTab && matchesBiz;
    })
    .sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        const pOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
        return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
      }
      if (sortBy === 'TIME') {
        return (a.estimatedMinutes || 45) - (b.estimatedMinutes || 45);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <PageTransition className="space-y-6">
      <RestoreTaskModal
        task={taskToRestore}
        isOpen={!!taskToRestore}
        onClose={() => setTaskToRestore(null)}
      />

      <DeleteConfirmationModal
        task={taskToDelete}
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirmSuccess={() => {
          if (taskToDelete) deleteWithUndo(taskToDelete);
        }}
      />

      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />

      <TaskDrawer
        task={openTask}
        onClose={() => setOpenTask(null)}
        onSchedule={(t) => openScheduleModal(t)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Execution Pipeline
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Tasks</h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {deletedTasks.length > 0 && (
            <button
              onClick={() => setIsTrashOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Trash ({deletedTasks.length})</span>
            </button>
          )}

          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_COLUMNS.map((col) => {
            const count = tasks.filter((t) => !t.isDeleted && t.status === col.key && !t.parentTaskId).length;
            const Icon = col.icon;
            const isActive = activeTab === col.key;

            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{col.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value as BusinessCode | 'ALL')}
            className="rounded-md border border-border bg-transparent px-2.5 py-1 text-[11px] text-muted-foreground focus:outline-none"
          >
            <option value="ALL">All Focus Areas</option>
            {businesses.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'PRIORITY' | 'TIME' | 'CREATED')}
            className="rounded-md border border-border bg-transparent px-2.5 py-1 text-[11px] text-muted-foreground focus:outline-none"
          >
            <option value="PRIORITY">Priority</option>
            <option value="TIME">Duration</option>
            <option value="CREATED">Newest</option>
          </select>
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-dashed border-border p-10 text-center"
        >
          <CheckSquare className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-40" />
          <h4 className="text-sm font-semibold text-foreground">
            {activeTab === 'DONE'
              ? 'No completed tasks yet'
              : activeTab === 'OVERDUE'
              ? "You're clear — no overdue tasks"
              : `Nothing in "${activeTab}"`}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === 'TODAY'
              ? 'Plan 1-3 meaningful tasks for today to build continuous momentum.'
              : 'Add concrete actions to keep your projects moving forward.'}
          </p>
          <button
            onClick={() => setQuickAddOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/25 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Quick Add</span>
          </button>
        </motion.div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const biz = businesses.find((b) => b.code === task.businessCode);
              const subProgress = getSubtaskProgress(task.id);

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <TaskRow
                    task={task}
                    project={project}
                    business={biz}
                    subtaskProgress={subProgress}
                    onOpen={(t) => setOpenTask(t)}
                    onToggleComplete={(t) =>
                      t.status === 'DONE' ? undoTaskCompletion(t.id) : completeTask(t.id, t.estimatedMinutes)
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageTransition>
  );
}

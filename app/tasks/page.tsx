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
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTaskLifecycle } from '@/lib/hooks/useTaskLifecycle';
import { Task, TaskStatus, BusinessCode } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { AnimatedTaskCard } from '@/components/tasks/AnimatedTaskCard';
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

  const { completeWithUndo, deleteWithUndo } = useTaskLifecycle();

  const [activeTab, setActiveTab] = useState<TaskStatus | 'ALL'>('TODAY');
  const [filterBusiness, setFilterBusiness] = useState<BusinessCode | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'TIME' | 'CREATED'>('PRIORITY');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

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

  const handleAddSubtask = (parentTaskId: string, title: string) => {
    addSubtask(parentTaskId, title);
    setExpandedTaskIds(prev => new Set(prev).add(parentTaskId));
  };

  const filteredTasks = tasks
    .filter((t) => {
      if (t.isDeleted) return false;
      if (t.parentTaskId) return false; // Subtasks are shown under parents
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
        onConfirmSuccess={() => {
          if (taskToDelete) {
            deleteWithUndo(taskToDelete);
          }
        }}
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
            Concrete actions moving your projects forward. Keep today&apos;s workload realistic.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {deletedTasks.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsTrashOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-colors min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <span>Trash ({deletedTasks.length})</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </motion.button>
        </div>
      </div>

      {/* Filter Tabs, Business Filter & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_COLUMNS.map((col) => {
            const count = tasks.filter((t) => !t.isDeleted && t.status === col.key && !t.parentTaskId).length;
            const Icon = col.icon;
            const isOverdueTab = col.key === 'OVERDUE';
            const isDoneTab = col.key === 'DONE';
            const isActive = activeTab === col.key;

            return (
              <motion.button
                key={col.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(col.key)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all min-h-[40px] ${
                  isActive
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
              </motion.button>
            );
          })}
        </div>

        {/* Business & Sort Filters */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value as BusinessCode | 'ALL')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none min-h-[40px]"
          >
            <option value="ALL">All Focus Areas</option>
            {businesses.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'PRIORITY' | 'TIME' | 'CREATED')}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none min-h-[40px]"
          >
            <option value="PRIORITY">Sort: Priority</option>
            <option value="TIME">Sort: Duration</option>
            <option value="CREATED">Sort: Newest</option>
          </select>
        </div>
      </div>

      {/* Animated Tasks List */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center"
            >
              <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <h4 className="text-sm font-bold text-foreground">
                {activeTab === 'DONE' 
                  ? 'No completed tasks yet' 
                  : activeTab === 'OVERDUE'
                  ? 'You’re clear! No overdue tasks'
                  : `Nothing in “${activeTab}” view`}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {activeTab === 'TODAY' 
                  ? 'Plan 1–3 meaningful tasks for today to build continuous momentum.'
                  : 'Add concrete actions to keep your projects moving forward.'}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setQuickAddOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all min-h-[44px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Quick Add New Task</span>
              </motion.button>
            </motion.div>
          ) : (
            filteredTasks.map((task: Task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const biz = businesses.find((b) => b.code === task.businessCode);
              const subtasks = getSubtasks(task.id);
              const subProgress = getSubtaskProgress(task.id);
              const isExpanded = expandedTaskIds.has(task.id);

              return (
                <AnimatedTaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  business={biz}
                  subtasks={subtasks}
                  subProgress={subProgress}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleExpand(task.id)}
                  onComplete={(id) => completeWithUndo(id, task.estimatedMinutes)}
                  onUndoCompletion={(id) => undoTaskCompletion(id)}
                  onOpenRestoreModal={(t) => setTaskToRestore(t)}
                  onOpenDeleteModal={(t) => setTaskToDelete(t)}
                  onStartFocus={(t) => startFocus(t, 'NORMAL')}
                  onSetMustWin={(id) => setMustWin(id)}
                  onUpdateStatus={(id, status) => updateTaskStatus(id, status)}
                  onAddSubtask={handleAddSubtask}
                />
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </PageTransition>
  );
}

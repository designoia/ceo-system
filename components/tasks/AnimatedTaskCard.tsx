'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Target, 
  Clock, 
  Trash2, 
  ListTodo, 
  Undo2, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2,
  Check
} from 'lucide-react';
import { Task, TaskStatus, BusinessCode, Project, Business } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';
import { AnimatedCheckmark } from '@/components/motion/AnimatedCheckmark';
import { VARIANTS, MOTION_EASINGS } from '@/lib/motion';

interface AnimatedTaskCardProps {
  task: Task;
  project?: Project;
  business?: Business;
  subtasks: Task[];
  subProgress: { total: number; done: number; percent: number };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: (taskId: string) => void;
  onUndoCompletion: (taskId: string) => void;
  onOpenRestoreModal: (task: Task) => void;
  onOpenDeleteModal: (task: Task) => void;
  onStartFocus: (task: Task) => void;
  onSetMustWin: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onAddSubtask: (parentTaskId: string, title: string) => void;
}

export function AnimatedTaskCard({
  task,
  project,
  business,
  subtasks,
  subProgress,
  isExpanded,
  onToggleExpand,
  onComplete,
  onUndoCompletion,
  onOpenRestoreModal,
  onOpenDeleteModal,
  onStartFocus,
  onSetMustWin,
  onUpdateStatus,
  onAddSubtask,
}: AnimatedTaskCardProps) {
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isCompletingLocal, setIsCompletingLocal] = useState(false);
  const isDone = task.status === 'DONE' || isCompletingLocal;

  const handleToggleCheck = () => {
    if (task.status === 'DONE') {
      onUndoCompletion(task.id);
    } else {
      setIsCompletingLocal(true);
      // Give time for checkmark draw and strikethrough reveal to play visibly
      setTimeout(() => {
        onComplete(task.id);
        setIsCompletingLocal(false);
      }, 350);
    }
  };

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    onAddSubtask(task.id, newSubtaskText.trim());
    setNewSubtaskText('');
  };

  return (
    <motion.div
      layout
      variants={VARIANTS.taskCardEntrance}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-4 transition-colors duration-200 overflow-hidden ${
        task.isMustWin
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm'
          : task.status === 'OVERDUE'
          ? 'border-amber-500/40 bg-amber-500/5'
          : isDone
          ? 'border-border/50 bg-card/40 opacity-75'
          : 'border-border bg-card/60 hover:border-border/90 hover:bg-card'
      }`}
    >
      {/* Main Task Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Checkbox & Title Content */}
        <div className="flex items-start gap-3 overflow-hidden flex-1">
          <div className="mt-0.5 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
            <AnimatedCheckmark
              checked={isDone}
              size={22}
              onToggle={handleToggleCheck}
            />
          </div>

          <div className="space-y-1 overflow-hidden flex-1">
            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {task.code}
              </span>

              {task.isMustWin && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-full bg-primary/20 px-2 py-0.2 text-[10px] font-bold text-primary"
                >
                  🎯 MUST-WIN
                </motion.span>
              )}

              {task.status === 'OVERDUE' && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-bold text-amber-500"
                >
                  ⚠️ OVERDUE
                </motion.span>
              )}

              {business && (
                <span
                  className="rounded-md px-1.5 py-0.2 text-[10px] font-semibold transition-colors"
                  style={{
                    backgroundColor: `${business.color}18`,
                    color: business.color,
                  }}
                >
                  {business.code}
                </span>
              )}

              <motion.span
                layout
                animate={{
                  scale: task.priority === 'P1' ? [1, 1.06, 1] : 1,
                }}
                transition={{ duration: 0.25 }}
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold transition-colors ${
                  task.priority === 'P1'
                    ? 'bg-rose-500/10 text-rose-500'
                    : task.priority === 'P2'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {task.priority}
              </motion.span>

              {project && (
                <span className="text-[11px] text-muted-foreground truncate">
                  • {project.name}
                </span>
              )}
            </div>

            {/* Task Title with Left-to-Right Animated Strikethrough */}
            <div className="relative inline-block max-w-full">
              <h4
                className={`text-sm font-semibold text-foreground transition-colors duration-200 ${
                  isDone ? 'text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </h4>
              <motion.span
                initial={false}
                animate={{ width: isDone ? '100%' : '0%' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-muted-foreground/70 pointer-events-none rounded-full"
              />
            </div>

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

          {isDone ? (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onUndoCompletion(task.id)}
                className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors min-h-[44px]"
                title="Undo completion"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Undo</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenRestoreModal(task)}
                className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors min-h-[44px]"
                title="Restore to a specific list"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore...</span>
              </motion.button>
            </div>
          ) : (
            <>
              {!task.isMustWin && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSetMustWin(task.id)}
                  className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] flex items-center"
                  title="Set as Today's MUST-WIN"
                >
                  Must-Win
                </motion.button>
              )}

              <select
                value={task.status}
                onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
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

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onStartFocus(task)}
                className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Start</span>
              </motion.button>
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleExpand}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Subtasks"
          >
            <ListTodo className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenDeleteModal(task)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Move to Trash"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Subtasks Collapsible Accordion */}
      <AnimatePresence>
        {(subtasks.length > 0 || isExpanded) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: MOTION_EASINGS.enter }}
            className="pt-2 border-t border-border/60 pl-6 space-y-2 overflow-hidden"
          >
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
                      onClick={() => onUpdateStatus(sub.id, sub.status === 'DONE' ? 'TODAY' : 'DONE')}
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
                    onClick={() => onOpenDeleteModal(sub)}
                    className="p-2 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline add subtask */}
            <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="+ Add micro-step subtask..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!newSubtaskText.trim()}
                className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 disabled:opacity-50 min-h-[44px]"
              >
                Add
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

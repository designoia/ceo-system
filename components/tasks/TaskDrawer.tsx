'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, Circle, Trash2, ChevronRight, Users } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Task, TaskPriority, TaskDelegation } from '@/lib/types';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { DESIGNOIA_MOTION } from '@/lib/motion';

const PRIORITIES: TaskPriority[] = ['P1', 'P2', 'P3'];
const DELEGATIONS: { value: TaskDelegation; label: string }[] = [
  { value: 'YOU', label: 'You' },
  { value: 'TEAM', label: 'Team' },
  { value: 'AUTOMATION', label: 'Automation' },
  { value: 'AI', label: 'AI' },
  { value: 'WAITING', label: 'Waiting' },
];

export function TaskDrawer({
  task,
  onClose,
  onSchedule,
}: {
  task: Task | null;
  onClose: () => void;
  onSchedule: (task: Task) => void;
}) {
  const { projects, businesses, updateTask, completeTask, undoTaskCompletion, deleteTask, getSubtasks, getSubtaskProgress } = useStore();
  const [notes, setNotes] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    setNotes(task?.notes || '');
  }, [task?.id]);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const parentProject = project?.parentProjectId ? projects.find((p) => p.id === project.parentProjectId) : null;
  const business = businesses.find((b) => b.code === task.businessCode);
  const isDone = task.status === 'DONE';
  const subtasks = getSubtasks(task.id);
  const subProgress = getSubtaskProgress(task.id);

  const commitNotes = () => {
    if (notes !== (task.notes || '')) {
      updateTask(task.id, { notes });
    }
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50"
          />
          <motion.div
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (isMobile && (info.offset.y > 120 || info.velocity.y > 500)) onClose();
            }}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={DESIGNOIA_MOTION.bottomSheet}
            className={
              isMobile
                ? 'fixed inset-x-0 bottom-0 z-50 max-h-[92vh] surface-1 border-t border-border shadow-2xl flex flex-col rounded-t-2xl'
                : 'fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] surface-1 border-l border-border shadow-2xl flex flex-col'
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="h-1 w-9 rounded-full bg-border" />
              </div>
            )}
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="min-w-0 flex items-center gap-2 text-[11px] text-muted-foreground">
                {business && <span>{business.name}</span>}
                {parentProject && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="truncate">{parentProject.name}</span>
                  </>
                )}
                {project && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="truncate">{project.name}</span>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Title + complete toggle */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => (isDone ? undoTaskCompletion(task.id) : completeTask(task.id, task.estimatedMinutes))}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                </button>
                <h3 className={`text-base font-semibold leading-snug ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </h3>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-border px-3 py-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Priority</span>
                  <div className="flex items-center gap-1 mt-1">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => updateTask(task.id, { priority: p })}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                          task.priority === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border px-3 py-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Duration
                  </span>
                  <select
                    value={task.estimatedMinutes}
                    onChange={(e) => updateTask(task.id, { estimatedMinutes: Number(e.target.value) })}
                    className="w-full bg-transparent text-[13px] font-medium text-foreground mt-0.5 focus:outline-none"
                  >
                    {[10, 25, 45, 60, 90].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-border px-3 py-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Due date
                </span>
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                  className="w-full bg-transparent text-[13px] font-medium text-foreground mt-0.5 focus:outline-none"
                />
              </div>

              {/* Delegation */}
              <div className="rounded-lg border border-border px-3 py-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Users className="h-3 w-3" /> Owner
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {DELEGATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => updateTask(task.id, { delegation: d.value })}
                      className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        (task.delegation || 'YOU') === d.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {task.delegation === 'WAITING' && (
                  <input
                    type="text"
                    value={task.waitingOn || ''}
                    onChange={(e) => updateTask(task.id, { waitingOn: e.target.value })}
                    placeholder="Waiting on…"
                    className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 mt-2 pt-2 border-t border-border/60 focus:outline-none"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 text-[12px] text-muted-foreground px-1">
                <input
                  type="checkbox"
                  checked={Boolean(task.isDecision)}
                  onChange={(e) => updateTask(task.id, { isDecision: e.target.checked })}
                  className="h-3.5 w-3.5 rounded accent-primary"
                />
                <span>Needs a decision from you (adds to Decision Queue)</span>
              </label>

              {/* Notes */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes</span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={commitNotes}
                  placeholder="Add context, links, or next steps…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 resize-none"
                />
              </div>

              {/* Subtasks */}
              {subtasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Subtasks</span>
                    <span className="font-mono normal-case">{subProgress.done}/{subProgress.total}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${subProgress.percent}%` }} />
                  </div>
                  <div className="space-y-1 pt-1">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 text-[12px]">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${st.status === 'DONE' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                        <span className={st.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground/90'}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border text-xs">
              <button
                onClick={() => onSchedule(task)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => {
                  deleteTask(task.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-destructive/80 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

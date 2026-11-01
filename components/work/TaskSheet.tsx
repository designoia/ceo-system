'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { TaskPriority } from '@/lib/types';
import { QUADRANTS } from '@/lib/work';
import { Checklist, tomorrowOf, useToday } from './TaskParts';

function Pill({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('min-h-[40px] rounded-full border px-4 text-[13px] font-semibold transition-colors', active ? 'text-white' : 'border-border text-muted-foreground')}
      style={active ? { background: color ?? 'hsl(var(--primary))', borderColor: color ?? 'hsl(var(--primary))' } : undefined}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{children}</div>;
}

/**
 * Task editor. Shows only what matters (name, day, calendar, checklist).
 * Everything else sits behind "More". Changes save as you make them.
 */
export function TaskSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { tasks, businesses, projects, updateTask, rescheduleTask, softDeleteTask } = useStore();
  const today = useToday();
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;
  const [title, setTitle] = useState('');
  const [more, setMore] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setTitle(task?.title ?? '');
    setMore(false);
    setArmed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [taskId]);

  const saveTitle = () => {
    if (task && title.trim() && title.trim() !== task.title) updateTask(task.id, { title: title.trim() });
  };
  const day = task?.scheduledDate ?? task?.dueDate ?? '';

  return (
    <AnimatePresence>
      {task && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { saveTitle(); onClose(); }} className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="surface-1 relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-border sm:max-w-lg sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Task"
          >
            <div className="flex items-start gap-2 px-5 pb-1 pt-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                aria-label="Task name"
                className="min-h-[44px] flex-1 bg-transparent text-lg font-bold outline-none"
              />
              <button onClick={() => { saveTitle(); onClose(); }} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-4 pt-2">
              <div>
                <Label>Day</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill active={day === today} onClick={() => rescheduleTask(task.id, today)}>Today</Pill>
                  <Pill active={day === tomorrowOf(today)} onClick={() => rescheduleTask(task.id, tomorrowOf(today))}>Tomorrow</Pill>
                  <Pill active={!day} onClick={() => rescheduleTask(task.id, null)}>No date</Pill>
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => rescheduleTask(task.id, e.target.value || null)}
                    aria-label="Pick a date"
                    className="min-h-[40px] rounded-full border border-border bg-transparent px-3 text-base"
                  />
                </div>
              </div>

              <div>
                <Label>Calendar</Label>
                <div className="flex flex-wrap gap-2">
                  <Pill active={!task.businessCode} color="#64748b" onClick={() => updateTask(task.id, { businessCode: '' })}>None</Pill>
                  {businesses.map((b) => (
                    <Pill key={b.code} active={task.businessCode === b.code} color={b.color} onClick={() => updateTask(task.id, { businessCode: b.code })}>
                      {b.name}
                    </Pill>
                  ))}
                </div>
                {businesses.length === 0 && <p className="mt-1.5 text-xs text-muted-foreground">Create calendars from the Tasks or Calendar screen.</p>}
              </div>

              <div>
                <Label>Checklist</Label>
                <div className="rounded-xl border border-border">
                  <Checklist task={task} />
                </div>
              </div>

              <div>
                <button onClick={() => setMore((v) => !v)} className="flex min-h-[40px] items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                  <ChevronDown className={cn('h-4 w-4 transition-transform', more && 'rotate-180')} />
                  More options
                </button>
                {more && (
                  <div className="mt-2 space-y-5">
                    {projects.some((p) => p.status === 'ACTIVE' || p.id === task.projectId) && (
                      <div>
                        <Label>Project</Label>
                        <div className="flex flex-wrap gap-2">
                          <Pill active={!task.projectId} color="#64748b" onClick={() => updateTask(task.id, { projectId: undefined })}>None</Pill>
                          {projects.filter((p) => p.status === 'ACTIVE' || p.id === task.projectId).map((p) => (
                            <Pill key={p.id} active={task.projectId === p.id} onClick={() => updateTask(task.id, { projectId: p.id })}>{p.name}</Pill>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Priority</Label>
                      <div className="flex gap-2">
                        {(['P1', 'P2', 'P3'] as TaskPriority[]).map((p) => (
                          <Pill key={p} active={task.priority === p} onClick={() => updateTask(task.id, { priority: p })}>
                            {p === 'P1' ? 'High' : p === 'P2' ? 'Normal' : 'Low'}
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Matrix</Label>
                      <div className="flex flex-wrap gap-2">
                        {QUADRANTS.map((q) => (
                          <Pill key={q.id} active={task.quadrant === q.id} color={q.color} onClick={() => updateTask(task.id, { quadrant: task.quadrant === q.id ? undefined : q.id })}>
                            {q.label}
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <textarea
                        defaultValue={task.notes ?? ''}
                        onBlur={(e) => updateTask(task.id, { notes: e.target.value.trim() || undefined })}
                        placeholder="Anything worth remembering…"
                        className="min-h-[88px] w-full rounded-xl border border-border bg-transparent p-3 text-base outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button
                onClick={() => {
                  if (!armed) return setArmed(true);
                  softDeleteTask(task.id);
                  onClose();
                }}
                className={cn('flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold', armed ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500')}
              >
                <Trash2 className="h-4 w-4" />
                {armed ? 'Tap to confirm' : 'Delete'}
              </button>
              <button onClick={() => { saveTitle(); onClose(); }} className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

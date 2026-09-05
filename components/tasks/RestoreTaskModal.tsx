'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Target, Calendar, Layers, Clock, X } from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';
import { useStore } from '@/lib/store';

interface RestoreTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const DESTINATIONS: { key: TaskStatus; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'TODAY', label: 'Today', desc: "Focus for today's execution schedule", icon: Target },
  { key: 'THIS_WEEK', label: 'This Week', desc: 'Planned for the current weekly sprint', icon: Calendar },
  { key: 'NEXT', label: 'Next Up', desc: 'Queued directly after this week', icon: Layers },
  { key: 'BACKLOG', label: 'Backlog', desc: 'Saved for future prioritization', icon: Clock },
];

export function RestoreTaskModal({ task, isOpen, onClose }: RestoreTaskModalProps) {
  const { restoreTask } = useStore();

  if (!isOpen || !task) return null;

  const recommendedStatus: TaskStatus = task.previousStatus && task.previousStatus !== 'DONE'
    ? task.previousStatus
    : 'TODAY';

  const handleRestore = (targetStatus: TaskStatus) => {
    restoreTask(task.id, targetStatus);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card p-6 shadow-2xl safe-bottom"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Undo2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Restore Completed Task</h3>
                <p className="text-xs text-muted-foreground">
                  Undo completion and return this task to your active pipeline.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Task Info */}
          <div className="my-4 rounded-2xl bg-secondary/50 p-3.5 border border-border/70">
            <div className="text-[11px] font-mono text-muted-foreground">{task.code}</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">{task.title}</div>
            {task.previousStatus && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
                <span>Previous status before completion:</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-wide">
                  {task.previousStatus}
                </span>
              </div>
            )}
          </div>

          {/* Destination Choices */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Select destination:
            </div>
            {DESTINATIONS.map((dest) => {
              const isRecommended = dest.key === recommendedStatus;
              const Icon = dest.icon;
              return (
                <button
                  key={dest.key}
                  onClick={() => handleRestore(dest.key)}
                  className={`w-full flex items-center justify-between rounded-2xl p-3.5 border text-left transition-all min-h-[52px] ${
                    isRecommended
                      ? 'border-primary bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/30'
                      : 'border-border bg-card/60 hover:bg-accent hover:border-border/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isRecommended ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{dest.label}</span>
                        {isRecommended && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.2 text-[10px] font-bold text-primary">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{dest.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary">Restore →</span>
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRestore(recommendedStatus)}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]"
            >
              Restore to {recommendedStatus}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

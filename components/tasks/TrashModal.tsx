'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useStore } from '@/lib/store';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { deletedTasks, restoreFromTrash, permanentlyDeleteTask } = useStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-card p-6 shadow-2xl safe-bottom"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Trash / Soft-Deleted Tasks</h3>
                <p className="text-xs text-muted-foreground">
                  Restore deleted tasks to active work or permanently remove them.
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

          {/* List */}
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
            {deletedTasks.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-secondary/20">
                <Trash2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <div className="text-sm font-semibold text-foreground">Trash is empty</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No soft-deleted tasks found. All active tasks remain safely preserved.
                </p>
              </div>
            ) : (
              deletedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-4"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{task.code}</span>
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                        {task.status}
                      </span>
                      {task.deletedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          Deleted {new Date(task.deletedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-foreground truncate">{task.title}</div>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => restoreFromTrash(task.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors min-h-[44px]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently remove "${task.title}"? This cannot be undone.`)) {
                          permanentlyDeleteTask(task.id);
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors min-h-[44px]"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Delete Forever</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
            <span className="text-xs text-muted-foreground">
              {deletedTasks.length} {deletedTasks.length === 1 ? 'task' : 'tasks'} in trash
            </span>
            <button
              onClick={onClose}
              className="rounded-xl bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors min-h-[44px]"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

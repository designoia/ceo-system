'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Task } from '@/lib/types';
import { useStore } from '@/lib/store';

interface DeleteConfirmationModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess?: () => void;
}

export function DeleteConfirmationModal({
  task,
  isOpen,
  onClose,
  onConfirmSuccess,
}: DeleteConfirmationModalProps) {
  const { deleteTask } = useStore();

  if (!isOpen || !task) return null;

  const handleDelete = () => {
    deleteTask(task.id);
    if (onConfirmSuccess) onConfirmSuccess();
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
          className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-destructive/30 bg-card p-6 shadow-2xl safe-bottom"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Move to Trash?</h3>
                <p className="text-xs text-muted-foreground">
                  Task will be removed from active execution views.
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

          {/* Task preview */}
          <div className="my-4 rounded-2xl bg-destructive/5 p-4 border border-destructive/20">
            <div className="text-[11px] font-mono text-muted-foreground">{task.code}</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">{task.title}</div>
            <p className="text-xs text-muted-foreground mt-2">
              You can restore this task anytime from the Trash.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm min-h-[44px]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Task</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

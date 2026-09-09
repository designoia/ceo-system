'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Calendar, Target, Trash2, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DESIGNOIA_MOTION } from '@/lib/motion';
import { Task } from '@/lib/types';

export function TaskActionsSheet({
  task,
  onClose,
  onSchedule,
  onOpenDetail,
}: {
  task: Task | null;
  onClose: () => void;
  onSchedule: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
}) {
  const { completeTask, undoTaskCompletion, setMustWin, deleteTask } = useStore();

  if (!task) return null;

  const actions = [
    {
      label: task.status === 'DONE' ? 'Mark not done' : 'Complete',
      icon: CheckCircle2,
      onClick: () => (task.status === 'DONE' ? undoTaskCompletion(task.id) : completeTask(task.id, task.estimatedMinutes)),
    },
    { label: 'Schedule', icon: Calendar, onClick: () => onSchedule(task) },
    { label: 'Set as Must-Win', icon: Target, onClick: () => setMustWin(task.id) },
    { label: 'View details', icon: Eye, onClick: () => onOpenDetail(task) },
    { label: 'Delete', icon: Trash2, onClick: () => deleteTask(task.id), danger: true },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-[55] bg-black/50 md:hidden"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={DESIGNOIA_MOTION.bottomSheet}
        className="fixed inset-x-0 bottom-0 z-[55] surface-1 border-t border-border shadow-2xl rounded-t-2xl pb-[env(safe-area-inset-bottom,16px)] md:hidden"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-9 rounded-full bg-border" />
        </div>
        <p className="px-5 pb-2 text-[13px] font-medium text-foreground truncate">{task.title}</p>
        <div className="px-3 pb-4 space-y-0.5">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => {
                  a.onClick();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 min-h-[44px] hover:bg-secondary transition-colors ${
                  a.danger ? 'text-destructive' : 'text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[13px] font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

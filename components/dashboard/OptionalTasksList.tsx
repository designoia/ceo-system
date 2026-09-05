'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTaskLifecycle } from '@/lib/hooks/useTaskLifecycle';
import { Task } from '@/lib/types';
import { AnimatedCheckmark } from '@/components/motion/AnimatedCheckmark';
import { VARIANTS } from '@/lib/motion';

export function OptionalTasksList() {
  const { optionalTasks, dailyRecommendation, startFocus, setMustWin } = useStore();
  const { completeWithUndo } = useTaskLifecycle();
  const nextTasks = dailyRecommendation.nextTasks;
  const projectBreadcrumbs = dailyRecommendation.projectBreadcrumbs;

  const displayTasks = nextTasks.length > 0 ? nextTasks : optionalTasks;
  if (displayTasks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {nextTasks.length > 0 ? `NEXT IN QUEUE (${nextTasks.length})` : 'OPTIONAL TASKS'}
        </h3>
        <span className="text-[11px] text-muted-foreground">Fits within available daily capacity</span>
      </div>

      <motion.div layout className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {displayTasks.map((task: Task) => (
            <motion.div
              key={task.id}
              layout
              variants={VARIANTS.taskCardEntrance}
              initial="initial"
              animate="animate"
              exit="exit"
              className="group flex items-center justify-between rounded-xl border border-border/70 bg-background/50 px-3.5 py-2.5 transition-colors hover:border-border hover:bg-background overflow-hidden"
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <div className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
                  <AnimatedCheckmark
                    checked={task.status === 'DONE'}
                    size={20}
                    onToggle={() => completeWithUndo(task.id, task.estimatedMinutes)}
                  />
                </div>

                <div className="truncate flex-1">
                  <span className="text-xs font-medium text-foreground block truncate">
                    {task.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {projectBreadcrumbs[task.id] || task.businessCode} • {task.estimatedMinutes}m • {task.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMustWin(task.id)}
                  title="Promote to MUST-WIN"
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Make Must-Win
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startFocus(task, 'NORMAL')}
                  title="Start Focused Session"
                  className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors min-h-[44px]"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Start</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

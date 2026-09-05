'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Check, 
  Trash2, 
  Undo2, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Layers, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { AnimatedCheckmark } from '@/components/motion/AnimatedCheckmark';
import { useToast } from '@/lib/hooks/useToast';
import { 
  TaskSkeleton, 
  ProjectSkeleton, 
  DashboardSkeleton, 
  GoalSkeleton, 
  ChartSkeleton 
} from '@/components/ui/SkeletonLoading';
import { VARIANTS } from '@/lib/motion';

export default function MotionTestPage() {
  const toast = useToast();

  // Test Task State
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Finish Prorido Homepage hero section', priority: 'P1', isDone: false },
    { id: 't2', title: 'Setup Stripe webhook handling', priority: 'P2', isDone: false },
    { id: 't3', title: 'Draft weekly strategic review', priority: 'P3', isDone: true },
  ]);

  const [counter, setCounter] = useState(12);
  const [progress, setProgress] = useState(45);
  const [showModal, setShowModal] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextDone = !t.isDone;
          if (nextDone) {
            toast.showUndo(`Completed "${t.title}"`, () => {
              handleToggleTask(id);
            });
          }
          return { ...t, isDone: nextDone };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (taskToDelete) {
      toast.showUndo(`Deleted "${taskToDelete.title}"`, () => {
        setTasks(prev => [...prev, taskToDelete]);
      });
    }
  };

  const handleAddTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: `Generated Task ${tasks.length + 1}`,
      priority: 'P1',
      isDone: false,
    };
    setTasks(prev => [newTask, ...prev]);
    toast.success('New task created');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">
          INTERNAL ANIMATION DIAGNOSTICS
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Motion System Interactive Test Suite
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manually trigger, test, and verify every motion token, transition, and gesture.
        </p>
      </div>

      {/* 1. TASK ANIMATIONS (Creation, Checkmark Draw, Strikethrough, Exit & Undo) */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            1. Task Lifecycle Motion (Create, Checkmark Draw, Strikethrough, Exit)
          </h3>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Test Task</span>
          </button>
        </div>

        <motion.div layout className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {tasks.map((t) => (
              <motion.div
                key={t.id}
                layout
                variants={VARIANTS.taskCardEntrance}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center justify-between rounded-2xl border border-border bg-background/60 p-3.5"
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <AnimatedCheckmark
                    checked={t.isDone}
                    size={22}
                    onToggle={() => handleToggleTask(t.id)}
                  />

                  <div className="relative flex-1">
                    <span className={`text-xs font-semibold ${t.isDone ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {t.title}
                    </span>
                    <motion.span
                      initial={false}
                      animate={{ width: t.isDone ? '100%' : '0%' }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-muted-foreground/70 pointer-events-none rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                    {t.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 2. TOAST SYSTEM TRIGGERS */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground">2. Centralized Toast System</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toast.success('✓ Task successfully saved!')}
            className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20"
          >
            Trigger Success Toast
          </button>
          <button
            onClick={() => toast.error('Something went wrong. Please try again.')}
            className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
          >
            Trigger Error Toast
          </button>
          <button
            onClick={() => toast.showUndo('Task "Prorido Launch" deleted', () => alert('Undo clicked!'), 5000)}
            className="rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Trigger 5s Undo Toast
          </button>
        </div>
      </div>

      {/* 3. PROGRESS BARS & NUMBERS */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">3. Progress Bar & Metric Interpolation</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>Dynamic Progress Bar</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex gap-2 pt-2">
            {[20, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => setProgress(p)}
                className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Set {p}%
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-border">
          <div className="text-xs font-semibold text-foreground">
            Counter Metric: <span className="text-primary font-bold font-mono text-base ml-1">{counter}</span>
          </div>
          <button
            onClick={() => setCounter(c => c + 1)}
            className="rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent/80"
          >
            Increment Metric +1
          </button>
        </div>
      </div>

      {/* 4. MODALS & BOTTOM SHEETS */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground">4. Modals & Bottom Sheets</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            Open Desktop Modal
          </button>
          <button
            onClick={() => setShowSheet(true)}
            className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground"
          >
            Open Mobile Bottom Sheet
          </button>
        </div>
      </div>

      {/* 5. SKELETON PREVIEWS */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">5. Skeletons (Async Loading States)</h3>
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className="rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-foreground"
          >
            {showSkeleton ? 'Hide Skeletons' : 'Show Skeletons'}
          </button>
        </div>

        {showSkeleton && (
          <div className="space-y-4 pt-2">
            <TaskSkeleton />
            <ProjectSkeleton />
            <ChartSkeleton />
          </div>
        )}
      </div>

      {/* Modal Demo */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-foreground">Interactive Motion Modal</h3>
              <p className="text-xs text-muted-foreground">
                Spring modal entrance with backdrop blur and smooth exit reverse.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
              >
                Close Modal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Demo */}
      <AnimatePresence>
        {showSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              className="w-full max-w-lg rounded-t-3xl border-t border-border bg-card p-6 shadow-2xl space-y-4 safe-bottom"
            >
              <div className="mx-auto h-1 w-12 rounded-full bg-muted-foreground/30 mb-2" />
              <h3 className="text-base font-bold text-foreground">Mobile Bottom Sheet</h3>
              <p className="text-xs text-muted-foreground">
                Slides up from bottom on mobile with swipe-down capability and safe-area padding.
              </p>
              <button
                onClick={() => setShowSheet(false)}
                className="w-full rounded-xl bg-secondary py-2.5 text-xs font-bold text-foreground"
              >
                Dismiss Sheet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

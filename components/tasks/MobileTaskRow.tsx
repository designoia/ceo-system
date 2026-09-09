'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CheckCircle2, Calendar, Target, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Task, Project, Business } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';

const SWIPE_THRESHOLD = 90;
const LONG_PRESS_MS = 450;

export function MobileTaskRow({
  task,
  project,
  business,
  onOpen,
  onComplete,
  onReschedule,
  onLongPress,
}: {
  task: Task;
  project?: Project;
  business?: Business;
  onOpen: (task: Task) => void;
  onComplete: (task: Task) => void;
  onReschedule: (task: Task) => void;
  onLongPress: (task: Task) => void;
}) {
  const x = useMotionValue(0);
  const completeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rescheduleOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const isDone = task.status === 'DONE';

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suppressClick, setSuppressClick] = useState(false);

  const handlePointerDown = () => {
    setSuppressClick(false);
    pressTimer.current = setTimeout(() => {
      setSuppressClick(true);
      onLongPress(task);
    }, LONG_PRESS_MS);
  };

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe action backgrounds */}
      <motion.div
        style={{ opacity: completeOpacity }}
        className="absolute inset-y-0 left-0 right-0 flex items-center px-4 bg-emerald-500/15"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="ml-2 text-[12px] font-medium text-emerald-500">Complete</span>
      </motion.div>
      <motion.div
        style={{ opacity: rescheduleOpacity }}
        className="absolute inset-y-0 left-0 right-0 flex items-center justify-end px-4 bg-amber-500/15"
      >
        <span className="mr-2 text-[12px] font-medium text-amber-500">Reschedule</span>
        <Calendar className="h-4 w-4 text-amber-500" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) {
            onComplete(task);
            animate(x, 0, { duration: 0.25 });
          } else if (info.offset.x < -SWIPE_THRESHOLD) {
            onReschedule(task);
            animate(x, 0, { duration: 0.25 });
          } else {
            animate(x, 0, { duration: 0.2 });
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={clearPress}
        onPointerLeave={clearPress}
        onClick={() => {
          if (!suppressClick) onOpen(task);
        }}
        className="relative w-full flex items-center gap-3 px-4 py-3 min-h-[56px] surface-1 active:bg-secondary/40 transition-colors"
      >
        <span className="shrink-0 text-muted-foreground">
          {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {task.isMustWin && <Target className="h-3 w-3 text-primary shrink-0" />}
            {task.status === 'OVERDUE' && <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />}
            <span className={`text-[14px] truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {project && <span className="text-[11px] text-muted-foreground truncate">{project.name}</span>}
            <span className="text-[11px] text-muted-foreground font-mono">{formatMinutes(task.estimatedMinutes)}</span>
          </div>
        </div>

        {business && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
            style={{ color: business.color, backgroundColor: `${business.color}1a` }}
          >
            {business.code}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onLongPress(task);
          }}
          className="shrink-0 h-11 w-11 flex items-center justify-center text-muted-foreground/50"
          aria-label="Task actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
}

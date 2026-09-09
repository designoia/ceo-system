'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { Project } from '@/lib/types';
import { DESIGNOIA_MOTION } from '@/lib/motion';

type Health = 'good' | 'at-risk' | 'stalled';

const HEALTH_CONFIG: Record<Health, { label: string; color: string }> = {
  good: { label: 'On track', color: 'bg-emerald-500 text-emerald-500' },
  'at-risk': { label: 'At risk', color: 'bg-amber-500 text-amber-500' },
  stalled: { label: 'Stalled', color: 'bg-red-500 text-red-500' },
};

export function MobileProjectCard({
  project,
  progress,
  activeTaskCount,
  nextAction,
  onOpen,
}: {
  project: Project;
  progress: number;
  activeTaskCount: number;
  nextAction: string | null;
  onOpen: (p: Project) => void;
}) {
  const health: Health = project.status === 'PAUSED' ? 'at-risk' : progress === 0 && activeTaskCount > 0 ? 'stalled' : 'good';
  const config = HEALTH_CONFIG[health];
  const [dotColor, textColor] = config.color.split(' ');

  return (
    <motion.button
      whileTap={DESIGNOIA_MOTION.buttonPress}
      onClick={() => onOpen(project)}
      className="w-full text-left rounded-lg border border-border surface-1 p-3.5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium text-foreground truncate">{project.name}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground shrink-0">{progress}%</span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
          <span className={textColor}>{config.label}</span>
          <span>· {activeTaskCount} active</span>
        </div>
        {nextAction && (
          <div className="flex items-center gap-1 text-muted-foreground min-w-0">
            <ArrowUpRight className="h-3 w-3 shrink-0 text-primary/70" />
            <span className="truncate max-w-[110px]">{nextAction}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, X, Trophy } from 'lucide-react';
import { useStore } from '@/lib/store';

const CELEBRATED_STORAGE_KEY = 'ceo_os_celebrated_milestones';

export function MilestoneCelebration() {
  const { momentumStats } = useStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const milestoneVal = momentumStats.milestoneDays || momentumStats.milestoneValue;

    if (momentumStats.isMilestone && milestoneVal) {
      try {
        const stored = localStorage.getItem(CELEBRATED_STORAGE_KEY);
        const celebrated: number[] = stored ? JSON.parse(stored) : [];

        // Only show if this specific milestone hasn't been celebrated/dismissed yet
        if (!celebrated.includes(milestoneVal)) {
          setShowModal(true);
        }
      } catch {
        // Fallback
      }
    }
  }, [momentumStats.isMilestone, momentumStats.milestoneDays, momentumStats.milestoneValue]);

  const handleDismiss = () => {
    setShowModal(false);
    const milestoneVal = momentumStats.milestoneDays || momentumStats.milestoneValue;
    if (milestoneVal && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CELEBRATED_STORAGE_KEY);
        const celebrated: number[] = stored ? JSON.parse(stored) : [];
        if (!celebrated.includes(milestoneVal)) {
          celebrated.push(milestoneVal);
          localStorage.setItem(CELEBRATED_STORAGE_KEY, JSON.stringify(celebrated));
        }
      } catch {
        // Ignore storage errors
      }
    }
  };

  const milestoneDays = momentumStats.milestoneDays || momentumStats.milestoneValue;
  if (!showModal || !milestoneDays) return null;

  const getMilestoneMessage = (days: number) => {
    switch (days) {
      case 1:
        return 'First step locked in. The hardest part is starting.';
      case 3:
        return '3 straight days of real progress. Momentum is building.';
      case 7:
        return 'One full week of uninterrupted daily execution.';
      case 14:
        return 'Two weeks of executive consistency. Systems are compounding.';
      case 30:
        return '30 days of relentless momentum. You are operating at CEO level.';
      case 60:
        return '60 days of strategic execution. Extraordinary consistency.';
      case 100:
        return '100 DAYS. A monumental achievement in 5-year execution.';
      default:
        return `${days} days of meaningful daily execution.`;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-card via-card to-background p-6 text-center shadow-2xl"
        >
          {/* Subtle Flame Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Flame Icon with Pulsing Effect */}
          <div className="mx-auto my-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shadow-inner">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Flame className="h-10 w-10 fill-current" />
            </motion.div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 border border-amber-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>MOMENTUM MILESTONE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            🔥 {milestoneDays} DAY STREAK
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {getMilestoneMessage(milestoneDays)}
          </p>

          <div className="my-5 rounded-2xl bg-secondary/40 p-3 border border-border flex items-center justify-around text-xs">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Current Streak</div>
              <div className="text-base font-extrabold text-amber-500 font-mono">
                {momentumStats.currentStreak} Days
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Best Record</div>
              <div className="text-base font-extrabold text-foreground font-mono flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>{momentumStats.bestStreak} Days</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-bold text-black shadow-lg hover:brightness-110 transition-all min-h-[44px]"
          >
            Keep Crushing It →
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

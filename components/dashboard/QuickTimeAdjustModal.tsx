'use client';

import React from 'react';
import { X, Plus, Minus, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickTimeAdjustModal() {
  const {
    isTimeAdjustModalOpen,
    timeAdjustMode,
    setTimeAdjustModalOpen,
    addExtraTime,
    reduceAvailableTime,
    todayCapacityMinutes,
  } = useStore();

  if (!isTimeAdjustModalOpen) return null;

  const isMore = timeAdjustMode === 'MORE';

  const morePresets = [
    { label: '+15 min', value: 15, note: 'Quick review sprint' },
    { label: '+30 min', value: 30, note: 'Execute 1 secondary task' },
    { label: '+60 min', value: 60, note: 'Full bonus project block' },
    { label: '+120 min', value: 120, note: 'Deep focus afternoon' },
  ];

  const lessPresets = [
    { label: '10 min', value: 10, note: '10-minute minimum rescue action' },
    { label: '15 min', value: 15, note: 'High-speed single micro-win' },
    { label: '20 min', value: 20, note: 'Sprint focused action' },
    { label: '30 min', value: 30, note: 'Standard condensed session' },
  ];

  const handleSelectMore = (delta: number) => {
    addExtraTime(delta);
    setTimeAdjustModalOpen(false);
  };

  const handleSelectLess = (target: number) => {
    reduceAvailableTime(target);
    setTimeAdjustModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isMore ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {isMore ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {isMore ? 'I Have More Time' : 'I Have Less Time'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isMore
                    ? 'Unexpected free time? Let’s pick the best project move.'
                    : 'Tired or busy? We’ll protect your momentum safely.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setTimeAdjustModalOpen(false)}
              className="rounded-xl p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Capacity Preview */}
          <div className="rounded-2xl border border-border/80 bg-background/60 p-3.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Available Capacity:</span>
            <span className="font-bold text-foreground font-mono">{todayCapacityMinutes} minutes</span>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isMore ? 'Select Extra Time to Add' : 'Select Target Time for Today'}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {isMore
                ? morePresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleSelectMore(preset.value)}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card/60 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-foreground transition-all text-left group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-foreground group-hover:text-emerald-500">
                          {preset.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{preset.note}</div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-500 font-mono">
                        → {todayCapacityMinutes + preset.value}m total
                      </span>
                    </button>
                  ))
                : lessPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleSelectLess(preset.value)}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card/60 hover:bg-amber-500/10 hover:border-amber-500/30 text-foreground transition-all text-left group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-foreground group-hover:text-amber-500">
                          {preset.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{preset.note}</div>
                      </div>
                      <span className="text-xs font-semibold text-amber-500 font-mono">
                        Set to {preset.value}m
                      </span>
                    </button>
                  ))}
            </div>
          </div>

          {/* Zero-Guilt Assurance Footer */}
          <p className="text-[11px] text-muted-foreground text-center">
            {isMore
              ? '✨ Extra time will automatically queue high-priority project tasks.'
              : '🛡️ Changing time never deletes tasks or marks anything failed.'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

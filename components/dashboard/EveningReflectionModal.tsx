'use client';

import React, { useState } from 'react';
import { Moon, Check, X, Battery, BatteryCharging, BatteryWarning, ArrowRight, Heart } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

interface EveningReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EveningReflectionModal({ isOpen, onClose }: void | EveningReflectionModalProps | any) {
  const {
    mustWinTask,
    completeTask,
    updateTaskStatus,
    addDailyCheckin,
    logActivity,
  } = useStore();

  const [mustWinCompleted, setMustWinCompleted] = useState<boolean | null>(null);
  const [energyRating, setEnergyRating] = useState<'exhausted' | 'neutral' | 'good' | 'fire'>('good');
  const [notDoneTarget, setNotDoneTarget] = useState<'TOMORROW' | 'THIS_WEEK' | 'NEXT' | 'BACKLOG'>('TOMORROW');
  const [reflectionNotes, setReflectionNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mustWinTask) {
      if (mustWinCompleted) {
        completeTask(mustWinTask.id, mustWinTask.estimatedMinutes || 45, 'Completed during evening reflection');
      } else {
        if (notDoneTarget === 'THIS_WEEK') {
          updateTaskStatus(mustWinTask.id, 'THIS_WEEK');
        } else if (notDoneTarget === 'NEXT') {
          updateTaskStatus(mustWinTask.id, 'NEXT');
        } else if (notDoneTarget === 'BACKLOG') {
          updateTaskStatus(mustWinTask.id, 'BACKLOG');
        }
        // If TOMORROW, keep status as TODAY/carry forward safely
      }
    }

    addDailyCheckin({
      date: new Date().toISOString().split('T')[0],
      mustWinCompleted: !!mustWinCompleted,
      energyRating,
      accomplishments: reflectionNotes,
    });

    logActivity('SYSTEM', `checkin-${Date.now()}`, 'Evening Check-In Completed', 'COMPLETED', `Energy: ${energyRating}, Must-Win: ${mustWinCompleted ? 'Done' : 'Carried Forward'}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Evening Check-In</h3>
                <p className="text-xs text-muted-foreground">
                  2-minute reflection to protect momentum and close the day calmly.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. MUST-WIN STATUS */}
            {mustWinTask ? (
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Today&apos;s MUST-WIN: &quot;{mustWinTask.title}&quot;
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMustWinCompleted(true)}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border font-bold text-xs transition-all ${
                      mustWinCompleted === true
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500'
                        : 'border-border bg-card/60 text-foreground hover:border-border/80'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    <span>✓ Completed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMustWinCompleted(false)}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border font-bold text-xs transition-all ${
                      mustWinCompleted === false
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-1 ring-amber-500'
                        : 'border-border bg-card/60 text-foreground hover:border-border/80'
                    }`}
                  >
                    <span>○ Not Completed</span>
                  </button>
                </div>

                {mustWinCompleted === false && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-2xl bg-background/60 border border-border/80 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-muted-foreground">
                      How would you like to handle this task?
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { label: 'Tomorrow', value: 'TOMORROW' },
                        { label: 'This Week', value: 'THIS_WEEK' },
                        { label: 'Next Queue', value: 'NEXT' },
                        { label: 'Backlog', value: 'BACKLOG' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNotDoneTarget(opt.value as any)}
                          className={`p-2 rounded-xl text-center font-semibold transition-all ${
                            notDoneTarget === opt.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : null}

            {/* 2. ENERGY RATING */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                How is your energy right now?
              </label>

              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Exhausted', value: 'exhausted', icon: BatteryWarning, color: 'text-rose-400' },
                  { label: 'Neutral', value: 'neutral', icon: Battery, color: 'text-amber-400' },
                  { label: 'Good', value: 'good', icon: BatteryCharging, color: 'text-emerald-400' },
                  { label: 'Fired Up', value: 'fire', icon: Heart, color: 'text-primary' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = energyRating === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setEnergyRating(item.value as any)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. OPTIONAL NOTES */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-muted-foreground">
                Wins or key notes (optional):
              </label>
              <textarea
                value={reflectionNotes}
                onChange={(e) => setReflectionNotes(e.target.value)}
                rows={2}
                placeholder="Moved homepage forward, made good progress on layout..."
                className="w-full rounded-2xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-md transition-all"
              >
                <Check className="h-4 w-4" />
                <span>Save Check-In</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

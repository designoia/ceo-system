'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry } from '@/lib/types';
import { getTodayDateString, addMinutesToTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RescheduleModalProps {
  entry: ScheduleEntry | null;
  onClose: () => void;
}

export function RescheduleModal({ entry, onClose }: RescheduleModalProps) {
  const { settings, rescheduleBlock } = useStore();

  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrowStr = new Date(y, m - 1, d + 1).toISOString().split('T')[0];

  const [targetDate, setTargetDate] = useState(tomorrowStr);
  const [newStartTime, setNewStartTime] = useState(entry?.plannedStartTime || '09:00');
  const [newEndTime, setNewEndTime] = useState(entry?.plannedEndTime || '09:45');

  if (!entry) return null;

  const handleQuickOption = (option: 'TODAY' | 'TOMORROW' | 'NEXT_WEEK') => {
    if (option === 'TODAY') {
      setTargetDate(todayStr);
    } else if (option === 'TOMORROW') {
      setTargetDate(tomorrowStr);
    } else if (option === 'NEXT_WEEK') {
      const nextWeekStr = new Date(y, m - 1, d + 7).toISOString().split('T')[0];
      setTargetDate(nextWeekStr);
    }
  };

  const handleConfirm = () => {
    rescheduleBlock(entry.id, targetDate, newStartTime, newEndTime);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Reschedule Block</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  &quot;{entry.title}&quot;
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Date Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              When should this happen?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickOption('TODAY')}
                className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                  targetDate === todayStr
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card/60 text-foreground hover:bg-accent'
                }`}
              >
                Later Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickOption('TOMORROW')}
                className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                  targetDate === tomorrowStr
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card/60 text-foreground hover:bg-accent'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickOption('NEXT_WEEK')}
                className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                  targetDate > tomorrowStr
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card/60 text-foreground hover:bg-accent'
                }`}
              >
                Next Week
              </button>
            </div>
          </div>

          {/* Custom Date & Times */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Reschedule</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

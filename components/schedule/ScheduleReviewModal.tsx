'use client';

import React, { useState } from 'react';
import { 
  X, 
  Moon, 
  CheckCircle2, 
  Clock, 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleDifferenceReason, ScheduleDayReview } from '@/lib/types';
import { formatMinutes, getTodayDateString } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ScheduleReviewModal() {
  const {
    isScheduleReviewOpen,
    setScheduleReviewOpen,
    selectedScheduleDate,
    scheduleDayStats,
    saveScheduleDayReview,
    setPlanTomorrowOpen
  } = useStore();

  const [primaryDifferenceReason, setPrimaryDifferenceReason] = useState<ScheduleDifferenceReason>('MEETING_DELAY');
  const [remarks, setRemarks] = useState('');

  if (!isScheduleReviewOpen) return null;

  const handleSaveAndPlanTomorrow = () => {
    const reviewData: Omit<ScheduleDayReview, 'id' | 'createdAt'> = {
      date: selectedScheduleDate,
      plannedTotalMinutes: scheduleDayStats.plannedMinutes,
      actualTotalMinutes: scheduleDayStats.actualMinutes,
      varianceMinutes: scheduleDayStats.varianceMinutes,
      planningAccuracyPercent: scheduleDayStats.accuracyPercent,
      completedBlocksCount: scheduleDayStats.completedCount,
      missedBlocksCount: scheduleDayStats.missedCount,
      rescheduledBlocksCount: 0,
      mustWinCompleted: scheduleDayStats.mustWinCompleted,
      primaryDifferenceReason,
      remarks: remarks.trim() || undefined,
    };

    saveScheduleDayReview(reviewData);
    setPlanTomorrowOpen(true);
  };

  const handleSaveOnly = () => {
    const reviewData: Omit<ScheduleDayReview, 'id' | 'createdAt'> = {
      date: selectedScheduleDate,
      plannedTotalMinutes: scheduleDayStats.plannedMinutes,
      actualTotalMinutes: scheduleDayStats.actualMinutes,
      varianceMinutes: scheduleDayStats.varianceMinutes,
      planningAccuracyPercent: scheduleDayStats.accuracyPercent,
      completedBlocksCount: scheduleDayStats.completedCount,
      missedBlocksCount: scheduleDayStats.missedCount,
      rescheduledBlocksCount: 0,
      mustWinCompleted: scheduleDayStats.mustWinCompleted,
      primaryDifferenceReason,
      remarks: remarks.trim() || undefined,
    };

    saveScheduleDayReview(reviewData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  DAY END REFLECTION
                </div>
                <h3 className="text-xl font-extrabold text-foreground">Planned vs Actual Review</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calibrate your execution reality for {selectedScheduleDate}.
                </p>
              </div>
            </div>

            <button
              onClick={() => setScheduleReviewOpen(false)}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Planned vs Actual Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-border bg-card/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Planned</span>
              <div className="text-base font-extrabold font-mono text-foreground">
                {formatMinutes(scheduleDayStats.plannedMinutes)}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Actual</span>
              <div className="text-base font-extrabold font-mono text-foreground">
                {formatMinutes(scheduleDayStats.actualMinutes)}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Variance</span>
              <div className={`text-base font-extrabold font-mono ${
                scheduleDayStats.varianceMinutes >= 0 ? 'text-amber-400' : 'text-blue-400'
              }`}>
                {scheduleDayStats.varianceMinutes > 0 ? `+${scheduleDayStats.varianceMinutes}m` : `${scheduleDayStats.varianceMinutes}m`}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-primary uppercase">Accuracy</span>
              <div className="text-base font-extrabold font-mono text-primary">
                {scheduleDayStats.accuracyPercent}%
              </div>
            </div>
          </div>

          {/* Block Execution Highlights */}
          <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Blocks Completed:</span>
              <span className="font-bold text-foreground font-mono">
                {scheduleDayStats.completedCount} / {scheduleDayStats.totalCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Primary MUST-WIN:</span>
              <span className={`font-bold flex items-center gap-1 ${
                scheduleDayStats.mustWinCompleted ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {scheduleDayStats.mustWinCompleted ? '✓ Completed' : 'Pending / Not Recorded'}
              </span>
            </div>
          </div>

          {/* What caused the major difference? */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              What caused major differences between planned &amp; actual?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'MEETING_DELAY', label: 'Meeting Delay' },
                { id: 'UNEXPECTED_WORK', label: 'Unexpected Work' },
                { id: 'SCHOOL_ISSUE', label: 'School Issue' },
                { id: 'LOW_ENERGY', label: 'Low Energy' },
                { id: 'PERSONAL', label: 'Personal' },
                { id: 'OTHER', label: 'Smooth / Other' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPrimaryDifferenceReason(r.id as ScheduleDifferenceReason)}
                  className={`rounded-xl border p-2.5 text-xs font-semibold text-left transition-all ${
                    primaryDifferenceReason === r.id
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Evening Takeaway &amp; Calibration Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Started CEO block on time. Finished Prorido hero section smoothly..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="w-full sm:w-auto rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Save Review Only
            </button>

            <button
              type="button"
              onClick={handleSaveAndPlanTomorrow}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-98"
            >
              <Sparkles className="h-4 w-4" />
              <span>SAVE &amp; PLAN TOMORROW</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

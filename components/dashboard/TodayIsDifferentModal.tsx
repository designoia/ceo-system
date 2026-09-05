'use client';

import React, { useState } from 'react';
import { X, Calendar, Check, Sparkles, Sun, BookOpen, GraduationCap, ShieldAlert } from 'lucide-react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export function TodayIsDifferentModal() {
  const {
    isTodayDifferentModalOpen,
    setTodayDifferentModalOpen,
    setScheduleOverride,
    setDailyCapacity,
    todayCapacityMinutes,
    settings,
  } = useStore();

  const [schoolOff, setSchoolOff] = useState(false);
  const [tuitionOff, setTuitionOff] = useState(false);
  const [classesOff, setClassesOff] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number | null>(null);

  if (!isTodayDifferentModalOpen) return null;

  // Calculate suggested extra capacity with realistic rest buffers
  let suggestedMinutes = settings.dailyWorkCapacityMinutes || 45;
  if (schoolOff) suggestedMinutes += 120; // +2 hours from school off (with buffer)
  if (tuitionOff) suggestedMinutes += 90; // +1.5 hours from tuition off
  if (classesOff) suggestedMinutes += 90; // +1.5 hours from classes off

  // Completely free day cap (recommended max ~3h30m - 4h to avoid burnout)
  if (schoolOff && tuitionOff && classesOff) {
    suggestedMinutes = 240; // 4 hours healthy project work with rest buffers
  }

  const finalCapacity = customMinutes !== null ? customMinutes : suggestedMinutes;

  const handleApply = () => {
    if (schoolOff) setScheduleOverride('SCHOOL', true, 120, 'School Holiday');
    if (tuitionOff) setScheduleOverride('TUITION', true, 90, 'Tuition Cancelled');
    if (classesOff) setScheduleOverride('CLASSES', true, 90, 'Classes Off');

    setDailyCapacity(
      finalCapacity,
      schoolOff && tuitionOff && classesOff ? 'SCHEDULE_CALCULATED' : (schoolOff || tuitionOff || classesOff ? 'SCHEDULE_CALCULATED' : 'MANUAL'),
      'Single-day schedule variance'
    );

    setTodayDifferentModalOpen(false);
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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Today is Different</h3>
                <p className="text-xs text-muted-foreground">
                  Adjust today&apos;s availability without modifying your permanent recurring schedule.
                </p>
              </div>
            </div>

            <button
              onClick={() => setTodayDifferentModalOpen(false)}
              className="rounded-xl p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Commitment Toggles */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Commitment Changes for Today
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* School Off */}
              <button
                type="button"
                onClick={() => setSchoolOff(!schoolOff)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  schoolOff
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card/60 text-foreground hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Sun className="h-4 w-4" />
                  {schoolOff && <Check className="h-4 w-4" />}
                </div>
                <span className="text-xs font-bold">School OFF</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">+120 min free</span>
              </button>

              {/* Tuition Off */}
              <button
                type="button"
                onClick={() => setTuitionOff(!tuitionOff)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  tuitionOff
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card/60 text-foreground hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <BookOpen className="h-4 w-4" />
                  {tuitionOff && <Check className="h-4 w-4" />}
                </div>
                <span className="text-xs font-bold">Tuition OFF</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">+90 min free</span>
              </button>

              {/* Classes Off */}
              <button
                type="button"
                onClick={() => setClassesOff(!classesOff)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  classesOff
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card/60 text-foreground hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {classesOff && <Check className="h-4 w-4" />}
                </div>
                <span className="text-xs font-bold">Classes OFF</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">+90 min free</span>
              </button>
            </div>
          </div>

          {/* Suggested Capacity Summary */}
          <div className="rounded-2xl border border-border/80 bg-background/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Calculated Project Work Capacity:
              </span>
              <span className="text-sm font-black text-primary">
                {Math.floor(finalCapacity / 60)}h {finalCapacity % 60 > 0 ? `${finalCapacity % 60}m` : ''}
              </span>
            </div>

            {schoolOff && tuitionOff && classesOff ? (
              <div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Open Day detected! We recommend a focused 4h window with rest buffers to avoid burnout.</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Includes healthy recovery buffers. Your permanent schedule remains untouched.
              </p>
            )}
          </div>

          {/* Quick Override Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Or pick specific available time:
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              {[30, 45, 60, 90, 120, 180, 240].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setCustomMinutes(mins)}
                  className={`rounded-xl px-3 py-1.5 font-semibold transition-all ${
                    finalCapacity === mins
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTodayDifferentModalOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-md transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Apply for Today</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

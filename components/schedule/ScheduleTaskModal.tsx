'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Task, SmartTimeSlot } from '@/lib/types';
import { getTodayDateString, formatTime12Hour, calculateMinutesBetween, formatMinutesToTime, parseTimeToMinutes } from '@/lib/utils';
import { findSmartFreeSlots, checkScheduleConflict } from '@/lib/integrations/google/slots';
import { useCloseOnRouteChange } from '@/lib/hooks/useCloseOnRouteChange';

export function ScheduleTaskModal() {
  const {
    taskToSchedule,
    isScheduleTaskModalOpen,
    closeScheduleModal,
    scheduleTaskOnCalendar,
    scheduleEntries,
    settings,
    googleConnection,
    projects
  } = useStore();

  useCloseOnRouteChange(isScheduleTaskModalOpen, closeScheduleModal);

  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  
  // Tomorrow's date string
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrowObj = new Date(y, m - 1, d + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  // This week / Saturday date string
  const currDay = new Date(y, m - 1, d).getDay(); // 0 is Sunday
  const daysUntilSaturday = currDay === 6 ? 0 : (6 - currDay + 7) % 7;
  const satObj = new Date(y, m - 1, d + daysUntilSaturday);
  const thisWeekSatStr = satObj.toISOString().split('T')[0];

  // Next week Monday
  const nextMonObj = new Date(y, m - 1, d + ((1 - currDay + 7) % 7 || 7));
  const nextWeekMonStr = nextMonObj.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [customDateInput, setCustomDateInput] = useState<string>(todayStr);
  const [dateMode, setDateMode] = useState<'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'NEXT_WEEK' | 'CUSTOM'>('TODAY');

  const duration = taskToSchedule?.estimatedMinutes || 45;
  const [startTime, setStartTime] = useState<string>(settings.ceoBlockStart || '23:15');
  const [syncToCalendar, setSyncToCalendar] = useState<boolean>(true);
  const [overrideConflict, setOverrideConflict] = useState<boolean>(false);

  // Compute suggested smart free slots for the selected date
  const smartSlots = useMemo(() => {
    if (!taskToSchedule) return [];
    return findSmartFreeSlots(
      selectedDate,
      taskToSchedule,
      scheduleEntries,
      settings.ceoBlockStart || '23:15',
      settings.ceoBlockEnd || '00:00',
      settings.dailyWorkCapacityMinutes || 45
    );
  }, [taskToSchedule, selectedDate, scheduleEntries, settings]);

  // Compute end time from start time and duration
  const endTime = useMemo(() => {
    const sMin = parseTimeToMinutes(startTime);
    const eMin = (sMin + duration) % 1440;
    return formatMinutesToTime(eMin);
  }, [startTime, duration]);

  // Check for conflicts
  const conflictCheck = useMemo(() => {
    if (!selectedDate || !startTime || !endTime) return { hasConflict: false, overlappingEntries: [] };
    return checkScheduleConflict(selectedDate, startTime, endTime, scheduleEntries);
  }, [selectedDate, startTime, endTime, scheduleEntries]);

  if (!isScheduleTaskModalOpen || !taskToSchedule) return null;

  const project = projects.find(p => p.id === taskToSchedule.projectId);

  const handleSelectDateMode = (mode: 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'NEXT_WEEK' | 'CUSTOM') => {
    setDateMode(mode);
    if (mode === 'TODAY') setSelectedDate(todayStr);
    else if (mode === 'TOMORROW') setSelectedDate(tomorrowStr);
    else if (mode === 'THIS_WEEK') setSelectedDate(thisWeekSatStr);
    else if (mode === 'NEXT_WEEK') setSelectedDate(nextWeekMonStr);
    else setSelectedDate(customDateInput);
  };

  const handleCustomDateChange = (val: string) => {
    setCustomDateInput(val);
    setSelectedDate(val);
  };

  const handleSlotSelect = (slot: SmartTimeSlot) => {
    setStartTime(slot.startTime);
    setOverrideConflict(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictCheck.hasConflict && !overrideConflict) {
      setOverrideConflict(true);
      return;
    }
    scheduleTaskOnCalendar(taskToSchedule.id, selectedDate, startTime, endTime, syncToCalendar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Schedule Task</h2>
              <p className="text-[11px] text-muted-foreground">Set execution block on CEO OS & Google Calendar</p>
            </div>
          </div>
          <button
            onClick={closeScheduleModal}
            className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task Details Card */}
        <div className="px-5 py-3.5 bg-accent/30 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{taskToSchedule.code}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${taskToSchedule.businessCode === 'DESIGNOIA' ? '#8b5cf620' : '#3b82f620'}` }}
            >
              {taskToSchedule.businessCode}
            </span>
            {project && (
              <span className="text-xs text-muted-foreground truncate">• {project.name}</span>
            )}
            {taskToSchedule.isMustWin && (
              <span className="rounded-full bg-primary/20 px-2 py-0.2 text-[10px] font-bold text-primary">
                🎯 MUST-WIN
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground mt-1">{taskToSchedule.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duration: {duration} min
            </span>
            {taskToSchedule.dueDate && (
              <span>Due: {taskToSchedule.dueDate}</span>
            )}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* 1. Date Selection Pills */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-2">
              <span>Choose Day</span>
              <span className="text-[11px] font-mono text-primary font-bold">{selectedDate}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDateMode('TODAY')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                  dateMode === 'TODAY'
                    ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/90'
                }`}
              >
                <span>Today</span>
                <span className="text-[10px] opacity-75 font-mono">Tonight</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDateMode('TOMORROW')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                  dateMode === 'TOMORROW'
                    ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/90'
                }`}
              >
                <span>Tomorrow</span>
                <span className="text-[10px] opacity-75 font-mono">Next Day</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDateMode('THIS_WEEK')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                  dateMode === 'THIS_WEEK'
                    ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/90'
                }`}
              >
                <span>This Week</span>
                <span className="text-[10px] opacity-75 font-mono">Sat</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDateMode('CUSTOM')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                  dateMode === 'CUSTOM'
                    ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/90'
                }`}
              >
                <span>Custom Date</span>
                <span className="text-[10px] opacity-75 font-mono">Pick</span>
              </button>
            </div>

            {dateMode === 'CUSTOM' && (
              <div className="mt-2.5">
                <input
                  type="date"
                  value={customDateInput}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>
            )}
          </div>

          {/* 2. Smart Conflict-Free Suggested Slots */}
          {smartSlots.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Suggested Free Time Windows</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {smartSlots.map((slot) => {
                  const isSelected = startTime === slot.startTime;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-border bg-background hover:bg-accent/40 text-foreground'
                      }`}
                    >
                      <div>
                        <div className="font-mono text-xs font-bold">
                          {formatTime12Hour(slot.startTime)} – {formatTime12Hour(slot.endTime)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{slot.label}</div>
                      </div>
                      {slot.isRecommended && (
                        <span className="rounded-full bg-primary/20 text-primary text-[9px] font-extrabold px-1.5 py-0.2">
                          RECOMMENDED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Exact Time Range Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Execution Time Window</span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {formatTime12Hour(startTime)} – {formatTime12Hour(endTime)} ({duration} min)
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setOverrideConflict(false);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">End Time (Auto)</label>
                <input
                  type="time"
                  value={endTime}
                  disabled
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground font-mono min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* 4. Conflict Alert Banner (If Any) */}
          <AnimatePresence>
            {conflictCheck.hasConflict && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2"
              >
                <div className="flex items-start gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span>Schedule Conflict Detected</span>
                    <p className="text-[11px] font-normal text-amber-300 mt-0.5">
                      {conflictCheck.conflictMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {smartSlots.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSlotSelect(smartSlots[0])}
                      className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
                    >
                      Use Recommended ({formatTime12Hour(smartSlots[0].startTime)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOverrideConflict(true)}
                    className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {overrideConflict ? '✓ Conflict Allowed' : 'Schedule Anyway'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5. Google Calendar Sync Checkbox */}
          <div className="rounded-xl border border-border/80 p-3.5 flex items-center justify-between bg-card/60">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                <span>Create Google Calendar Event</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sets Google Task date & blocks exact time on Calendar
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-end">
              <input
                type="checkbox"
                checked={syncToCalendar}
                onChange={(e) => setSyncToCalendar(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[14px] after:right-[18px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={closeScheduleModal}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md min-h-[44px]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{conflictCheck.hasConflict && !overrideConflict ? 'Review Conflict' : 'Confirm Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

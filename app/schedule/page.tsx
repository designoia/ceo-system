'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Moon, 
  Filter, 
  BarChart3,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { ScheduleTable } from '@/components/schedule/ScheduleTable';
import { ScheduleMobileCards } from '@/components/schedule/ScheduleMobileCards';
import { PlanTomorrowModal } from '@/components/schedule/PlanTomorrowModal';
import { ScheduleBlockModal } from '@/components/schedule/ScheduleBlockModal';
import { ScheduleReviewModal } from '@/components/schedule/ScheduleReviewModal';
import { RescheduleModal } from '@/components/schedule/RescheduleModal';
import { ScheduleAnalyticsCard } from '@/components/schedule/ScheduleAnalyticsCard';
import { TodayIsDifferentModal } from '@/components/dashboard/TodayIsDifferentModal';
import { getTodayDateString } from '@/lib/utils';

export default function SchedulePage() {
  const { 
    selectedScheduleDate,
    setSelectedScheduleDate,
    scheduleDayStats,
    todayCapacityMinutes,
    settings,
    mustWinTask,
    currentMonth,
    scheduleFilterActivity,
    setScheduleFilterActivity,
    scheduleViewMode,
    setScheduleViewMode,
    setAddBlockModalOpen,
    setPlanTomorrowOpen,
    setScheduleReviewOpen,
    setTodayDifferentModalOpen
  } = useStore();

  const [rescheduleTargetEntry, setRescheduleTargetEntry] = useState<ScheduleEntry | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const isToday = selectedScheduleDate === todayStr;

  // Format current date label nicely
  const [y, m, d] = selectedScheduleDate.split('-').map(Number);
  const currentDateObj = new Date(y, m - 1, d);
  const formattedDateLabel = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrevDay = () => {
    const prev = new Date(y, m - 1, d - 1);
    setSelectedScheduleDate(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = new Date(y, m - 1, d + 1);
    setSelectedScheduleDate(next.toISOString().split('T')[0]);
  };

  const handleTodayClick = () => {
    setSelectedScheduleDate(todayStr);
  };

  const handleEditBlock = (entry: ScheduleEntry) => {
    setAddBlockModalOpen(true, entry);
  };

  const handleRescheduleBlock = (entry: ScheduleEntry) => {
    setRescheduleTargetEntry(entry);
  };

  return (
    <PageTransition className="space-y-6 max-w-7xl mx-auto">
      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Clock className="h-3.5 w-3.5" />
            <span>EXECUTIVE DAILY SCHEDULER</span>
            {isToday && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.2 text-[10px] tracking-wider">
                TODAY
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-0.5">
            {formattedDateLabel}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Planned intentions vs real-time execution recording. Continuous calibration with zero guilt.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAddBlockModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ ADD BLOCK</span>
          </button>

          <button
            onClick={() => setPlanTomorrowOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>PLAN TOMORROW</span>
          </button>

          <button
            onClick={() => setScheduleReviewOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <Moon className="h-3.5 w-3.5" />
            <span>DAY REVIEW</span>
          </button>

          <button
            onClick={() => setTodayDifferentModalOpen(true)}
            className="rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            Today is Different
          </button>
        </div>
      </div>

      {/* 2. STRATEGIC CONTEXT & REALITY BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Month Focus */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            MONTH FOCUS ({currentMonth?.yearMonth || '2026-09'})
          </span>
          <p className="text-xs font-bold text-foreground line-clamp-1">
            {currentMonth?.focusTitle || 'Foundation + Master Plan + Systems'}
          </p>
        </div>

        {/* Must Win Task */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400" />
            <span>TODAY&apos;S MUST-WIN</span>
          </span>
          <p className="text-xs font-bold text-foreground line-clamp-1">
            {mustWinTask ? mustWinTask.title : 'Finish Prorido Homepage hero section'}
          </p>
        </div>

        {/* Daily Capacity */}
        <div className="rounded-2xl border border-border bg-card/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            AVAILABLE PROJECT CAPACITY
          </span>
          <p className="text-xs font-bold text-foreground font-mono">
            {todayCapacityMinutes} min target ({settings.ceoBlockStart} – {settings.ceoBlockEnd})
          </p>
        </div>
      </div>

      {/* 3. DATE NAVIGATION & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 p-3 backdrop-blur-md">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={handleTodayClick}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              isToday
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            Today
          </button>

          <button
            onClick={handleNextDay}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Native Date Picker */}
          <input
            type="date"
            value={selectedScheduleDate}
            onChange={(e) => setSelectedScheduleDate(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Filters & View Switches */}
        <div className="flex items-center gap-2">
          {/* Activity Category Filter */}
          <select
            value={scheduleFilterActivity}
            onChange={(e) => setScheduleFilterActivity(e.target.value as ScheduleActivityType | 'ALL')}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">All Activities</option>
            <option value="SCHOOL">School</option>
            <option value="TUITION">Tuition</option>
            <option value="CLASSES">Classes</option>
            <option value="DESIGNOIA">Designoia</option>
            <option value="COL">COL</option>
            <option value="CLIKIXPRESS">Clikixpress</option>
            <option value="MEETING">Meetings</option>
            <option value="REST">Rest / Buffer</option>
          </select>

          {/* Toggle Analytics Card */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              showAnalytics
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>
      </div>

      {/* 4. PLANNED VS ACTUAL ANALYTICS CARD (COLLAPSIBLE) */}
      {showAnalytics && (
        <section aria-label="Schedule Analytics">
          <ScheduleAnalyticsCard />
        </section>
      )}

      {/* 5. MAIN SCHEDULE WORKSPACE */}
      <section aria-label="Daily Schedule Table">
        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block">
          <ScheduleTable
            onEditBlock={handleEditBlock}
            onRescheduleBlock={handleRescheduleBlock}
          />
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden">
          <ScheduleMobileCards
            onEditBlock={handleEditBlock}
            onRescheduleBlock={handleRescheduleBlock}
            onAddNewBlock={() => setAddBlockModalOpen(true)}
          />
        </div>
      </section>

      {/* 6. MODALS */}
      <PlanTomorrowModal />
      <ScheduleBlockModal />
      <ScheduleReviewModal />
      <RescheduleModal
        entry={rescheduleTargetEntry}
        onClose={() => setRescheduleTargetEntry(null)}
      />
      <TodayIsDifferentModal />
    </PageTransition>
  );
}

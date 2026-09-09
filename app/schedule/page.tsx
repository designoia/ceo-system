'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Moon,
  BarChart3,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { ExecutiveTimeline } from '@/components/schedule/ExecutiveTimeline';
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
    scheduleEntries,
    todayCapacityMinutes,
    settings,
    mustWinTask,
    scheduleFilterActivity,
    setScheduleFilterActivity,
    setAddBlockModalOpen,
    setPlanTomorrowOpen,
    setScheduleReviewOpen,
    setTodayDifferentModalOpen,
  } = useStore();

  const [rescheduleTargetEntry, setRescheduleTargetEntry] = useState<ScheduleEntry | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const isToday = selectedScheduleDate === todayStr;

  const [y, m, d] = selectedScheduleDate.split('-').map(Number);
  const currentDateObj = new Date(y, m - 1, d);
  const formattedDateLabel = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handlePrevDay = () => setSelectedScheduleDate(new Date(y, m - 1, d - 1).toISOString().split('T')[0]);
  const handleNextDay = () => setSelectedScheduleDate(new Date(y, m - 1, d + 1).toISOString().split('T')[0]);
  const handleTodayClick = () => setSelectedScheduleDate(todayStr);
  const handleEditBlock = (entry: ScheduleEntry) => setAddBlockModalOpen(true, entry);
  const handleRescheduleBlock = (entry: ScheduleEntry) => setRescheduleTargetEntry(entry);

  const dayEntries = scheduleEntries.filter(
    (e) => e.date === selectedScheduleDate && (scheduleFilterActivity === 'ALL' || e.activityType === scheduleFilterActivity)
  );

  return (
    <PageTransition className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Schedule</span>
            {isToday && <span className="rounded bg-emerald-500/15 text-emerald-500 font-semibold px-1.5 py-0.5 text-[10px]">Today</span>}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">{formattedDateLabel}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setAddBlockModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Block</span>
          </button>
          <button
            onClick={() => setPlanTomorrowOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Plan Tomorrow</span>
          </button>
          <button
            onClick={() => setScheduleReviewOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Day Review</span>
          </button>
        </div>
      </div>

      {/* Context strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
        <div className="rounded-lg border border-border px-3 py-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Must-Win</span>
          <p className="font-medium text-foreground truncate mt-0.5">{mustWinTask ? mustWinTask.title : '—'}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Capacity</span>
          <p className="font-medium text-foreground font-mono mt-0.5">
            {todayCapacityMinutes}m ({settings.ceoBlockStart}–{settings.ceoBlockEnd})
          </p>
        </div>
        <button
          onClick={() => setTodayDifferentModalOpen(true)}
          className="rounded-lg border border-border px-3 py-2 text-left text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <span className="text-[10px] uppercase tracking-wide">Adjust</span>
          <p className="font-medium mt-0.5">Today is different…</p>
        </button>
      </div>

      {/* Date nav + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button onClick={handlePrevDay} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleTodayClick}
            className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              isToday ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Today
          </button>
          <button onClick={handleNextDay} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <input
            type="date"
            value={selectedScheduleDate}
            onChange={(e) => setSelectedScheduleDate(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-[11px] font-mono text-foreground focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={scheduleFilterActivity}
            onChange={(e) => setScheduleFilterActivity(e.target.value as ScheduleActivityType | 'ALL')}
            className="rounded-md border border-border bg-transparent px-2.5 py-1 text-[11px] text-muted-foreground focus:outline-none"
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

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              showAnalytics ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>
      </div>

      {showAnalytics && (
        <section aria-label="Schedule Analytics">
          <ScheduleAnalyticsCard />
        </section>
      )}

      {/* Timeline */}
      <section aria-label="Daily Timeline">
        <div className="hidden md:block">
          <ExecutiveTimeline
            entries={dayEntries}
            onEditBlock={handleEditBlock}
            onRescheduleBlock={handleRescheduleBlock}
          />
        </div>

        <div className="md:hidden">
          <ScheduleMobileCards
            onEditBlock={handleEditBlock}
            onRescheduleBlock={handleRescheduleBlock}
            onAddNewBlock={() => setAddBlockModalOpen(true)}
          />
        </div>
      </section>

      <PlanTomorrowModal />
      <ScheduleBlockModal />
      <ScheduleReviewModal />
      <RescheduleModal entry={rescheduleTargetEntry} onClose={() => setRescheduleTargetEntry(null)} />
      <TodayIsDifferentModal />
    </PageTransition>
  );
}

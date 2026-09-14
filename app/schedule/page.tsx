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
  Wand2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { ExecutiveTimeline, TIMELINE_SLOT_DROP_PREFIX } from '@/components/schedule/ExecutiveTimeline';
import { computeAutoSchedule } from '@/lib/scheduling';
import { ScheduleMobileCards } from '@/components/schedule/ScheduleMobileCards';
import { PlanTomorrowModal } from '@/components/schedule/PlanTomorrowModal';
import { ScheduleBlockModal } from '@/components/schedule/ScheduleBlockModal';
import { ScheduleReviewModal } from '@/components/schedule/ScheduleReviewModal';
import { RescheduleModal } from '@/components/schedule/RescheduleModal';
import { ScheduleAnalyticsCard } from '@/components/schedule/ScheduleAnalyticsCard';
import { TodayIsDifferentModal } from '@/components/dashboard/TodayIsDifferentModal';
import { getTodayDateString } from '@/lib/utils';
import { ScheduleWeekView, WEEK_DAY_DROP_PREFIX } from '@/components/schedule/ScheduleWeekView';
import { ScheduleMonthView } from '@/components/schedule/ScheduleMonthView';
import { ScheduleYearView } from '@/components/schedule/ScheduleYearView';
import { addDays } from '@/lib/scheduling';
import { UnscheduledTasksPanel, UNSCHEDULED_DRAG_PREFIX } from '@/components/schedule/UnscheduledTasksPanel';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

type ScheduleViewTab = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function SchedulePage() {
  const {
    selectedScheduleDate,
    setSelectedScheduleDate,
    scheduleEntries,
    tasks,
    todayCapacityMinutes,
    settings,
    mustWinTask,
    scheduleFilterActivity,
    setScheduleFilterActivity,
    setAddBlockModalOpen,
    setPlanTomorrowOpen,
    setScheduleReviewOpen,
    setTodayDifferentModalOpen,
    scheduleTaskOnCalendar,
  } = useStore();

  const [rescheduleTargetEntry, setRescheduleTargetEntry] = useState<ScheduleEntry | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [autoScheduleMsg, setAutoScheduleMsg] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ScheduleViewTab>('DAY');
  const [yearAnchor, setYearAnchor] = useState<number>(new Date().getFullYear());

  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const isToday = selectedScheduleDate === todayStr;

  const [y, m, d] = selectedScheduleDate.split('-').map(Number);
  const currentDateObj = new Date(y, m - 1, d);
  const formattedDateLabel = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handlePrevDay = () => setSelectedScheduleDate(addDays(selectedScheduleDate, -1));
  const handleNextDay = () => setSelectedScheduleDate(addDays(selectedScheduleDate, 1));
  const handleTodayClick = () => {
    setSelectedScheduleDate(todayStr);
    setYearAnchor(new Date().getFullYear());
  };
  const handlePrevWeek = () => setSelectedScheduleDate(addDays(selectedScheduleDate, -7));
  const handleNextWeek = () => setSelectedScheduleDate(addDays(selectedScheduleDate, 7));
  const goToMonthOffset = (offset: number) => {
    const [my, mm, md] = selectedScheduleDate.split('-').map(Number);
    const next = new Date(my, mm - 1 + offset, Math.min(md, 28));
    setSelectedScheduleDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
  };
  const handleSelectDayFromOverview = (date: string) => {
    setSelectedScheduleDate(date);
    setViewTab('DAY');
  };
  const handleEditBlock = (entry: ScheduleEntry) => setAddBlockModalOpen(true, entry);
  const handleRescheduleBlock = (entry: ScheduleEntry) => setRescheduleTargetEntry(entry);

  const dayEntries = scheduleEntries.filter(
    (e) => e.date === selectedScheduleDate && (scheduleFilterActivity === 'ALL' || e.activityType === scheduleFilterActivity)
  );

  const unscheduledForDay = tasks.filter(
    (t) =>
      !t.isDeleted &&
      !t.parentTaskId &&
      t.status !== 'DONE' &&
      t.status !== 'BLOCKED' &&
      !scheduleEntries.some((e) => e.date === selectedScheduleDate && e.taskId === t.id)
  );

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    if (!activeId.startsWith(UNSCHEDULED_DRAG_PREFIX)) return;
    const taskId = (active.data.current as { taskId?: string } | undefined)?.taskId;
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const duration = task.estimatedMinutes || 45;

    const overId = String(over.id);

    if (overId.startsWith(TIMELINE_SLOT_DROP_PREFIX)) {
      const data = over.data.current as { date?: string; startMinutes?: number } | undefined;
      if (!data?.date || data.startMinutes === undefined) return;
      const startTime = minutesToTimeStr(data.startMinutes);
      const endTime = minutesToTimeStr(data.startMinutes + duration);
      scheduleTaskOnCalendar(taskId, data.date, startTime, endTime, false);
      return;
    }

    if (overId.startsWith(WEEK_DAY_DROP_PREFIX)) {
      const data = over.data.current as { date?: string } | undefined;
      if (!data?.date) return;
      const { placements } = computeAutoSchedule([task], scheduleEntries, data.date);
      if (placements.length > 0) {
        scheduleTaskOnCalendar(taskId, data.date, placements[0].startTime, placements[0].endTime, false);
      }
      return;
    }
  };

  const handleScheduleMyDay = () => {
    const { placements, unplaced } = computeAutoSchedule(unscheduledForDay, scheduleEntries, selectedScheduleDate);
    placements.forEach((p) => scheduleTaskOnCalendar(p.taskId, p.date, p.startTime, p.endTime, false));

    if (placements.length === 0) {
      setAutoScheduleMsg('Nothing to schedule — no unscheduled tasks for today.');
    } else if (unplaced.length > 0) {
      setAutoScheduleMsg(`Scheduled ${placements.length} task${placements.length > 1 ? 's' : ''}. ${unplaced.length} didn't fit — day is full.`);
    } else {
      setAutoScheduleMsg(`Scheduled ${placements.length} task${placements.length > 1 ? 's' : ''} into today's free time.`);
    }
    setTimeout(() => setAutoScheduleMsg(null), 5000);
  };

  return (
    <DndContext sensors={dndSensors} onDragEnd={handleDragEnd}>
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
            onClick={handleScheduleMyDay}
            disabled={unscheduledForDay.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Schedule My Day</span>
          </button>
          <button
            onClick={() => setAddBlockModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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

      {autoScheduleMsg && (
        <div className="rounded-lg border border-primary/25 bg-primary/[0.06] px-3.5 py-2 text-[12px] text-primary">
          {autoScheduleMsg}
        </div>
      )}

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

      {/* View switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-1 w-fit">
        {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as ScheduleViewTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-colors ${
              viewTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Date nav + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          {viewTab === 'DAY' && (
            <>
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
            </>
          )}

          {viewTab === 'WEEK' && (
            <>
              <button onClick={handlePrevWeek} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleTodayClick}
                className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                This Week
              </button>
              <button onClick={handleNextWeek} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {viewTab === 'MONTH' && (
            <>
              <button onClick={() => goToMonthOffset(-1)} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
                {currentDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => goToMonthOffset(1)} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {viewTab === 'YEAR' && (
            <>
              <button onClick={() => setYearAnchor((yy) => yy - 1)} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-foreground">{yearAnchor}</span>
              <button onClick={() => setYearAnchor((yy) => yy + 1)} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {viewTab === 'DAY' && (
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
        )}
      </div>

      {showAnalytics && viewTab === 'DAY' && (
        <section aria-label="Schedule Analytics">
          <ScheduleAnalyticsCard />
        </section>
      )}

      {/* Day view */}
      {viewTab === 'DAY' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 items-start">
          <section aria-label="Daily Timeline">
            <div className="hidden md:block">
              <ExecutiveTimeline
                entries={dayEntries}
                date={selectedScheduleDate}
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

          <div className="hidden lg:block">
            <UnscheduledTasksPanel tasks={unscheduledForDay} />
          </div>
        </div>
      )}

      {/* Week view */}
      {viewTab === 'WEEK' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 items-start">
          <section aria-label="Weekly Schedule">
            <ScheduleWeekView
              weekAnchorDate={selectedScheduleDate}
              onEditBlock={handleEditBlock}
              onSelectDay={handleSelectDayFromOverview}
            />
          </section>

          <div className="hidden lg:block">
            <UnscheduledTasksPanel tasks={unscheduledForDay} />
          </div>
        </div>
      )}

      {/* Month view */}
      {viewTab === 'MONTH' && (
        <section aria-label="Monthly Schedule">
          <ScheduleMonthView
            monthAnchorDate={selectedScheduleDate}
            onSelectDay={handleSelectDayFromOverview}
          />
        </section>
      )}

      {/* Year view */}
      {viewTab === 'YEAR' && (
        <section aria-label="Yearly Schedule Overview">
          <ScheduleYearView
            year={yearAnchor}
            onSelectDay={handleSelectDayFromOverview}
            onSelectMonth={(date) => {
              setSelectedScheduleDate(date);
              setViewTab('MONTH');
            }}
          />
        </section>
      )}

      <PlanTomorrowModal />
      <ScheduleBlockModal />
      <ScheduleReviewModal />
      <RescheduleModal entry={rescheduleTargetEntry} onClose={() => setRescheduleTargetEntry(null)} />
      <TodayIsDifferentModal />
    </PageTransition>
    </DndContext>
  );
}

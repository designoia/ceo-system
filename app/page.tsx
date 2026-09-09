'use client';

import React, { useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import { getGreeting, getFormattedDate } from '@/lib/utils';
import { CommandCenter } from '@/components/dashboard/CommandCenter';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { OverdueBanner } from '@/components/dashboard/OverdueBanner';
import { OverdueReviewModal } from '@/components/dashboard/OverdueReviewModal';
import { MustWinCarryForwardModal } from '@/components/dashboard/MustWinCarryForwardModal';
import { TodayIsDifferentModal } from '@/components/dashboard/TodayIsDifferentModal';
import { QuickTimeAdjustModal } from '@/components/dashboard/QuickTimeAdjustModal';
import { MorningPlanModal } from '@/components/dashboard/MorningPlanModal';
import { EveningReflectionModal } from '@/components/dashboard/EveningReflectionModal';
import { PlanTomorrowModal } from '@/components/schedule/PlanTomorrowModal';
import { ScheduleReviewModal } from '@/components/schedule/ScheduleReviewModal';
import { PageTransition } from '@/components/motion/PageTransition';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';

export default function HomePage() {
  const { settings, setMorningPlanOpen, setPlanTomorrowOpen, setScheduleReviewOpen, openScheduleModal } = useStore();
  const [isEveningCheckinOpen, setIsEveningCheckinOpen] = useState(false);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  return (
    <PageTransition className="space-y-5">
      {/* Date & Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {getGreeting(settings.timezone || 'Asia/Kolkata')}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {getFormattedDate(settings.timezone || 'Asia/Kolkata')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMorningPlanOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Morning Briefing</span>
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

      <OverdueBanner />

      <CommandCenter onOpenTask={(t) => setOpenTask(t)} />

      <TaskDrawer
        task={openTask}
        onClose={() => setOpenTask(null)}
        onSchedule={(t) => openScheduleModal(t)}
      />

      {/* Planning & Execution Modals */}
      <TodayIsDifferentModal />
      <QuickTimeAdjustModal />
      <MorningPlanModal />
      <EveningReflectionModal
        isOpen={isEveningCheckinOpen}
        onClose={() => setIsEveningCheckinOpen(false)}
      />
      <PlanTomorrowModal />
      <ScheduleReviewModal />
      <OverdueReviewModal />
      <MustWinCarryForwardModal />
    </PageTransition>
  );
}

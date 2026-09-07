'use client';

import React, { useState } from 'react';
import { Moon, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { getGreeting, getFormattedDate } from '@/lib/utils';
import { MustWinCard } from '@/components/dashboard/MustWinCard';
import { OptionalTasksList } from '@/components/dashboard/OptionalTasksList';
import { CeoBlockBanner } from '@/components/dashboard/CeoBlockBanner';
import { SchedulePreviewWidget } from '@/components/dashboard/SchedulePreviewWidget';
import { MomentumWidget } from '@/components/dashboard/MomentumWidget';
import { OverdueBanner } from '@/components/dashboard/OverdueBanner';
import { OverdueReviewModal } from '@/components/dashboard/OverdueReviewModal';
import { MustWinCarryForwardModal } from '@/components/dashboard/MustWinCarryForwardModal';
import { TodayCapacityCard } from '@/components/dashboard/TodayCapacityCard';
import { TodayIsDifferentModal } from '@/components/dashboard/TodayIsDifferentModal';
import { QuickTimeAdjustModal } from '@/components/dashboard/QuickTimeAdjustModal';
import { MorningPlanModal } from '@/components/dashboard/MorningPlanModal';
import { EveningReflectionModal } from '@/components/dashboard/EveningReflectionModal';
import { PlanTomorrowModal } from '@/components/schedule/PlanTomorrowModal';
import { ScheduleReviewModal } from '@/components/schedule/ScheduleReviewModal';
import { PageTransition } from '@/components/motion/PageTransition';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { settings, setMorningPlanOpen, setPlanTomorrowOpen, setScheduleReviewOpen } = useStore();
  const [isEveningCheckinOpen, setIsEveningCheckinOpen] = useState(false);

  return (
    <PageTransition className="space-y-6">
      {/* Date & Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            {getGreeting(settings.timezone || 'Asia/Kolkata')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {getFormattedDate(settings.timezone || 'Asia/Kolkata')}
          </h2>
        </div>

        {/* Quick Morning, Evening, and Night Planning triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMorningPlanOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Morning Briefing</span>
          </button>

          <button
            onClick={() => setPlanTomorrowOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Plan Tomorrow</span>
          </button>

          <button
            onClick={() => setScheduleReviewOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Day Review</span>
          </button>
        </div>
      </div>

      {/* OVERDUE TASKS BANNER (IF ANY) */}
      <OverdueBanner />

      {/* 1. PHASE 5 DAILY SCHEDULE PREVIEW WIDGET */}
      <section aria-label="Today's Schedule">
        <SchedulePreviewWidget />
      </section>

      {/* 2. PHASE 3 INTELLIGENT DAILY CAPACITY CARD */}
      <section aria-label="Today's Execution Capacity">
        <TodayCapacityCard />
      </section>

      {/* 3. DOMINANT MUST-WIN HERO CARD */}
      <section aria-label="Today's Must-Win">
        <MustWinCard />
      </section>

      {/* 4. OPTIONAL / NEXT IN QUEUE TASKS */}
      <section aria-label="Queued Tasks">
        <OptionalTasksList />
      </section>

      {/* 5. TONIGHT CEO WORK BLOCK */}
      <section aria-label="CEO Work Block">
        <CeoBlockBanner />
      </section>

      {/* 6. MOMENTUM, THIS WEEK & MONTH OVERVIEW */}
      <section aria-label="Momentum and Progress">
        <MomentumWidget />
      </section>

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

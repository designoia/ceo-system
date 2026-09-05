'use client';

import React, { useState } from 'react';
import { Moon, AlertCircle } from 'lucide-react';
import { getGreeting, getFormattedDate } from '@/lib/utils';
import { MustWinCard } from '@/components/dashboard/MustWinCard';
import { OptionalTasksList } from '@/components/dashboard/OptionalTasksList';
import { CeoBlockBanner } from '@/components/dashboard/CeoBlockBanner';
import { MomentumWidget } from '@/components/dashboard/MomentumWidget';
import { DailyCheckinModal } from '@/components/dashboard/DailyCheckinModal';
import { OverdueBanner } from '@/components/dashboard/OverdueBanner';
import { OverdueReviewModal } from '@/components/dashboard/OverdueReviewModal';
import { MustWinCarryForwardModal } from '@/components/dashboard/MustWinCarryForwardModal';
import { CapacityIndicator } from '@/components/dashboard/CapacityIndicator';
import { PageTransition } from '@/components/motion/PageTransition';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const { settings } = useStore();
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);

  return (
    <PageTransition className="space-y-6">
      {/* Date & Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            {getGreeting(settings.timezone || 'Asia/Kolkata')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {getFormattedDate(settings.timezone || 'Asia/Kolkata')}
          </h2>
        </div>

        {/* Quick Checkin trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCheckinOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <Moon className="h-3.5 w-3.5 text-primary" />
            <span>Night Check-In</span>
          </button>
        </div>
      </div>

      {/* OVERDUE TASKS BANNER (IF ANY) */}
      <OverdueBanner />

      {/* DAILY CAPACITY & TASK OVERLOAD INDICATOR */}
      <CapacityIndicator />

      {/* 1. DOMINANT MUST-WIN HERO CARD */}
      <section aria-label="Today's Must-Win">
        <MustWinCard />
      </section>

      {/* 2. OPTIONAL TASKS (MAX 2) */}
      <section aria-label="Optional Tasks">
        <OptionalTasksList />
      </section>

      {/* 3. TONIGHT CEO WORK BLOCK */}
      <section aria-label="CEO Work Block">
        <CeoBlockBanner />
      </section>

      {/* 4. MOMENTUM, THIS WEEK & MONTH OVERVIEW */}
      <section aria-label="Momentum and Progress">
        <MomentumWidget />
      </section>

      {/* Modals */}
      <DailyCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
      />
      <OverdueReviewModal />
      <MustWinCarryForwardModal />
    </PageTransition>
  );
}

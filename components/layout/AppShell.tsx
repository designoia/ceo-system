'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { QuickAddModal } from '@/components/layout/QuickAddModal';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { FocusModeModal } from '@/components/focus/FocusModeModal';
import { WelcomeBackModal } from '@/components/dashboard/WelcomeBackModal';
import { OverdueReviewModal } from '@/components/dashboard/OverdueReviewModal';
import { MustWinCarryForwardModal } from '@/components/dashboard/MustWinCarryForwardModal';
import { MilestoneCelebration } from '@/components/feedback/MilestoneCelebration';
import { ToastContainer } from '@/components/motion/ToastContainer';
import { ConnectionBanner } from '@/components/motion/ConnectionBanner';
import { ScheduleTaskModal } from '@/components/schedule/ScheduleTaskModal';
import { ConflictResolutionModal } from '@/components/integrations/ConflictResolutionModal';
import { SyncLogViewerModal } from '@/components/integrations/SyncLogViewerModal';

/**
 * The app's frame: sidebar, header, phone tab bar and the global pop-ups.
 * The compact /widget page skips all of it so it works as a small pinned window or home-screen shortcut.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/widget')) {
    return (
      <>
        <ClientOnly>{children}</ClientOnly>
        <MilestoneCelebration />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        {/* Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Main Application Column */}
        <div className="flex flex-1 flex-col overflow-x-hidden pb-20 md:pb-6">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            <ClientOnly>{children}</ClientOnly>
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Global Modals & Notifications */}
      <FocusModeModal />
      <QuickAddModal />
      <CommandPalette />
      <WelcomeBackModal />
      <OverdueReviewModal />
      <MustWinCarryForwardModal />
      <MilestoneCelebration />
      <ScheduleTaskModal />
      <ConflictResolutionModal />
      <SyncLogViewerModal />
      <ToastContainer />
      <ConnectionBanner />
    </>
  );
}

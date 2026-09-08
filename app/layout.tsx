import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAddModal } from '@/components/layout/QuickAddModal';
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

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CEO OS — 5-Year Plan → Today\'s Action',
  description: 'Personal 5-year execution operating system. Turn large vision into one clear daily action.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <StoreProvider>
          <div className="flex min-h-screen">
            {/* Desktop Navigation Sidebar */}
            <Sidebar />

            {/* Main Application Column */}
            <div className="flex flex-1 flex-col overflow-x-hidden pb-20 md:pb-6">
              <Header />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Global Modals & Notifications */}
          <FocusModeModal />
          <QuickAddModal />
          <WelcomeBackModal />
          <OverdueReviewModal />
          <MustWinCarryForwardModal />
          <MilestoneCelebration />
          <ScheduleTaskModal />
          <ConflictResolutionModal />
          <SyncLogViewerModal />
          <ToastContainer />
          <ConnectionBanner />
        </StoreProvider>
      </body>
    </html>
  );
}

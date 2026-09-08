'use client';

import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  RefreshCw, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatTime12Hour, getTodayDateString } from '@/lib/utils';

export function GoogleSyncSummaryWidget() {
  const { 
    googleConnection, 
    syncGoogleNow, 
    isSyncingGoogle, 
    scheduleEntries, 
    tasks, 
    settings,
    syncConflicts,
    setConflictModalOpen
  } = useStore();

  const isConnected = googleConnection?.status === 'CONNECTED';
  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');

  // Count fixed Google commitments for today
  const todayCommitments = scheduleEntries.filter(
    (e) => e.date === todayStr && e.sourceType === 'FIXED_COMMITMENT' && e.status !== 'CANCELLED'
  );

  // Count scheduled CEO tasks with Google Calendar sync
  const todayScheduledTasks = scheduleEntries.filter(
    (e) => e.date === todayStr && e.sourceType === 'CEO_OS_TASK' && e.googleCalendarEventId && e.status !== 'CANCELLED'
  );

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-blue-500/5 via-card to-purple-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Google Tasks & Calendar Sync Available</h4>
            <p className="text-[11px] text-muted-foreground">
              Connect Google to capture tasks anywhere and schedule execution blocks directly on Calendar.
            </p>
          </div>
        </div>
        <Link
          href="/settings?tab=integrations"
          className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shrink-0 min-h-[40px] flex items-center justify-center"
        >
          Connect Google
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-foreground">Google Sync Active</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            ({googleConnection.googleAccountEmail})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {syncConflicts.length > 0 && (
            <button
              onClick={() => setConflictModalOpen(true, syncConflicts[0])}
              className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-bounce"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{syncConflicts.length} Conflict</span>
            </button>
          )}

          <button
            onClick={() => syncGoogleNow('CEO_OS')}
            disabled={isSyncingGoogle}
            className="flex items-center gap-1 rounded-lg bg-muted/60 hover:bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors disabled:opacity-50 min-h-[32px]"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
            <span>{isSyncingGoogle ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-2.5">
          <span className="text-[10px] text-muted-foreground font-bold uppercase block">Calendar Commitments</span>
          <div className="text-sm font-bold text-blue-400 mt-0.5">
            {todayCommitments.length} today
          </div>
        </div>

        <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-2.5">
          <span className="text-[10px] text-muted-foreground font-bold uppercase block">Scheduled on Calendar</span>
          <div className="text-sm font-bold text-purple-400 mt-0.5">
            {todayScheduledTasks.length} blocks
          </div>
        </div>

        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-2.5 col-span-2 sm:col-span-1 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase block">Planning Layer</span>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>CEO OS Master</span>
            </div>
          </div>
          <Link
            href="/schedule"
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <span>Timeline</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

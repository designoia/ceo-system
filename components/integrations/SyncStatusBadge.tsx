'use client';

import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle, CloudOff, Calendar, Check } from 'lucide-react';
import { SyncStatus, TaskSource } from '@/lib/types';

interface SyncStatusBadgeProps {
  source?: TaskSource;
  syncStatus?: SyncStatus;
  hasCalendarEvent?: boolean;
  isCompact?: boolean;
  className?: string;
}

export function SyncStatusBadge({
  source,
  syncStatus = 'SYNCED',
  hasCalendarEvent = false,
  isCompact = false,
  className = '',
}: SyncStatusBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Source pill */}
      {source === 'GOOGLE_TASKS' ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
          <span>Google Tasks</span>
          <Check className="h-2.5 w-2.5" />
        </span>
      ) : source === 'CEO_OS' ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
          <span>CEO OS</span>
        </span>
      ) : null}

      {/* Calendar Scheduled indicator */}
      {hasCalendarEvent && (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
          <Calendar className="h-2.5 w-2.5" />
          {!isCompact && <span>Calendar</span>}
        </span>
      )}

      {/* Sync status indicator */}
      {syncStatus === 'SYNCING' && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          {!isCompact && <span>Syncing...</span>}
        </span>
      )}

      {syncStatus === 'CONFLICT' && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
          <AlertCircle className="h-2.5 w-2.5" />
          <span>Conflict</span>
        </span>
      )}

      {syncStatus === 'PENDING_SYNC' && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {!isCompact && <span>Pending</span>}
        </span>
      )}
    </div>
  );
}

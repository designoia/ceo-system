'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { useStore } from '@/lib/store';

function timeAgo(iso?: string): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Compact, always-truthful sync status — never silently fails. Shows one
 * of: Not connected, Syncing, Needs attention, Synced (with last-synced time).
 */
export function SyncStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { googleConnection, isSyncingGoogle, googleSyncLogs } = useStore();

  const recentError = googleSyncLogs.find((l) => l.isError);
  const needsAttention =
    googleConnection?.status === 'REAUTH_REQUIRED' || googleConnection?.status === 'ERROR' || Boolean(recentError);

  let state: 'disconnected' | 'syncing' | 'attention' | 'synced' = 'disconnected';
  if (googleConnection?.status === 'CONNECTED') {
    state = isSyncingGoogle ? 'syncing' : needsAttention ? 'attention' : 'synced';
  } else if (needsAttention) {
    state = 'attention';
  }

  const config = {
    disconnected: { icon: CloudOff, label: 'Not connected', color: 'text-muted-foreground' },
    syncing: { icon: RefreshCw, label: 'Syncing…', color: 'text-primary' },
    attention: { icon: AlertTriangle, label: 'Needs attention', color: 'text-amber-500' },
    synced: { icon: CheckCircle2, label: 'Synced', color: 'text-emerald-500' },
  }[state];

  const Icon = config.icon;

  return (
    <Link
      href="/settings"
      className={`flex items-center gap-1.5 ${compact ? 'text-[11px]' : 'text-[12px]'} ${config.color} hover:opacity-80 transition-opacity`}
    >
      <Icon className={`h-3.5 w-3.5 ${state === 'syncing' ? 'animate-spin' : ''}`} />
      <span className="font-medium">{config.label}</span>
      {state === 'synced' && (
        <span className="text-muted-foreground font-mono">· {timeAgo(googleConnection?.lastSyncAt)}</span>
      )}
    </Link>
  );
}

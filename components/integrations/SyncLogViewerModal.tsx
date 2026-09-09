'use client';

import React from 'react';
import { X, Activity, CheckCircle2, AlertCircle, Calendar, ArrowDownUp, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCloseOnRouteChange } from '@/lib/hooks/useCloseOnRouteChange';

export function SyncLogViewerModal() {
  const { isSyncLogViewerOpen, setSyncLogViewerOpen, googleSyncLogs } = useStore();

  useCloseOnRouteChange(isSyncLogViewerOpen, () => setSyncLogViewerOpen(false));

  if (!isSyncLogViewerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Google Integration Audit Logs</h2>
              <p className="text-[11px] text-muted-foreground">Historical record of all tasks and calendar sync events</p>
            </div>
          </div>
          <button
            onClick={() => setSyncLogViewerOpen(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Logs List */}
        <div className="p-5 space-y-2.5 overflow-y-auto flex-1 font-mono text-xs">
          {googleSyncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sync logs recorded yet.</div>
          ) : (
            googleSyncLogs.map((log) => {
              const isErr = log.isError || log.eventType === 'SYNC_FAILED';
              const isConflict = log.eventType === 'SYNC_CONFLICT';
              const isCompleted = log.eventType === 'SYNC_COMPLETED' || log.eventType === 'GOOGLE_TASK_COMPLETED';

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                    isErr
                      ? 'border-destructive/40 bg-destructive/5 text-destructive'
                      : isConflict
                      ? 'border-amber-500/40 bg-amber-500/5 text-amber-300'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                      : 'border-border/80 bg-background/60 text-foreground'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isErr ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : isConflict ? (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[11px]">{log.eventType}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-muted-foreground">{log.details}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/80 px-5 py-3 bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={() => setSyncLogViewerOpen(false)}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

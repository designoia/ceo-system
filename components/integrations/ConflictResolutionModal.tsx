'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCloseOnRouteChange } from '@/lib/hooks/useCloseOnRouteChange';

export function ConflictResolutionModal() {
  const {
    conflictModalOpen,
    setConflictModalOpen,
    conflictToResolve,
    resolveSyncConflict
  } = useStore();

  useCloseOnRouteChange(conflictModalOpen, () => setConflictModalOpen(false));

  if (!conflictModalOpen || !conflictToResolve) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-amber-500/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Sync Conflict Detected</h2>
              <p className="text-[11px] text-muted-foreground">This task was modified in both CEO OS and Google Tasks</p>
            </div>
          </div>
          <button
            onClick={() => setConflictModalOpen(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Select which version you would like to keep. Your choice will update both systems and maintain synchronization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CEO OS Version */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">CEO OS Version</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(conflictToResolve.ceoUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">{conflictToResolve.ceoTitle}</div>
                <div className="text-[11px] text-muted-foreground">
                  Status: <span className="font-bold text-foreground">{conflictToResolve.ceoCompleted ? 'DONE' : 'Active'}</span>
                </div>
                {conflictToResolve.ceoDueDate && (
                  <div className="text-[11px] text-muted-foreground">
                    Due: <span className="font-mono text-foreground">{conflictToResolve.ceoDueDate}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => resolveSyncConflict(conflictToResolve.id, 'KEEP_CEO_OS')}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Keep CEO OS Version</span>
              </button>
            </div>

            {/* Google Tasks Version */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">Google Tasks Version</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(conflictToResolve.googleUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">{conflictToResolve.googleTitle}</div>
                <div className="text-[11px] text-muted-foreground">
                  Status: <span className="font-bold text-foreground">{conflictToResolve.googleCompleted ? 'DONE' : 'Active'}</span>
                </div>
                {conflictToResolve.googleDueDate && (
                  <div className="text-[11px] text-muted-foreground">
                    Due: <span className="font-mono text-foreground">{conflictToResolve.googleDueDate}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => resolveSyncConflict(conflictToResolve.id, 'KEEP_GOOGLE')}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Keep Google Tasks Version</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/80 px-5 py-3 bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={() => setConflictModalOpen(false)}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}

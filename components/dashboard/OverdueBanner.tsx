'use client';

import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';

export function OverdueBanner() {
  const { overdueTasks, setOverdueReviewOpen } = useStore();

  if (overdueTasks.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card px-4 py-3 text-amber-500 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold text-foreground">
          {overdueTasks.length} {overdueTasks.length === 1 ? 'task needs' : 'tasks need'} attention.
        </span>
      </div>

      <button
        onClick={() => setOverdueReviewOpen(true)}
        className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-500 hover:bg-amber-500/30 transition-colors shadow-sm shrink-0"
      >
        <span>REVIEW</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

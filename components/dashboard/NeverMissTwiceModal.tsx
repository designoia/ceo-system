'use client';

import React from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';

export function NeverMissTwiceModal() {
  const { yesterdayMissedTask, resolveYesterdayMissed } = useStore();

  if (!yesterdayMissedTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-bold text-foreground">
            Yesterday's Task Check
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            What should happen with &ldquo;{yesterdayMissedTask.title}&rdquo;?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-2 text-xs font-semibold">
          <button
            onClick={() => resolveYesterdayMissed('CONTINUE_TODAY')}
            className="rounded-xl bg-primary py-2.5 text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Continue as MUST-WIN Today
          </button>

          <button
            onClick={() => resolveYesterdayMissed('THIS_WEEK')}
            className="rounded-xl border border-border bg-accent/60 py-2.5 text-foreground hover:bg-accent transition-colors"
          >
            Move to This Week
          </button>

          <button
            onClick={() => resolveYesterdayMissed('NEXT')}
            className="rounded-xl border border-border bg-accent/40 py-2.5 text-foreground hover:bg-accent transition-colors"
          >
            Move to Next (Unscheduled)
          </button>

          <button
            onClick={() => resolveYesterdayMissed('BACKLOG')}
            className="rounded-xl border border-border py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Move to Backlog
          </button>

          <button
            onClick={() => resolveYesterdayMissed('DROP')}
            className="rounded-xl py-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Drop / Cancel Task
          </button>
        </div>
      </div>
    </div>
  );
}

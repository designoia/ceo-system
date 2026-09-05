'use client';

import React from 'react';
import { Rocket, Play, Moon } from 'lucide-react';
import { useStore } from '@/lib/store';

export function CeoBlockBanner() {
  const { settings, mustWinTask, startFocus } = useStore();

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                TONIGHT'S WINDOW
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Moon className="h-3 w-3" />
                {settings.ceoBlockStart} – {settings.ceoBlockEnd}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground mt-0.5">
              🚀 CEO WORK BLOCK
            </h4>
            <p className="text-xs text-muted-foreground">
              {mustWinTask ? `Target: ${mustWinTask.title}` : 'Ready for nightly focused session.'}
            </p>
          </div>
        </div>

        {mustWinTask && (
          <button
            onClick={() => startFocus(mustWinTask, 'NORMAL')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>START BLOCK</span>
          </button>
        )}
      </div>
    </div>
  );
}

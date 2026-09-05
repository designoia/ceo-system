'use client';

import React from 'react';
import { Sparkles, Target, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';

export function MustWinCarryForwardModal() {
  const { mustWinCarryForwardTask, resolveMustWinCarryForward, projects } = useStore();

  if (!mustWinCarryForwardTask) return null;

  const project = projects.find((p) => p.id === mustWinCarryForwardTask.projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Target className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground">
            WELCOME BACK 👋
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Yesterday's MUST-WIN wasn't completed:
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background/80 p-4 text-left space-y-1">
          {project && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
              {project.name}
            </span>
          )}
          <h3 className="text-sm font-bold text-foreground">
            &ldquo;{mustWinCarryForwardTask.title}&rdquo;
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Estimated: {mustWinCarryForwardTask.estimatedMinutes || 45} min
          </p>
        </div>

        <p className="text-xs font-medium text-foreground">
          Was this still the most important thing?
        </p>

        <div className="flex flex-col gap-2 pt-1 text-xs font-semibold">
          <button
            onClick={() => resolveMustWinCarryForward(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Target className="h-4 w-4" />
            <span>MAKE TODAY'S MUST-WIN</span>
          </button>

          <button
            onClick={() => resolveMustWinCarryForward(false)}
            className="rounded-xl border border-border bg-accent py-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            CHOOSE SOMETHING ELSE
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useStore } from '@/lib/store';

export function WelcomeBackModal() {
  const { welcomeBackInfo, dismissWelcomeBack, startFocus, projects } = useStore();

  if (!welcomeBackInfo || !welcomeBackInfo.isReturning) return null;

  const lastTask = welcomeBackInfo.lastTask;
  const project = projects.find((p) => p.id === lastTask?.projectId);

  const handleResume = () => {
    if (lastTask) {
      startFocus(lastTask, 'NORMAL');
    }
    dismissWelcomeBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            WELCOME BACK 👋
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            No problem. Let's continue without missing a beat.
          </p>
        </div>

        {lastTask && (
          <div className="rounded-2xl border border-border bg-background/80 p-4 text-left space-y-1">
            {project && (
              <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                {project.name}
              </span>
            )}
            <h3 className="text-sm font-semibold text-foreground">
              {lastTask.title}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Ready to jump right back in for a focused 45m session.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={dismissWelcomeBack}
            className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            I'll pick another
          </button>

          {lastTask && (
            <button
              onClick={handleResume}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span>RESUME</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

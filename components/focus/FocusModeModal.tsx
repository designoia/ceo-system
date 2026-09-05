'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  X, 
  PlusCircle, 
  AlertCircle, 
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '@/lib/store';
import { formatTimer } from '@/lib/utils';
import { NotificationService } from '@/lib/notification-service';

export function FocusModeModal() {
  const { 
    activeFocusTask, 
    focusMode, 
    stopFocus, 
    completeTask, 
    completeRescueAction,
    updateTask,
    projects,
    businesses
  } = useStore();

  const isRescue = focusMode === 'RESCUE_10MIN';
  const initialSeconds = isRescue ? 10 * 60 : (activeFocusTask?.estimatedMinutes || 45) * 60;

  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [showCompletionOptions, setShowCompletionOptions] = useState(false);
  const [showBlockReason, setShowBlockReason] = useState(false);
  const [blockReasonText, setBlockReasonText] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play start chime on launch
  useEffect(() => {
    if (activeFocusTask) {
      setSecondsRemaining(initialSeconds);
      setIsActive(true);
      setShowCompletionOptions(false);
      setShowBlockReason(false);
      setExecutionNotes('');
      NotificationService.playChime('start');
    }
  }, [activeFocusTask, initialSeconds]);

  // Countdown loop
  useEffect(() => {
    if (!activeFocusTask || !isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          NotificationService.playChime('complete');
          setShowCompletionOptions(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeFocusTask, isActive]);

  if (!activeFocusTask) return null;

  const project = projects.find((p) => p.id === activeFocusTask.projectId);
  const business = businesses.find((b) => b.code === activeFocusTask.businessCode);

  const handleFinishDone = () => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // Confetti fallback
    }

    NotificationService.playChime('complete');

    if (isRescue) {
      completeRescueAction(activeFocusTask.id, executionNotes);
    } else {
      completeTask(
        activeFocusTask.id, 
        Math.round((initialSeconds - secondsRemaining) / 60) || 45, 
        executionNotes
      );
    }
  };

  const handleAddMoreTime = (additionalMins: number) => {
    setSecondsRemaining((prev) => prev + additionalMins * 60);
    setIsActive(true);
    setShowCompletionOptions(false);
  };

  const handleMarkBlocked = () => {
    if (!blockReasonText.trim()) return;
    updateTask(activeFocusTask.id, {
      status: 'BLOCKED',
      blockReason: blockReasonText.trim(),
    });
    stopFocus();
  };

  const handlePostpone = (target: 'THIS_WEEK' | 'NEXT') => {
    updateTask(activeFocusTask.id, {
      status: target,
      isMustWin: false,
    });
    stopFocus();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background/95 p-6 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex w-full max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          {isRescue ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
              <Zap className="h-3.5 w-3.5" />
              10-MINUTE RESCUE MODE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              CEO FOCUS WORKSPACE
            </span>
          )}
          {business && (
            <span className="text-xs font-medium text-muted-foreground">
              • {business.name}
            </span>
          )}
        </div>

        <button
          onClick={stopFocus}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit Focus</span>
        </button>
      </div>

      {/* Main Execution Core */}
      <div className="my-auto flex flex-col items-center text-center max-w-xl w-full">
        {project && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            {project.name}
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl max-w-lg">
          {activeFocusTask.title}
        </h2>

        {isRescue && activeFocusTask.rescueAction && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left w-full">
            <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
              ⚡ 10-Minute Minimum Action
            </div>
            <p className="text-sm font-medium text-foreground">
              {activeFocusTask.rescueAction}
            </p>
          </div>
        )}

        {/* Large Timer Display */}
        <div className="my-8 flex flex-col items-center">
          <div className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tighter text-foreground">
            {formatTimer(secondsRemaining)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isActive ? 'Session in progress...' : 'Paused'}
          </p>
        </div>

        {/* Primary Controls */}
        {!showCompletionOptions && !showBlockReason && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-all shadow-sm"
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCompletionOptions(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Session</span>
            </button>

            <button
              onClick={() => setShowBlockReason(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-3 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Blocked?</span>
            </button>
          </div>
        )}

        {/* Completion Review Panel */}
        {showCompletionOptions && (
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-150 text-left space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              {isRescue ? 'Completed 10-Minute Rescue Action?' : 'Did you finish this task?'}
            </h3>

            <div>
              <input
                type="text"
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                placeholder="Optional progress note (e.g. Uploaded 10th chemistry PDF)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleFinishDone}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>YES, DONE</span>
              </button>

              <button
                onClick={() => handleAddMoreTime(15)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-accent px-4 py-3 text-xs font-medium text-foreground hover:bg-accent/80 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+15 More Minutes</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <button
                onClick={() => handlePostpone('THIS_WEEK')}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Move to This Week
              </button>
              <button
                onClick={() => handlePostpone('NEXT')}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Move to Next
              </button>
            </div>
          </div>
        )}

        {/* Block Reason Panel */}
        {showBlockReason && (
          <div className="w-full rounded-2xl border border-destructive/20 bg-card p-6 shadow-xl animate-in zoom-in-95 duration-150 text-left space-y-4">
            <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>What is blocking this task?</span>
            </div>

            <textarea
              rows={2}
              value={blockReasonText}
              onChange={(e) => setBlockReasonText(e.target.value)}
              placeholder="e.g. Meta verification requires updated tax document"
              className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBlockReason(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkBlocked}
                disabled={!blockReasonText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                <span>Mark Blocked & Exit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes preview */}
      {activeFocusTask.notes && (
        <div className="w-full max-w-md rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Task Notes:</span> {activeFocusTask.notes}
        </div>
      )}
    </div>
  );
}

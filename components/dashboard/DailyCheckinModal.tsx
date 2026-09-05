'use client';

import React, { useState } from 'react';
import { Moon, CheckCircle2, XCircle, Flame, Meh, Frown, Smile, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { EnergyLevel, MissedReason } from '@/lib/types';
import { getTodayDateString } from '@/lib/utils';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MISSED_REASONS: MissedReason[] = [
  'No time',
  'Too tired',
  'Forgot',
  'Task too large',
  'Unexpected work',
  'Blocked',
  'Other',
];

export function DailyCheckinModal({ isOpen, onClose }: DailyCheckinModalProps) {
  const { mustWinTask, addDailyCheckin, completeTask } = useStore();

  const [isDone, setIsDone] = useState<boolean>(true);
  const [energy, setEnergy] = useState<EnergyLevel>('good');
  const [reason, setReason] = useState<MissedReason>('Too tired');
  const [accomplishments, setAccomplishments] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDone && mustWinTask) {
      completeTask(mustWinTask.id);
    }

    addDailyCheckin({
      date: getTodayDateString(),
      mustWinCompleted: isDone,
      energyRating: energy,
      missedReason: isDone ? undefined : reason,
      accomplishments: accomplishments.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Moon className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-foreground">Night Check-In (2 Min)</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Must-Win Outcome */}
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              Today's Must-Win: {mustWinTask ? `"${mustWinTask.title}"` : 'Your Primary Task'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDone(true)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 font-semibold transition-all ${
                  isDone
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>DONE</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDone(false)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 font-semibold transition-all ${
                  !isDone
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span>NOT DONE</span>
              </button>
            </div>
          </div>

          {/* Energy Rating */}
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">
              How is your energy right now?
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setEnergy('exhausted')}
                className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                  energy === 'exhausted'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">😫</span>
                <span className="text-[10px] mt-0.5">Exhausted</span>
              </button>

              <button
                type="button"
                onClick={() => setEnergy('neutral')}
                className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                  energy === 'neutral'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">😐</span>
                <span className="text-[10px] mt-0.5">Neutral</span>
              </button>

              <button
                type="button"
                onClick={() => setEnergy('good')}
                className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                  energy === 'good'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">🙂</span>
                <span className="text-[10px] mt-0.5">Good</span>
              </button>

              <button
                type="button"
                onClick={() => setEnergy('fire')}
                className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                  energy === 'fire'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">🔥</span>
                <span className="text-[10px] mt-0.5">Firing</span>
              </button>
            </div>
          </div>

          {/* Reason if not done */}
          {!isDone && (
            <div>
              <label className="mb-1 block font-semibold text-foreground">
                Main reason:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as MissedReason)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none"
              >
                {MISSED_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Accomplishment */}
          <div>
            <label className="mb-1 block font-semibold text-foreground">
              Optional: What did you accomplish?
            </label>
            <input
              type="text"
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
              placeholder="e.g. Cleared 10th science review notes"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Complete Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

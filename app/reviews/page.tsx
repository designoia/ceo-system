'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  CheckSquare, 
  Flame,
  FileText
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { getTodayDateString } from '@/lib/utils';
import { WeeklyReview, MonthlyReview } from '@/lib/types';

export default function ReviewsPage() {
  const { 
    tasks, 
    projects, 
    currentMonth, 
    meaningfulDaysThisWeek, 
    weeklyReviews, 
    monthlyReviews, 
    addWeeklyReview, 
    addMonthlyReview 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

  // Weekly review form state
  const [nextWeekOutcome, setNextWeekOutcome] = useState('');
  const [weeklyKeyLearning, setWeeklyKeyLearning] = useState('');
  const [weeklySaved, setWeeklySaved] = useState(false);

  // Monthly review form state
  const [majorWins, setMajorWins] = useState('');
  const [majorBlockers, setMajorBlockers] = useState('');
  const [whatToContinue, setWhatToContinue] = useState('');
  const [whatToStop, setWhatToStop] = useState('');
  const [whatToChange, setWhatToChange] = useState('');
  const [monthlySaved, setMonthlySaved] = useState(false);

  const completedTasks = tasks.filter((t) => t.status === 'DONE');
  const thisWeekTasks = tasks.filter(
    (t) => t.status === 'THIS_WEEK' || t.status === 'TODAY' || (t.status === 'DONE' && t.completedAt)
  );

  const handleSaveWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextWeekOutcome.trim()) return;

    addWeeklyReview({
      weekStart: getTodayDateString(),
      tasksPlanned: thisWeekTasks.length,
      tasksCompleted: completedTasks.length,
      mustWinsCompleted: 5,
      keyLearning: weeklyKeyLearning.trim() || undefined,
      nextWeekOneOutcome: nextWeekOutcome.trim(),
    });

    setWeeklySaved(true);
    setTimeout(() => setWeeklySaved(false), 3000);
  };

  const handleSaveMonthly = (e: React.FormEvent) => {
    e.preventDefault();

    addMonthlyReview({
      yearMonth: currentMonth?.yearMonth || '2026-09',
      majorWins: majorWins.trim(),
      majorBlockers: majorBlockers.trim(),
      whatToContinue: whatToContinue.trim(),
      whatToStop: whatToStop.trim(),
      whatToChange: whatToChange.trim(),
    });

    setMonthlySaved(true);
    setTimeout(() => setMonthlySaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            CALIBRATION & REFLECTION
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Reviews & Planning
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Brief weekly and monthly checkpoints to ensure daily work compounds toward 5-year goals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab('WEEKLY')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'WEEKLY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Weekly Review & Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('MONTHLY')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'MONTHLY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Monthly Review</span>
          </button>
        </div>
      </div>

      {/* WEEKLY REVIEW */}
      {activeTab === 'WEEKLY' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Tasks Completed
              </span>
              <div className="text-xl font-extrabold text-foreground mt-1">
                {completedTasks.length}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Must-Wins Done
              </span>
              <div className="text-xl font-extrabold text-primary mt-1">
                {meaningfulDaysThisWeek}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Meaningful Days
              </span>
              <div className="text-xl font-extrabold text-amber-500 mt-1 flex items-center gap-1">
                🔥 {meaningfulDaysThisWeek}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Active Projects
              </span>
              <div className="text-xl font-extrabold text-foreground mt-1">
                {projects.filter((p) => p.status === 'ACTIVE').length}
              </div>
            </div>
          </div>

          {/* Weekly Planning Card */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                STRATEGIC ALIGNMENT
              </div>
              <h3 className="text-base font-bold text-foreground">
                Next Week Planning ({currentMonth?.focusTitle})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keep next week's plan laser-focused on 3–7 core tasks.
              </p>
            </div>

            <form onSubmit={handleSaveWeekly} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-foreground">
                  What is the ONE most important outcome for next week? *
                </label>
                <input
                  type="text"
                  value={nextWeekOutcome}
                  onChange={(e) => setNextWeekOutcome(e.target.value)}
                  placeholder="e.g. Upload 10th and 11th notes and connect FB automated workflow"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm font-medium"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-foreground">
                  Key execution learning / adjustment:
                </label>
                <textarea
                  rows={2}
                  value={weeklyKeyLearning}
                  onChange={(e) => setWeeklyKeyLearning(e.target.value)}
                  placeholder="e.g. 10-minute rescue actions kept momentum alive even on late tuition nights."
                  className="w-full rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                {weeklySaved ? (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Weekly plan saved.
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  disabled={!nextWeekOutcome.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <span>ACCEPT & LOCK PLAN</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MONTHLY REVIEW */}
      {activeTab === 'MONTHLY' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                MONTH CLOSEOUT • {currentMonth?.yearMonth}
              </span>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {currentMonth?.focusTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                Target Outcome: {currentMonth?.targetOutcome}
              </p>
            </div>

            <form onSubmit={handleSaveMonthly} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    Major Wins This Month:
                  </label>
                  <textarea
                    rows={3}
                    value={majorWins}
                    onChange={(e) => setMajorWins(e.target.value)}
                    placeholder="e.g. Completed notes pipeline, automated posting workflows live."
                    className="w-full rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    Major Obstacles / Bottlenecks:
                  </label>
                  <textarea
                    rows={3}
                    value={majorBlockers}
                    onChange={(e) => setMajorBlockers(e.target.value)}
                    placeholder="e.g. Late tuition batches limited energy on Wednesdays."
                    className="w-full rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    What Should CONTINUE?
                  </label>
                  <textarea
                    rows={2}
                    value={whatToContinue}
                    onChange={(e) => setWhatToContinue(e.target.value)}
                    placeholder="e.g. 45-minute strict timer at 11:15 PM."
                    className="w-full rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">
                    What Should STOP / CHANGE?
                  </label>
                  <textarea
                    rows={2}
                    value={whatToStop}
                    onChange={(e) => setWhatToStop(e.target.value)}
                    placeholder="e.g. Stop opening 6 concurrent projects."
                    className="w-full rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                {monthlySaved ? (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Monthly calibration saved.
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Save Monthly Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

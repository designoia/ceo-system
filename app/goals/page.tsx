'use client';

import React, { useState } from 'react';
import { 
  Target, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Building,
  GraduationCap,
  Package,
  User
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BusinessCode, Goal, StrategicMonth } from '@/lib/types';

export default function GoalsPage() {
  const { 
    goals, 
    months, 
    businesses, 
    addGoal, 
    updateGoal, 
    updateMonth 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'VISION' | 'ROADMAP'>('ROADMAP');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessCode | 'ALL'>('ALL');
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalBiz, setNewGoalBiz] = useState<BusinessCode>('COL');
  const [newGoalYear, setNewGoalYear] = useState(2028);

  const filteredGoals = selectedBusiness === 'ALL'
    ? goals
    : goals.filter((g) => g.businessCode === selectedBusiness);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    addGoal({
      businessCode: newGoalBiz,
      title: newGoalTitle.trim(),
      category: 'system',
      targetYear: newGoalYear,
      isCompleted: false,
    });

    setNewGoalTitle('');
  };

  const getBizIcon = (code: BusinessCode) => {
    switch (code) {
      case 'COL': return <GraduationCap className="h-4 w-4" />;
      case 'DESIGNOIA': return <Sparkles className="h-4 w-4" />;
      case 'CLIKIXPRESS': return <Package className="h-4 w-4" />;
      case 'PERSONAL': return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            STRATEGIC ARCHITECTURE
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            5-Year Vision & Roadmap
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The long-term master plan that quietly steers your daily actions.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab('ROADMAP')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'ROADMAP'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>60-Month Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('VISION')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'VISION'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>5-Year Goals</span>
          </button>
        </div>
      </div>

      {/* 60-MONTH ROADMAP VIEW */}
      {activeTab === 'ROADMAP' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Strategic Monthly Sequence (2026 – 2031)</h3>
                <p className="text-xs text-muted-foreground">
                  Each month provides clarity of focus so you only conquer one major theme at a time.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((m: StrategicMonth) => (
              <div
                key={m.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  m.isCurrent
                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/30'
                    : 'border-border bg-card/60 hover:border-border/90 hover:bg-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {m.yearMonth}
                    </span>
                    {m.isCurrent && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        CURRENT FOCUS
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-foreground mt-1">
                    {m.focusTitle}
                  </h4>

                  <p className="text-xs text-muted-foreground mt-1">
                    {m.targetOutcome}
                  </p>

                  {m.kpis && m.kpis.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Key Deliverables:
                      </div>
                      <ul className="space-y-1">
                        {m.kpis.map((kpi, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1.5 text-[11px] text-foreground/80"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{kpi}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {m.definitionOfDone && (
                  <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Done When:</span> {m.definitionOfDone}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-YEAR GOALS VIEW */}
      {activeTab === 'VISION' && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedBusiness('ALL')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedBusiness === 'ALL'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              All Focus Areas
            </button>

            {businesses.map((biz) => (
              <button
                key={biz.code}
                onClick={() => setSelectedBusiness(biz.code)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedBusiness === biz.code
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {getBizIcon(biz.code)}
                <span>{biz.name}</span>
              </button>
            ))}
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal: Goal) => {
              const biz = businesses.find((b) => b.code === goal.businessCode);
              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-border bg-card/60 p-5 space-y-3 hover:border-border/90 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${biz?.color || '#3b82f6'}18`,
                        color: biz?.color || '#3b82f6',
                      }}
                    >
                      {goal.businessCode}
                    </span>

                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      Target: {goal.targetYear}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground">
                    {goal.title}
                  </h4>

                  {goal.targetMetric && (
                    <div className="rounded-xl bg-background/60 p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Target Metric:</span>
                        <span className="font-semibold text-foreground">{goal.targetMetric}</span>
                      </div>
                      {goal.currentMetric && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Current Status:</span>
                          <span className="text-primary font-medium">{goal.currentMetric}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => updateGoal(goal.id, { isCompleted: !goal.isCompleted })}
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        goal.isCompleted
                          ? 'text-emerald-500'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{goal.isCompleted ? 'Goal Achieved' : 'In Progress'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Goal */}
          <form
            onSubmit={handleAddGoal}
            className="rounded-2xl border border-dashed border-border bg-card/40 p-5 space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Add New Long-Term Goal
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Goal title (e.g. Expand to 5 centers or Purchase Car)"
                className="flex-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />

              <select
                value={newGoalBiz}
                onChange={(e) => setNewGoalBiz(e.target.value as BusinessCode)}
                className="w-full sm:w-auto rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
              >
                {businesses.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={newGoalYear}
                onChange={(e) => setNewGoalYear(Number(e.target.value))}
                className="w-full sm:w-auto rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none font-mono"
              >
                {[2026, 2027, 2028, 2029, 2030, 2031].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!newGoalTitle.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Goal</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

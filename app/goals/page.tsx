'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCalendarFilter } from '@/lib/hooks/useCalendarFilter';
import { Goal } from '@/lib/types';
import { NO_CAL_COLOR, topLevel } from '@/lib/work';
import { PageTransition } from '@/components/motion/PageTransition';
import { CalendarChips } from '@/components/work/CalendarChips';
import { AddLine, EmptyCard, Label, Pill, ProgressBar, Sheet } from '@/components/work/ui';

const THIS_YEAR = new Date().getFullYear();

export default function GoalsPage() {
  const { goals, projects, tasks, businesses, addGoal, updateGoal, deleteGoal } = useStore();
  const [filter, setFilter] = useCalendarFilter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [more, setMore] = useState(false);

  const color = (code: string) => businesses.find((b) => b.code === code)?.color ?? NO_CAL_COLOR;

  // A goal's progress is the average progress of the projects linked to it.
  const progressOf = useMemo(() => {
    const projectPct = (projectId: string) => {
      const list = topLevel(tasks).filter((t) => t.projectId === projectId);
      return list.length ? Math.round((list.filter((t) => t.status === 'DONE').length / list.length) * 100) : 0;
    };
    return (goalId: string) => {
      const linked = projects.filter((p) => p.relatedGoalId === goalId && !p.isArchived);
      if (linked.length === 0) return null;
      return Math.round(linked.reduce((a, p) => a + projectPct(p.id), 0) / linked.length);
    };
  }, [projects, tasks]);

  const visible = goals.filter((g) => filter === 'ALL' || g.businessCode === filter);
  const open = visible.filter((g) => !g.isCompleted);
  const done = visible.filter((g) => g.isCompleted);
  const years = Array.from(new Set(open.map((g) => g.targetYear))).sort((a, b) => a - b);
  const selected = goals.find((g) => g.id === openId);
  const linked = selected ? projects.filter((p) => p.relatedGoalId === selected.id) : [];

  const add = (title: string) =>
    addGoal({
      title,
      businessCode: filter === 'ALL' ? '' : filter,
      category: 'system',
      targetYear: THIS_YEAR,
      isCompleted: false,
    });

  const row = (g: Goal) => {
    const pct = progressOf(g.id);
    return (
      <div key={g.id} className={cn('flex items-center gap-3 rounded-xl border border-border surface-1 px-3.5', g.isCompleted && 'opacity-60')}>
        <button
          role="checkbox"
          aria-checked={g.isCompleted}
          aria-label={g.isCompleted ? 'Mark as not achieved' : 'Mark as achieved'}
          onClick={() => updateGoal(g.id, { isCompleted: !g.isCompleted })}
          className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2"
            style={{ borderColor: g.isCompleted ? '#10b981' : color(g.businessCode), background: g.isCompleted ? '#10b981' : 'transparent' }}
          >
            {g.isCompleted && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
          </span>
        </button>
        <button onClick={() => { setOpenId(g.id); setMore(false); }} className="min-w-0 flex-1 py-3 text-left">
          <div className={cn('text-[15px] font-medium leading-snug', g.isCompleted && 'line-through')}>{g.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {businesses.find((b) => b.code === g.businessCode) && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: color(g.businessCode) }} />
                {businesses.find((b) => b.code === g.businessCode)?.name}
              </span>
            )}
            {pct !== null && <span>{pct}% done</span>}
          </div>
          {pct !== null && !g.isCompleted && <div className="mt-2"><ProgressBar value={pct} color={color(g.businessCode)} /></div>}
        </button>
      </div>
    );
  };

  return (
    <PageTransition className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <p className="text-sm text-muted-foreground">{open.length === 0 ? 'What are you working towards?' : `${open.length} to achieve`}</p>
      </div>

      <CalendarChips value={filter} onChange={setFilter} />
      <AddLine placeholder="Add a goal — press Enter" onAdd={add} />

      {goals.length === 0 && <EmptyCard title="Write your first goal." hint="One line is enough. Set the year, link projects and add details later." />}

      {years.map((y) => (
        <section key={y}>
          <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{y === THIS_YEAR ? `${y} · this year` : y}</h2>
          <div className="space-y-2">{open.filter((g) => g.targetYear === y).map(row)}</div>
        </section>
      ))}

      {done.length > 0 && (
        <section>
          <button onClick={() => setShowDone((v) => !v)} className="mb-2 flex min-h-[40px] items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Achieved · {done.length}
            <span className="font-medium normal-case tracking-normal">{showDone ? 'Hide' : 'Show'}</span>
          </button>
          {showDone && <div className="space-y-2">{done.map(row)}</div>}
        </section>
      )}

      <Sheet
        open={!!selected}
        onClose={() => setOpenId(null)}
        title={selected?.title ?? ''}
        onTitleChange={(t) => selected && updateGoal(selected.id, { title: t })}
        onDelete={selected ? () => { deleteGoal(selected.id); setOpenId(null); } : undefined}
      >
        {selected && (
          <>
            <div>
              <Label>Target year</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, i) => THIS_YEAR + i).map((y) => (
                  <Pill key={y} active={selected.targetYear === y} onClick={() => updateGoal(selected.id, { targetYear: y })}>{y}</Pill>
                ))}
              </div>
            </div>
            <div>
              <Label>Calendar</Label>
              <div className="flex flex-wrap gap-2">
                <Pill active={!selected.businessCode} color="#64748b" onClick={() => updateGoal(selected.id, { businessCode: '' })}>None</Pill>
                {businesses.map((b) => (
                  <Pill key={b.code} active={selected.businessCode === b.code} color={b.color} onClick={() => updateGoal(selected.id, { businessCode: b.code })}>{b.name}</Pill>
                ))}
              </div>
            </div>
            <div>
              <Label>Projects towards this goal</Label>
              {linked.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet. Link a project to this goal from the Projects screen.</p>
              ) : (
                <ul className="space-y-1.5">
                  {linked.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5 text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.status === 'ACTIVE' ? 'Active' : p.status === 'PAUSED' ? 'Paused' : 'Done'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <button onClick={() => setMore((v) => !v)} className="flex min-h-[40px] items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                <ChevronDown className={cn('h-4 w-4 transition-transform', more && 'rotate-180')} />
                More options
              </button>
              {more && (
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Now</Label>
                      <input defaultValue={selected.currentMetric ?? ''} onBlur={(e) => updateGoal(selected.id, { currentMetric: e.target.value.trim() || undefined })} placeholder="e.g. 10 clients" className="min-h-[44px] w-full rounded-lg border border-border bg-transparent px-3 text-base outline-none focus:border-primary" />
                    </div>
                    <div>
                      <Label>Target</Label>
                      <input defaultValue={selected.targetMetric ?? ''} onBlur={(e) => updateGoal(selected.id, { targetMetric: e.target.value.trim() || undefined })} placeholder="e.g. 50 clients" className="min-h-[44px] w-full rounded-lg border border-border bg-transparent px-3 text-base outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <textarea defaultValue={selected.notes ?? ''} onBlur={(e) => updateGoal(selected.id, { notes: e.target.value.trim() || undefined })} className="min-h-[80px] w-full rounded-xl border border-border bg-transparent p-3 text-base outline-none focus:border-primary" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Sheet>
    </PageTransition>
  );
}

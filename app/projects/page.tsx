'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCalendarFilter } from '@/lib/hooks/useCalendarFilter';
import { Project, ProjectStatus } from '@/lib/types';
import { NO_CAL_COLOR, topLevel } from '@/lib/work';
import { PageTransition } from '@/components/motion/PageTransition';
import { CalendarChips } from '@/components/work/CalendarChips';
import { TaskRow } from '@/components/work/TaskParts';
import { TaskSheet } from '@/components/work/TaskSheet';
import { AddLine, EmptyCard, Label, Pill, ProgressBar, Sheet } from '@/components/work/ui';

const STATUS_LABEL: Record<ProjectStatus, string> = { ACTIVE: 'Active', PAUSED: 'Paused', COMPLETED: 'Done', ARCHIVED: 'Archived' };
const TABS: { id: ProjectStatus; label: string }[] = [
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'COMPLETED', label: 'Done' },
];

export default function ProjectsPage() {
  const { projects, tasks, goals, businesses, addProject, updateProject, deleteProject } = useStore();
  const [filter, setFilter] = useCalendarFilter();
  const [tab, setTab] = useState<ProjectStatus>('ACTIVE');
  const [openId, setOpenId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const color = (code: string) => businesses.find((b) => b.code === code)?.color ?? NO_CAL_COLOR;

  const stats = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    for (const t of topLevel(tasks)) {
      if (!t.projectId) continue;
      const s = m.get(t.projectId) ?? { total: 0, done: 0 };
      s.total++;
      if (t.status === 'DONE') s.done++;
      m.set(t.projectId, s);
    }
    return m;
  }, [tasks]);

  const mine = projects.filter((p) => !p.isArchived && (filter === 'ALL' || p.businessCode === filter));
  const shown = mine.filter((p) => p.status === tab);
  const selected = projects.find((p) => p.id === openId);
  const projectTasks = selected ? topLevel(tasks).filter((t) => t.projectId === selected.id) : [];
  const counts = (s: ProjectStatus) => mine.filter((p) => p.status === s).length;

  const add = (name: string) => {
    addProject({
      name,
      businessCode: filter === 'ALL' ? '' : filter,
      description: '',
      successDefinition: '',
      status: 'ACTIVE',
      priority: 'P2',
    } as Omit<Project, 'id' | 'createdAt'>);
    setTab('ACTIVE');
  };

  return (
    <PageTransition className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">{counts('ACTIVE') === 0 ? 'Group related tasks together' : `${counts('ACTIVE')} active`}</p>
      </div>

      <CalendarChips value={filter} onChange={setFilter} />
      <AddLine placeholder="New project — press Enter" onAdd={add} />

      <div className="flex rounded-xl bg-secondary p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn('min-h-[44px] flex-1 rounded-lg text-sm font-semibold transition-colors', tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            {t.label}
            {counts(t.id) > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{counts(t.id)}</span>}
          </button>
        ))}
      </div>

      {projects.length === 0 && <EmptyCard title="No projects yet." hint="A project is a bundle of tasks with one outcome, like “Website refresh”. Type a name above to start." />}
      {projects.length > 0 && shown.length === 0 && <p className="px-1 py-6 text-center text-sm text-muted-foreground">No {STATUS_LABEL[tab].toLowerCase()} projects{filter !== 'ALL' ? ' in this calendar' : ''}.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((p) => {
          const s = stats.get(p.id) ?? { total: 0, done: 0 };
          const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
          const biz = businesses.find((b) => b.code === p.businessCode);
          return (
            <button key={p.id} onClick={() => setOpenId(p.id)} className="surface-1 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(p.businessCode) }} />
                <span className="truncate text-[15px] font-semibold">{p.name}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {biz ? `${biz.name} · ` : ''}
                {s.total === 0 ? 'No tasks yet' : `${s.total - s.done} open · ${s.total} total`}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1"><ProgressBar value={pct} color={color(p.businessCode)} /></div>
                <span className="w-9 text-right text-xs font-semibold tabular-nums">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setOpenId(null)}
        title={selected?.name ?? ''}
        onTitleChange={(name) => selected && updateProject(selected.id, { name })}
        onDelete={selected ? () => { deleteProject(selected.id); setOpenId(null); } : undefined}
      >
        {selected && (
          <>
            <div>
              <Label>Status</Label>
              <div className="flex gap-2">
                {TABS.map((t) => (
                  <Pill key={t.id} active={selected.status === t.id} onClick={() => updateProject(selected.id, { status: t.id })}>{t.label}</Pill>
                ))}
              </div>
            </div>
            <div>
              <Label>Calendar</Label>
              <div className="flex flex-wrap gap-2">
                <Pill active={!selected.businessCode} color="#64748b" onClick={() => updateProject(selected.id, { businessCode: '' })}>None</Pill>
                {businesses.map((b) => (
                  <Pill key={b.code} active={selected.businessCode === b.code} color={b.color} onClick={() => updateProject(selected.id, { businessCode: b.code })}>{b.name}</Pill>
                ))}
              </div>
            </div>
            {goals.filter((g) => !g.isCompleted || g.id === selected.relatedGoalId).length > 0 && (
              <div>
                <Label>Part of goal</Label>
                <div className="flex flex-wrap gap-2">
                  <Pill active={!selected.relatedGoalId} color="#64748b" onClick={() => updateProject(selected.id, { relatedGoalId: undefined })}>None</Pill>
                  {goals.filter((g) => !g.isCompleted || g.id === selected.relatedGoalId).map((g) => (
                    <Pill key={g.id} active={selected.relatedGoalId === g.id} onClick={() => updateProject(selected.id, { relatedGoalId: g.id })}>{g.title}</Pill>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Tasks · {projectTasks.length}</Label>
              <div className="space-y-2">
                {projectTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={(x) => setTaskId(x.id)} showCalendar={false} />
                ))}
                <ProjectQuickAdd projectId={selected.id} businessCode={selected.businessCode} />
              </div>
            </div>
          </>
        )}
      </Sheet>

      <TaskSheet taskId={taskId} onClose={() => setTaskId(null)} />
    </PageTransition>
  );
}

/** Adds a task straight into the project (lands in Inbox, like everywhere else). */
function ProjectQuickAdd({ projectId, businessCode }: { projectId: string; businessCode: string }) {
  const { addTask } = useStore();
  return (
    <AddLine
      placeholder="Add a task to this project"
      onAdd={(title) => addTask({ title, projectId, businessCode, status: 'INBOX' })}
    />
  );
}


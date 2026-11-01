'use client';

import React from 'react';
import {
  Users,
  HelpCircle,
  Layers,
  FolderKanban,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { TodayTable } from '@/components/work/TodayTable';
import { SyncStatusIndicator } from '@/components/integrations/SyncStatusIndicator';
import { Task } from '@/lib/types';
import { detectStalledProjects } from '@/lib/ai-heuristics';

function Section({
  icon: Icon,
  title,
  count,
  tone = 'default',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  tone?: 'default' | 'amber' | 'primary';
  children: React.ReactNode;
}) {
  const toneClass = tone === 'amber' ? 'text-amber-500' : tone === 'primary' ? 'text-primary' : 'text-muted-foreground';
  return (
    <div className="rounded-lg border border-border surface-1 p-3.5">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${toneClass} mb-2`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
        {typeof count === 'number' && <span className="font-mono normal-case">({count})</span>}
      </div>
      {children}
    </div>
  );
}

export function MobileCeoHome({ onOpenTask }: { onOpenTask: (t: Task) => void }) {
  const { tasks, projects, getProjectProgress } = useStore();

  const active = tasks.filter((t) => !t.isDeleted && !t.parentTaskId);
  const todayTasks = active.filter((t) => t.status === 'TODAY');
  const overdueTasks = active.filter((t) => t.status === 'OVERDUE');
  const upcomingTasks = active.filter((t) => t.status === 'NEXT' || t.status === 'THIS_WEEK').slice(0, 4);
  const waitingTasks = active.filter((t) => t.delegation === 'WAITING' && t.status !== 'DONE');
  const decisionTasks = active.filter((t) => t.isDecision && t.status !== 'DONE');

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE' && !p.parentProjectId);
  const stalled = detectStalledProjects(activeProjects, tasks, getProjectProgress);
  const stalledProjects = stalled.map((s) => s.project);

  // CEO Brief — templated one-liner, not a fake AI call
  const briefParts: string[] = [];
  if (overdueTasks.length > 0) briefParts.push(`${overdueTasks.length} overdue`);
  briefParts.push(`${todayTasks.length} planned today`);
  if (decisionTasks.length > 0) briefParts.push(`${decisionTasks.length} decision${decisionTasks.length > 1 ? 's' : ''} waiting on you`);
  const brief = briefParts.length > 0 ? briefParts.join(' · ') : 'Clear runway — nothing urgent right now.';

  return (
    <div className="space-y-3">
      {/* CEO Brief */}
      <div className="rounded-lg border border-primary/25 bg-primary/[0.05] p-3.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">CEO Brief</span>
          <SyncStatusIndicator compact />
        </div>
        <p className="text-[13px] text-foreground/90 leading-snug">{brief}</p>
      </div>

      <TodayTable onOpenTask={onOpenTask} />

      {/* Decisions */}
      {decisionTasks.length > 0 && (
        <Section icon={HelpCircle} title="Decisions" count={decisionTasks.length} tone="amber">
          <div className="space-y-1.5">
            {decisionTasks.map((t) => (
              <button key={t.id} onClick={() => onOpenTask(t)} className="w-full text-left text-[13px] text-foreground truncate block">
                {t.title}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Waiting */}
      {waitingTasks.length > 0 && (
        <Section icon={Users} title="Waiting For" count={waitingTasks.length}>
          <div className="space-y-1.5">
            {waitingTasks.map((t) => (
              <button key={t.id} onClick={() => onOpenTask(t)} className="w-full flex items-center justify-between gap-2 text-left">
                <span className="text-[13px] text-foreground truncate">{t.title}</span>
                {t.waitingOn && <span className="text-[10px] text-muted-foreground truncate shrink-0 max-w-[100px]">{t.waitingOn}</span>}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <Section icon={Layers} title="Upcoming">
          <div className="space-y-1.5">
            {upcomingTasks.map((t) => (
              <button key={t.id} onClick={() => onOpenTask(t)} className="w-full text-left text-[13px] text-foreground/90 truncate block">
                {t.title}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Project health */}
      {activeProjects.length > 0 && (
        <Section icon={FolderKanban} title="Project Health">
          <div className="space-y-2">
            {activeProjects.slice(0, 5).map((p) => {
              const progress = getProjectProgress(p.id);
              const isStalled = stalledProjects.includes(p);
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isStalled ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-[12px] text-foreground truncate flex-1">{p.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{progress}%</span>
                  {isStalled && <span className="text-[9px] text-amber-500 font-medium shrink-0">stalled</span>}
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

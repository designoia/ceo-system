'use client';

import React from 'react';
import { CheckCircle2, Circle, Target, AlertCircle, Layers } from 'lucide-react';
import { Task, Project, Business } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';

const PRIORITY_COLOR: Record<string, string> = {
  P1: 'text-primary',
  P2: 'text-muted-foreground',
  P3: 'text-muted-foreground/60',
};

export function TaskRow({
  task,
  project,
  business,
  subtaskProgress,
  onOpen,
  onToggleComplete,
}: {
  task: Task;
  project?: Project;
  business?: Business;
  subtaskProgress?: { total: number; done: number; percent: number };
  onOpen: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}) {
  const isDone = task.status === 'DONE';

  return (
    <button
      onClick={() => onOpen(task)}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left surface-1 hover:bg-secondary/60 transition-colors group"
    >
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {task.isMustWin && <Target className="h-3 w-3 text-primary shrink-0" />}
          {task.status === 'OVERDUE' && <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />}
          <span className={`text-[13px] truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </span>
        </div>
        {(project || subtaskProgress) && (
          <div className="flex items-center gap-2 mt-0.5">
            {project && (
              <span className="text-[11px] text-muted-foreground truncate">{project.name}</span>
            )}
            {subtaskProgress && subtaskProgress.total > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70 shrink-0">
                <Layers className="h-2.5 w-2.5" />
                {subtaskProgress.done}/{subtaskProgress.total}
              </span>
            )}
          </div>
        )}
      </div>

      {business && (
        <span
          className="hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
          style={{ color: business.color, backgroundColor: `${business.color}1a` }}
        >
          {business.code}
        </span>
      )}

      <span className={`hidden sm:inline text-[11px] font-mono shrink-0 ${PRIORITY_COLOR[task.priority]}`}>
        {task.priority}
      </span>

      <span className="text-[11px] text-muted-foreground font-mono shrink-0 w-10 text-right">
        {formatMinutes(task.estimatedMinutes)}
      </span>
    </button>
  );
}

'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, ListTodo } from 'lucide-react';
import { Task } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';

export const UNSCHEDULED_DRAG_PREFIX = 'unscheduled-task::';

function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${UNSCHEDULED_DRAG_PREFIX}${task.id}`,
    data: { taskId: task.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-1.5 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-foreground">{task.title}</p>
        <p className="text-[9px] text-muted-foreground font-mono">{formatMinutes(task.estimatedMinutes || 45)}</p>
      </div>
    </div>
  );
}

/**
 * Sidebar/drawer of incomplete, unscheduled tasks the user can drag onto the
 * Day or Week calendar grids. Dropping is handled by the DndContext in the
 * schedule page — this component only supplies draggable sources.
 */
export function UnscheduledTasksPanel({ tasks }: { tasks: Task[] }) {
  return (
    <div className="rounded-lg border border-border surface-1 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <ListTodo className="h-3.5 w-3.5" />
        <span>Unscheduled ({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 py-2">Nothing to drag onto the calendar — all caught up.</p>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
          {tasks.map((t) => (
            <DraggableTaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
      <p className="text-[9px] text-muted-foreground/50 pt-1">Drag a task onto a time slot to schedule it.</p>
    </div>
  );
}

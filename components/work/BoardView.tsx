'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { BOARD_COLUMNS, BoardColumnId } from '@/lib/work';
import { DndArea, Draggable, DropZone } from './dnd';
import { TaskRow, useToday } from './TaskParts';

export function BoardView({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const { updateTaskStatus, rescheduleTask, updateTask } = useStore();
  const today = useToday();

  const move = (taskId: string, column: BoardColumnId) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t || BOARD_COLUMNS.find((c) => c.id === column)?.statuses.includes(t.status)) return;
    switch (column) {
      case 'TODAY':
        // Re-plan for today first, otherwise the overdue check would bounce it straight back.
        if (t.status === 'DONE') updateTaskStatus(taskId, 'TODAY');
        rescheduleTask(taskId, today);
        updateTask(taskId, { status: 'TODAY' });
        break;
      case 'UPCOMING':
        updateTaskStatus(taskId, 'THIS_WEEK');
        break;
      case 'LATER':
        updateTaskStatus(taskId, 'INBOX');
        rescheduleTask(taskId, null);
        break;
      case 'BLOCKED':
        updateTaskStatus(taskId, 'BLOCKED');
        break;
      case 'DONE':
        updateTaskStatus(taskId, 'DONE');
        break;
    }
  };

  return (
    <DndArea
      onDrop={(dragId, overId) => move(dragId, overId as BoardColumnId)}
      renderOverlay={(id) => {
        const t = tasks.find((x) => x.id === id);
        return t ? <div className="max-w-[240px] truncate rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium">{t.title}</div> : null;
      }}
    >
      <p className="mb-3 text-xs text-muted-foreground sm:hidden">Press and hold a card to drag it to another column.</p>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BOARD_COLUMNS.map((col) => {
          const items = tasks.filter((t) => col.statuses.includes(t.status));
          return (
            <DropZone
              key={col.id}
              id={col.id}
              className="surface-1 flex w-[82vw] max-w-[320px] shrink-0 snap-center flex-col gap-2 rounded-xl border border-border p-3 sm:w-72"
              overClassName="!border-primary !bg-primary/10"
            >
              <div className="flex items-center gap-2 px-1 pb-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-extrabold uppercase tracking-wider">{col.label}</span>
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">{items.length}</span>
              </div>
              <div className="flex min-h-[72px] flex-col gap-2">
                {items.length === 0 && <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">Drop tasks here</div>}
                {items.map((t) => (
                  <Draggable key={t.id} id={t.id}>
                    <TaskRow task={t} onOpen={(x) => onOpen(x.id)} />
                  </Draggable>
                ))}
              </div>
            </DropZone>
          );
        })}
      </div>
    </DndArea>
  );
}

'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useTracker } from '@/lib/tracker/store';
import { STATUSES, Status, tint } from '@/lib/tracker/model';
import { DndArea, Draggable, DropZone } from './dnd';
import { EmptyState, TaskCard } from './ui';

export function BoardView() {
  const { tasks, setStatus, openSheet } = useTracker();

  return (
    <div className="space-y-3">
      <p className="text-xs tk-muted">
        <span className="sm:hidden">Press and hold a card to drag it, or tap → to advance it.</span>
        <span className="hidden sm:inline">Drag a card across stages as work moves along.</span>
      </p>
      <DndArea
        onDrop={(dragId, overId) => setStatus(dragId, overId as Status)}
        renderOverlay={(id) => {
          const t = tasks.find((x) => x.id === id);
          return t ? <TaskCard task={t} showStatus /> : null;
        }}
      >
        <div className="tk-scroll-x -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:-mx-5 sm:px-5">
          {STATUSES.map((col) => {
            const items = tasks.filter((t) => t.status === col.id);
            return (
              <DropZone
                key={col.id}
                id={col.id}
                className="tk-card flex w-[84vw] max-w-[320px] shrink-0 snap-center flex-col gap-2 p-3 sm:w-72"
                overStyle={{ background: tint(col.color, 14), borderColor: col.color, borderStyle: 'dashed' }}
              >
                <div className="flex items-center justify-between px-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-extrabold uppercase tracking-wider">{col.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold tk-soft">{items.length}</span>
                    <button
                      aria-label={`Add task to ${col.label}`}
                      onClick={() => openSheet(null, { status: col.id })}
                      className="flex h-9 w-9 items-center justify-center rounded-full tk-soft"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex min-h-[80px] flex-col gap-2">
                  {items.length === 0 && <EmptyState>Drop tasks here</EmptyState>}
                  {items.map((t) => (
                    <Draggable key={t.id} id={t.id}>
                      <TaskCard task={t} advance />
                    </Draggable>
                  ))}
                </div>
              </DropZone>
            );
          })}
        </div>
      </DndArea>
    </div>
  );
}

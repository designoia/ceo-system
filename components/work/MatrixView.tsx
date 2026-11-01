'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Task, Quadrant } from '@/lib/types';
import { QUADRANTS } from '@/lib/work';
import { DndArea, Draggable, DropZone } from './dnd';
import { TaskRow } from './TaskParts';

export function MatrixView({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const { updateTask } = useStore();
  const open = tasks.filter((t) => t.status !== 'DONE');
  const unsorted = open.filter((t) => !t.quadrant);

  return (
    <DndArea
      onDrop={(dragId, overId) => updateTask(dragId, { quadrant: overId === 'UNSORTED' ? undefined : (overId as Quadrant) })}
      renderOverlay={(id) => {
        const t = tasks.find((x) => x.id === id);
        return t ? <div className="max-w-[240px] truncate rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium">{t.title}</div> : null;
      }}
    >
      <div className="space-y-4">
        <DropZone id="UNSORTED" className="rounded-xl border border-dashed border-border p-3" overClassName="!border-primary !bg-primary/10">
          <div className="mb-2 flex items-baseline gap-2 px-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Not sorted yet</h3>
            <span className="text-[11px] text-muted-foreground">{unsorted.length}</span>
          </div>
          {unsorted.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">{open.length === 0 ? 'No open tasks.' : 'Everything is sorted.'}</p>
          ) : (
            <div className="space-y-2">
              {unsorted.map((t) => (
                <Draggable key={t.id} id={t.id}>
                  <TaskRow task={t} onOpen={(x) => onOpen(x.id)} compact />
                </Draggable>
              ))}
            </div>
          )}
          <p className="mt-2 px-1 text-xs text-muted-foreground">Press and hold a task, then drop it in a box below.</p>
        </DropZone>

        <div className="grid gap-3 md:grid-cols-2">
          {QUADRANTS.map((q) => {
            const items = open.filter((t) => t.quadrant === q.id);
            return (
              <DropZone
                key={q.id}
                id={q.id}
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: `color-mix(in srgb, ${q.color} 45%, transparent)`, background: `color-mix(in srgb, ${q.color} 6%, transparent)` }}
                overClassName="!ring-2 !ring-primary"
              >
                <div className="flex items-baseline gap-2 px-3.5 py-2.5" style={{ background: `color-mix(in srgb, ${q.color} 20%, transparent)` }}>
                  <span className="text-sm font-extrabold uppercase tracking-wider">{q.label}</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                  <span className="ml-auto hidden truncate text-[11px] text-muted-foreground sm:inline">{q.hint}</span>
                </div>
                <div className="flex min-h-[84px] flex-col gap-2 p-2.5">
                  {items.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground">{q.hint}</div>}
                  {items.map((t) => (
                    <Draggable key={t.id} id={t.id}>
                      <TaskRow task={t} onOpen={(x) => onOpen(x.id)} compact />
                    </Draggable>
                  ))}
                </div>
              </DropZone>
            );
          })}
        </div>
      </div>
    </DndArea>
  );
}

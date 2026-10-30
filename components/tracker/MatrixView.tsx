'use client';

import React from 'react';
import { useTracker } from '@/lib/tracker/store';
import { QUADRANTS, Quadrant, tint } from '@/lib/tracker/model';
import { DndArea, Draggable, DropZone } from './dnd';
import { Card, Donut, EmptyState, SectionTitle, TaskCard } from './ui';

export function MatrixView() {
  const { tasks, updateTask } = useTracker();
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Tasks per quadrant</SectionTitle>
        <div className="space-y-2.5">
          {QUADRANTS.map((q) => {
            const n = tasks.filter((t) => t.quadrant === q.id).length;
            return (
              <div key={q.id} className="flex items-center gap-3">
                <span className="w-16 text-xs font-semibold tk-muted">{q.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full tk-soft">
                  <div className="h-full rounded-full" style={{ width: total ? `${(n / total) * 100}%` : 0, background: q.color }} />
                </div>
                <span className="w-6 text-right text-xs font-bold tabular-nums">{n}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs tk-muted">
          {done} / {total} overall complete
        </div>
      </Card>

      <p className="text-xs tk-muted">Sort what matters from what can wait — drag a task into another quadrant, or change it in the task editor.</p>

      <DndArea
        onDrop={(dragId, overId) => updateTask(dragId, { quadrant: overId as Quadrant })}
        renderOverlay={(id) => {
          const t = tasks.find((x) => x.id === id);
          return t ? <TaskCard task={t} showStatus /> : null;
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {QUADRANTS.map((q) => {
            const items = tasks.filter((t) => t.quadrant === q.id).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
            const d = items.filter((t) => t.status === 'done').length;
            return (
              <DropZone
                key={q.id}
                id={q.id}
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: tint(q.color, 40), background: tint(q.color, 7) }}
                overStyle={{ background: tint(q.color, 20), borderColor: q.color }}
              >
                <div className="flex items-center gap-3 px-3.5 py-3" style={{ background: tint(q.color, 22) }}>
                  <Donut
                    size={44}
                    stroke={6}
                    segments={[
                      { value: d, color: q.color },
                      { value: Math.max(items.length - d, 0), color: tint(q.color, 25) },
                    ]}
                    center={<span className="text-[11px]">{d}/{items.length}</span>}
                  />
                  <div>
                    <div className="text-sm font-extrabold uppercase tracking-wider">
                      {q.label} <span className="font-semibold opacity-70">({items.length})</span>
                    </div>
                    <div className="text-[11px] tk-muted">{q.hint}</div>
                  </div>
                </div>
                <div className="flex min-h-[72px] flex-col gap-2 p-2.5">
                  {items.length === 0 && <EmptyState>Drop tasks here</EmptyState>}
                  {items.map((t) => (
                    <Draggable key={t.id} id={t.id}>
                      <TaskCard task={t} showStatus />
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

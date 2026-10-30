'use client';

import React, { useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

/** Drag-and-drop area. Touch drags start on a short press so vertical/horizontal scrolling still works on phones. */
export function DndArea({
  onDrop,
  renderOverlay,
  children,
}: {
  onDrop: (dragId: string, overId: string) => void;
  renderOverlay: (dragId: string) => React.ReactNode;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } })
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => {
        setActiveId(String(e.active.id));
        try {
          navigator.vibrate?.(10);
        } catch {
          /* unsupported */
        }
      }}
      onDragEnd={(e) => {
        setActiveId(null);
        if (e.over) onDrop(String(e.active.id), String(e.over.id));
      }}
      onDragCancel={() => setActiveId(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>{activeId ? <div className="rotate-1 shadow-2xl">{renderOverlay(activeId)}</div> : null}</DragOverlay>
    </DndContext>
  );
}

export function Draggable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} role="presentation" tabIndex={-1} style={{ opacity: isDragging ? 0.35 : 1, touchAction: 'manipulation' }}>
      {children}
    </div>
  );
}

export function DropZone({
  id,
  className,
  overStyle,
  style,
  children,
}: {
  id: string;
  className?: string;
  overStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn('transition-colors', className)} style={{ ...style, ...(isOver ? overStyle : undefined) }}>
      {children}
    </div>
  );
}

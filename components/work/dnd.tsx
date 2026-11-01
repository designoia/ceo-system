'use client';

import React, { useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

/** Drag-and-drop area. Touch drags start on a short press so scrolling still works on phones. */
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
      // Drop where the finger/cursor is, not where the (often full-width) dragged row overlaps most.
      collisionDetection={pointerWithin}
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

export function Draggable({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={className} style={{ opacity: isDragging ? 0.35 : 1 }}>
      {children}
    </div>
  );
}

export function DropZone({
  id,
  className,
  overClassName,
  children,
  ...rest
}: {
  id: string;
  className?: string;
  overClassName?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'id' | 'className' | 'children'>) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && overClassName)} {...rest}>
      {children}
    </div>
  );
}

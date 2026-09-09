'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { ScheduleEntry } from '@/lib/types';

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 56; // px per hour
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const ACTIVITY_COLOR: Record<string, string> = {
  SCHOOL: '#f59e0b',
  TUITION: '#f59e0b',
  CLASSES: '#f59e0b',
  DESIGNOIA: '#8b5cf6',
  COL: '#3b82f6',
  CLIKIXPRESS: '#f97316',
  PERSONAL: '#10b981',
  MEETING: '#ef4444',
  ADMIN: '#64748b',
  DEVELOPMENT: '#213f9b',
  CONTENT: '#0ea5e9',
  PLANNING: '#6366f1',
  TRAVEL: '#78716c',
  REST: '#22c55e',
  BUFFER: '#64748b',
  OTHER: '#64748b',
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function ExecutiveTimeline({
  entries,
  onEditBlock,
  onRescheduleBlock,
}: {
  entries: ScheduleEntry[];
  onEditBlock: (entry: ScheduleEntry) => void;
  onRescheduleBlock: (entry: ScheduleEntry) => void;
}) {
  const { updateScheduleEntry } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const sorted = [...entries]
    .filter((e) => e.status !== 'CANCELLED')
    .sort((a, b) => timeToMinutes(a.plannedStartTime) - timeToMinutes(b.plannedStartTime));

  // Compute free gaps within the visible window
  const gaps: { start: number; end: number }[] = [];
  let cursor = START_HOUR * 60;
  for (const e of sorted) {
    const s = timeToMinutes(e.plannedStartTime);
    const en = timeToMinutes(e.plannedEndTime);
    if (s > cursor) gaps.push({ start: cursor, end: Math.min(s, END_HOUR * 60) });
    cursor = Math.max(cursor, en);
  }
  if (cursor < END_HOUR * 60) gaps.push({ start: cursor, end: END_HOUR * 60 });

  // Overloaded periods: continuous back-to-back blocks (gap < 10min between
  // them) totalling more than 3 hours with no break — a realistic burnout risk.
  const OVERLOAD_THRESHOLD_MIN = 180;
  const overloadStretches: { start: number; end: number }[] = [];
  {
    let stretchStart: number | null = null;
    let prevEnd: number | null = null;
    for (const e of sorted) {
      const s = timeToMinutes(e.plannedStartTime);
      const en = timeToMinutes(e.plannedEndTime);
      if (prevEnd !== null && s - prevEnd <= 10) {
        // continues the current stretch
      } else {
        if (stretchStart !== null && prevEnd !== null && prevEnd - stretchStart >= OVERLOAD_THRESHOLD_MIN) {
          overloadStretches.push({ start: stretchStart, end: prevEnd });
        }
        stretchStart = s;
      }
      prevEnd = en;
    }
    if (stretchStart !== null && prevEnd !== null && prevEnd - stretchStart >= OVERLOAD_THRESHOLD_MIN) {
      overloadStretches.push({ start: stretchStart, end: prevEnd });
    }
  }

  const yFor = (mins: number) => ((mins - START_HOUR * 60) / TOTAL_MINUTES) * (TOTAL_MINUTES / 60) * HOUR_HEIGHT;
  const heightFor = (durationMins: number) => (durationMins / 60) * HOUR_HEIGHT;

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const handleDragEnd = (entry: ScheduleEntry, offsetY: number) => {
    const deltaMinutes = Math.round((offsetY / HOUR_HEIGHT) * 60 / 15) * 15;
    if (deltaMinutes === 0) return;

    const newStart = Math.max(START_HOUR * 60, timeToMinutes(entry.plannedStartTime) + deltaMinutes);
    const newEnd = newStart + entry.plannedDurationMinutes;
    if (newEnd > END_HOUR * 60) return;

    updateScheduleEntry(entry.id, {
      plannedStartTime: minutesToTime(newStart),
      plannedEndTime: minutesToTime(newEnd),
    });
  };

  return (
    <div className="rounded-lg border border-border surface-1 overflow-hidden">
      <div ref={containerRef} className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
        {/* Hour grid lines + labels */}
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/50 flex items-start"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
          >
            <span className="text-[10px] font-mono text-muted-foreground/60 -mt-2 px-2 w-14 shrink-0 surface-1">
              {h % 12 === 0 ? 12 : h % 12}{h < 12 || h === 24 ? 'am' : 'pm'}
            </span>
          </div>
        ))}

        {/* Overloaded periods — visible edge stripe, no break for 3h+ */}
        {overloadStretches.map((s, i) => (
          <div
            key={`overload-${i}`}
            className="absolute left-0 w-1 rounded-full bg-red-500/70"
            style={{ top: yFor(s.start), height: heightFor(s.end - s.start) }}
            title={`Overloaded: ${Math.round((s.end - s.start) / 60)}h straight with no break`}
          />
        ))}

        {/* Available time (visually obvious empty gaps) */}
        {gaps
          .filter((g) => g.end - g.start >= 15)
          .map((g, i) => (
            <div
              key={`gap-${i}`}
              className="absolute left-14 right-2 rounded-md bg-emerald-500/[0.05] border border-dashed border-emerald-500/20"
              style={{ top: yFor(g.start), height: heightFor(g.end - g.start) }}
            >
              {g.end - g.start >= 45 && (
                <span className="text-[10px] text-emerald-500/70 px-2 py-1 block">
                  {Math.round((g.end - g.start) / 15) * 15}m free
                </span>
              )}
            </div>
          ))}

        {/* Scheduled blocks */}
        {sorted.map((entry) => {
          const color = ACTIVITY_COLOR[entry.activityType] || ACTIVITY_COLOR.OTHER;
          const top = yFor(timeToMinutes(entry.plannedStartTime));
          const height = Math.max(20, heightFor(entry.plannedDurationMinutes));
          const isDone = entry.status === 'COMPLETED';

          return (
            <motion.div
              key={entry.id}
              drag="y"
              dragConstraints={containerRef}
              dragElastic={0}
              dragMomentum={false}
              onDragEnd={(_, info) => handleDragEnd(entry, info.offset.y)}
              whileDrag={{ zIndex: 20, boxShadow: '0 8px 20px rgba(0,0,0,0.35)' }}
              onClick={() => onEditBlock(entry)}
              className="absolute left-14 right-2 rounded-md px-2.5 py-1.5 cursor-grab active:cursor-grabbing overflow-hidden hover-lift"
              style={{
                top,
                height,
                backgroundColor: `${color}1f`,
                borderLeft: `3px solid ${color}`,
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[11px] font-medium truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {entry.title}
                </span>
              </div>
              {height > 32 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {entry.plannedStartTime}–{entry.plannedEndTime}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

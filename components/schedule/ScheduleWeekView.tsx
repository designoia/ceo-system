'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '@/lib/store';
import { ScheduleEntry } from '@/lib/types';
import { getWeekDates } from '@/lib/scheduling';
import { getTodayDateString } from '@/lib/utils';

export const WEEK_DAY_DROP_PREFIX = 'week-day::';

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

function WeekDayColumn({
  date,
  isToday,
  dayEntries,
  onEditBlock,
  onSelectDay,
}: {
  date: string;
  isToday: boolean;
  dayEntries: ScheduleEntry[];
  onEditBlock: (entry: ScheduleEntry) => void;
  onSelectDay: (date: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${WEEK_DAY_DROP_PREFIX}${date}`,
    data: { date },
  });
  const [, m, d] = date.split('-').map(Number);
  const dateObj = new Date(Number(date.split('-')[0]), m - 1, d);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[260px] transition-colors ${isOver ? 'bg-primary/[0.06]' : ''}`}
    >
      <button
        onClick={() => onSelectDay(date)}
        className={`flex flex-col items-center gap-0.5 border-b border-border py-2 hover:bg-secondary transition-colors ${
          isToday ? 'bg-primary/[0.06]' : ''
        }`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
        <span className={`text-[13px] font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{d}</span>
      </button>

      <div className="flex-1 space-y-1 p-1.5 overflow-y-auto">
        {dayEntries.length === 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-center pt-3">—</p>
        )}
        {dayEntries.map((entry) => {
          const color = ACTIVITY_COLOR[entry.activityType] || ACTIVITY_COLOR.OTHER;
          const isDone = entry.status === 'COMPLETED';
          return (
            <button
              key={entry.id}
              onClick={() => onEditBlock(entry)}
              className="w-full text-left rounded-md px-1.5 py-1 hover-lift transition-colors"
              style={{
                backgroundColor: `${color}1f`,
                borderLeft: `3px solid ${color}`,
                opacity: isDone ? 0.55 : 1,
              }}
            >
              <span
                className={`block text-[10px] font-medium truncate ${
                  isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}
              >
                {entry.title}
              </span>
              <span className="block text-[9px] text-muted-foreground font-mono">{entry.plannedStartTime}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleWeekView({
  weekAnchorDate,
  onEditBlock,
  onSelectDay,
}: {
  weekAnchorDate: string;
  onEditBlock: (entry: ScheduleEntry) => void;
  onSelectDay: (date: string) => void;
}) {
  const { scheduleEntries, settings } = useStore();
  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const days = getWeekDates(weekAnchorDate);

  return (
    <div className="rounded-lg border border-border surface-1 overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-border">
        {days.map((date) => {
          const dayEntries = scheduleEntries
            .filter((e) => e.date === date && e.status !== 'CANCELLED')
            .sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime));

          return (
            <WeekDayColumn
              key={date}
              date={date}
              isToday={date === todayStr}
              dayEntries={dayEntries}
              onEditBlock={onEditBlock}
              onSelectDay={onSelectDay}
            />
          );
        })}
      </div>
    </div>
  );
}

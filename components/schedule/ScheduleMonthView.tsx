'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { getMonthGrid } from '@/lib/scheduling';
import { getTodayDateString } from '@/lib/utils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ScheduleMonthView({
  monthAnchorDate,
  onSelectDay,
}: {
  monthAnchorDate: string;
  onSelectDay: (date: string) => void;
}) {
  const { scheduleEntries, settings } = useStore();
  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
  const weeks = getMonthGrid(monthAnchorDate);

  const countsByDate = React.useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const e of scheduleEntries) {
      if (e.status === 'CANCELLED') continue;
      const existing = map.get(e.date) || { total: 0, done: 0 };
      existing.total += 1;
      if (e.status === 'COMPLETED') existing.done += 1;
      map.set(e.date, existing);
    }
    return map;
  }, [scheduleEntries]);

  return (
    <div className="rounded-lg border border-border surface-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {weeks.flat().map((cell) => {
          const isToday = cell.date === todayStr;
          const stats = countsByDate.get(cell.date);
          const dayNum = Number(cell.date.split('-')[2]);

          return (
            <button
              key={cell.date}
              onClick={() => onSelectDay(cell.date)}
              className={`flex flex-col items-start gap-1 min-h-[76px] p-1.5 text-left hover:bg-secondary transition-colors ${
                cell.inMonth ? '' : 'opacity-35'
              } ${isToday ? 'bg-primary/[0.06]' : ''}`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  isToday ? 'text-primary' : 'text-foreground'
                }`}
              >
                {dayNum}
              </span>
              {stats && stats.total > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {stats.done}/{stats.total} done
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { getMonthDates } from '@/lib/scheduling';
import { getTodayDateString } from '@/lib/utils';

export function ScheduleYearView({
  year,
  onSelectDay,
  onSelectMonth,
}: {
  year: number;
  onSelectDay: (date: string) => void;
  onSelectMonth: (date: string) => void;
}) {
  const { scheduleEntries, settings } = useStore();
  const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');

  const countsByDate = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of scheduleEntries) {
      if (e.status === 'CANCELLED') continue;
      map.set(e.date, (map.get(e.date) || 0) + 1);
    }
    return map;
  }, [scheduleEntries]);

  const maxCount = React.useMemo(() => {
    let max = 0;
    countsByDate.forEach((v) => { if (v > max) max = v; });
    return Math.max(max, 1);
  }, [countsByDate]);

  const heatColor = (count: number) => {
    if (count === 0) return 'transparent';
    const intensity = Math.min(1, count / maxCount);
    return `rgba(139, 92, 246, ${0.15 + intensity * 0.55})`; // violet, matches DESIGNOIA accent
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }, (_, month) => {
        const monthDates = getMonthDates(year, month);
        const firstDow = new Date(year, month, 1).getDay();
        const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' });
        const anchorDate = monthDates[0];

        return (
          <div key={month} className="rounded-lg border border-border surface-1 p-2.5">
            <button
              onClick={() => onSelectMonth(anchorDate)}
              className="mb-1.5 block text-[11px] font-semibold text-foreground hover:text-primary transition-colors"
            >
              {monthLabel}
            </button>
            <div className="grid grid-cols-7 gap-[2px]">
              {Array.from({ length: firstDow }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {monthDates.map((date) => {
                const count = countsByDate.get(date) || 0;
                const isToday = date === todayStr;
                const dayNum = Number(date.split('-')[2]);
                return (
                  <button
                    key={date}
                    onClick={() => onSelectDay(date)}
                    title={`${date}${count ? ` — ${count} block${count > 1 ? 's' : ''}` : ''}`}
                    className={`aspect-square rounded-[3px] text-[8px] flex items-center justify-center transition-transform hover:scale-125 ${
                      isToday ? 'ring-1 ring-primary text-primary font-bold' : 'text-muted-foreground/70'
                    }`}
                    style={{ backgroundColor: heatColor(count) }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

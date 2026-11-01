'use client';

import React, { useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn, calculateMinutesBetween, formatMinutes, formatMinutesToTime, formatTime12Hour, getCurrentTimeString, parseTimeToMinutes } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useCalendarFilter } from '@/lib/hooks/useCalendarFilter';
import { ScheduleEntry } from '@/lib/types';
import { NO_CAL_COLOR, topLevel } from '@/lib/work';
import { PageTransition } from '@/components/motion/PageTransition';
import { CalendarChips } from '@/components/work/CalendarChips';
import { useToday } from '@/components/work/TaskParts';
import { EmptyCard, Label, Pill, Sheet } from '@/components/work/ui';

const DURATIONS = [15, 30, 45, 60, 90, 120];

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
const roundUp15 = (mins: number) => Math.ceil(mins / 15) * 15;

interface Draft {
  id: string | null;
  title: string;
  start: string;
  duration: number;
  businessCode: string;
  taskId?: string;
}

export default function SchedulePage() {
  const { scheduleEntries, tasks, businesses, settings, selectedScheduleDate, setSelectedScheduleDate, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry, scheduleTaskOnCalendar, completeTask, undoTaskCompletion } = useStore();
  const [filter, setFilter] = useCalendarFilter();
  const today = useToday();
  const [draft, setDraft] = useState<Draft | null>(null);
  const date = selectedScheduleDate;
  const isToday = date === today;
  const color = (code?: string) => businesses.find((b) => b.code === code)?.color ?? NO_CAL_COLOR;

  const entries = useMemo(
    () =>
      scheduleEntries
        .filter((e) => e.date === date && e.status !== 'CANCELLED' && e.status !== 'RESCHEDULED' && (filter === 'ALL' || e.businessCode === filter))
        .sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime)),
    [scheduleEntries, date, filter]
  );

  const planned = entries.reduce((a, e) => a + e.plannedDurationMinutes, 0);
  const finished = entries.filter((e) => e.status === 'COMPLETED').reduce((a, e) => a + e.plannedDurationMinutes, 0);

  // Open tasks for this day that don't have a time block yet.
  const unplaced = useMemo(
    () =>
      topLevel(tasks).filter(
        (t) =>
          t.status !== 'DONE' &&
          t.status !== 'BLOCKED' &&
          (filter === 'ALL' || t.businessCode === filter) &&
          ((isToday && (t.status === 'TODAY' || t.status === 'OVERDUE')) || t.scheduledDate === date) &&
          !scheduleEntries.some((e) => e.date === date && e.taskId === t.id && e.status !== 'CANCELLED')
      ),
    [tasks, scheduleEntries, date, isToday, filter]
  );

  /** First free quarter-hour: after "now" on today, otherwise after the last block (09:00 when the day is empty). */
  const nextSlot = (minutes: number) => {
    const all = scheduleEntries.filter((e) => e.date === date && e.status !== 'CANCELLED' && e.status !== 'RESCHEDULED');
    const lastEnd = all.reduce((a, e) => Math.max(a, parseTimeToMinutes(e.plannedEndTime)), 0);
    const now = isToday ? parseTimeToMinutes(getCurrentTimeString(settings.timezone || 'Asia/Kolkata')) : 0;
    const start = roundUp15(Math.max(lastEnd, now, all.length === 0 && !isToday ? 9 * 60 : 0));
    return Math.min(start, 24 * 60 - minutes);
  };

  const newDraft = (title = '', businessCode = filter === 'ALL' ? '' : filter, duration = 45, taskId?: string): Draft => ({
    id: null,
    title,
    start: formatMinutesToTime(nextSlot(duration)),
    duration,
    businessCode,
    taskId,
  });

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const end = formatMinutesToTime(parseTimeToMinutes(draft.start) + draft.duration);
    if (draft.id) {
      updateScheduleEntry(draft.id, { title: draft.title.trim(), plannedStartTime: draft.start, plannedEndTime: end, businessCode: draft.businessCode });
    } else {
      addScheduleEntry({
        date,
        title: draft.title.trim(),
        plannedStartTime: draft.start,
        plannedEndTime: end,
        plannedDurationMinutes: draft.duration,
        activityType: 'OTHER',
        businessCode: draft.businessCode,
        status: 'PLANNED',
      });
    }
    setDraft(null);
  };

  const toggle = (e: ScheduleEntry) => {
    const done = e.status === 'COMPLETED';
    updateScheduleEntry(e.id, done ? { status: 'PLANNED' } : { status: 'COMPLETED', actualStartTime: e.plannedStartTime, actualEndTime: e.plannedEndTime, actualDurationMinutes: e.plannedDurationMinutes });
    if (e.taskId) {
      const t = tasks.find((x) => x.id === e.taskId);
      if (t && !done && t.status !== 'DONE') completeTask(t.id, e.plannedDurationMinutes);
      if (t && done && t.status === 'DONE') undoTaskCompletion(t.id);
    }
  };

  const placeTask = (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    const dur = Math.max(15, Math.min(240, t.estimatedMinutes || 45));
    const start = nextSlot(dur);
    scheduleTaskOnCalendar(taskId, date, formatMinutesToTime(start), formatMinutesToTime(start + dur), false);
  };

  const nowMins = isToday ? parseTimeToMinutes(getCurrentTimeString(settings.timezone || 'Asia/Kolkata')) : -1;
  const label = isToday ? 'Today' : format(parseISO(date), 'EEEE');

  return (
    <PageTransition className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted-foreground">{entries.length === 0 ? 'Plan the hours of your day' : `${entries.length} block${entries.length === 1 ? '' : 's'} · ${formatMinutes(planned)} planned${finished ? ` · ${formatMinutes(finished)} done` : ''}`}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button aria-label="Previous day" onClick={() => setSelectedScheduleDate(ymd(addDays(parseISO(date), -1)))} className="flex h-11 w-11 items-center justify-center rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-[9rem] text-center">
            <div className="text-base font-bold">{label}</div>
            <div className="text-xs text-muted-foreground">{format(parseISO(date), 'd MMMM yyyy')}</div>
          </div>
          <button aria-label="Next day" onClick={() => setSelectedScheduleDate(ymd(addDays(parseISO(date), 1)))} className="flex h-11 w-11 items-center justify-center rounded-full">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {!isToday && (
          <button onClick={() => setSelectedScheduleDate(today)} className="min-h-[40px] rounded-full border border-border px-3.5 text-xs font-semibold">
            Today
          </button>
        )}
      </div>

      <CalendarChips value={filter} onChange={setFilter} />

      {entries.length === 0 && <EmptyCard title="Nothing planned for this day." hint="Add a time block, or place one of your tasks into the day." />}

      <div className="space-y-2">
        {entries.map((e, i) => {
          const start = parseTimeToMinutes(e.plannedStartTime);
          const end = parseTimeToMinutes(e.plannedEndTime) || 24 * 60;
          const showNow = isToday && nowMins >= 0 && nowMins < start && (i === 0 || nowMins >= (parseTimeToMinutes(entries[i - 1].plannedEndTime) || 24 * 60));
          const live = isToday && nowMins >= start && nowMins < end && e.status !== 'COMPLETED';
          const done = e.status === 'COMPLETED';
          return (
            <React.Fragment key={e.id}>
              {showNow && (
                <div className="flex items-center gap-2 px-1" aria-label="Now">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="h-px flex-1 bg-red-500/60" />
                  <span className="text-[11px] font-semibold text-red-500">{formatTime12Hour(formatMinutesToTime(nowMins))}</span>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-[3.4rem] shrink-0 pt-3.5 text-right text-xs tabular-nums text-muted-foreground">
                  <div className="font-semibold text-foreground/80">{formatTime12Hour(e.plannedStartTime).replace(' ', ' ')}</div>
                  <div>{formatMinutes(e.plannedDurationMinutes)}</div>
                </div>
                <div className={cn('surface-1 flex min-h-[56px] flex-1 items-center gap-3 rounded-xl border border-border px-3.5', done && 'opacity-60', live && 'ring-1 ring-primary')} style={{ borderLeft: `4px solid ${color(e.businessCode)}` }}>
                  <button
                    role="checkbox"
                    aria-checked={done}
                    aria-label={done ? 'Mark block as not done' : 'Mark block as done'}
                    onClick={() => toggle(e)}
                    className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center"
                  >
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2" style={{ borderColor: done ? '#10b981' : color(e.businessCode), background: done ? '#10b981' : 'transparent' }}>
                      {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                    </span>
                  </button>
                  <button
                    onClick={() => setDraft({ id: e.id, title: e.title, start: e.plannedStartTime, duration: e.plannedDurationMinutes, businessCode: e.businessCode ?? '', taskId: e.taskId })}
                    className="min-w-0 flex-1 py-2 text-left"
                  >
                    <div className={cn('text-[15px] font-medium leading-snug', done && 'line-through')}>{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime12Hour(e.plannedStartTime)} – {formatTime12Hour(e.plannedEndTime)}
                      {live && <span className="ml-2 font-semibold text-primary">Now</span>}
                    </div>
                  </button>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {isToday && entries.length > 0 && nowMins >= (parseTimeToMinutes(entries[entries.length - 1].plannedEndTime) || 24 * 60) && (
          <div className="flex items-center gap-2 px-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="h-px flex-1 bg-red-500/60" />
            <span className="text-[11px] font-semibold text-red-500">{formatTime12Hour(formatMinutesToTime(nowMins))}</span>
          </div>
        )}
      </div>

      <button onClick={() => setDraft(newDraft())} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-semibold text-muted-foreground">
        <Plus className="h-4 w-4" /> Add a time block
      </button>

      {unplaced.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Tasks without a time · {unplaced.length}</h2>
          <div className="space-y-2">
            {unplaced.map((t) => (
              <div key={t.id} className="surface-1 flex min-h-[52px] items-center gap-3 rounded-xl border border-border pl-3.5 pr-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(t.businessCode) }} />
                <span className="min-w-0 flex-1 truncate py-2 text-[15px] font-medium">{t.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatMinutes(t.estimatedMinutes || 45)}</span>
                <button onClick={() => placeTask(t.id)} className="min-h-[40px] shrink-0 rounded-full bg-primary/10 px-3.5 text-xs font-semibold text-primary">
                  Add to day
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Sheet
        open={!!draft}
        onClose={() => (draft?.title.trim() ? save() : setDraft(null))}
        title={draft?.id ? 'Edit block' : 'New block'}
        onDelete={draft?.id ? () => { deleteScheduleEntry(draft.id as string); setDraft(null); } : undefined}
      >
        {draft && (
          <>
            <div>
              <Label>What</Label>
              <input
                autoFocus={!draft.id}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="e.g. Deep work, Class, Client call"
                className="min-h-[48px] w-full rounded-xl border border-border bg-transparent px-3.5 text-base outline-none focus:border-primary"
              />
            </div>
            <div>
              <Label>Starts</Label>
              <input type="time" value={draft.start} onChange={(e) => e.target.value && setDraft({ ...draft, start: e.target.value })} className="min-h-[48px] rounded-xl border border-border bg-transparent px-3.5 text-base outline-none focus:border-primary" />
            </div>
            <div>
              <Label>Length</Label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((m) => (
                  <Pill key={m} active={draft.duration === m} onClick={() => setDraft({ ...draft, duration: m })}>{formatMinutes(m)}</Pill>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Ends at {formatTime12Hour(formatMinutesToTime(parseTimeToMinutes(draft.start) + draft.duration))}{calculateMinutesBetween(draft.start, '23:59') < draft.duration ? ' (past midnight)' : ''}</p>
            </div>
            <div>
              <Label>Calendar</Label>
              <div className="flex flex-wrap gap-2">
                <Pill active={!draft.businessCode} color="#64748b" onClick={() => setDraft({ ...draft, businessCode: '' })}>None</Pill>
                {businesses.map((b) => (
                  <Pill key={b.code} active={draft.businessCode === b.code} color={b.color} onClick={() => setDraft({ ...draft, businessCode: b.code })}>{b.name}</Pill>
                ))}
              </div>
            </div>
          </>
        )}
      </Sheet>
    </PageTransition>
  );
}

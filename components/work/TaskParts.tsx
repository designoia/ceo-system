'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight, ListChecks, Plus } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { cn, getTodayDateString } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { NO_CAL_COLOR, statusForDate, taskDay } from '@/lib/work';

export function useCalendarColor() {
  const { businesses } = useStore();
  return (code: string) => businesses.find((b) => b.code === code)?.color ?? NO_CAL_COLOR;
}

export function useToday() {
  const { settings } = useStore();
  return getTodayDateString(settings.timezone || 'Asia/Kolkata');
}

/** Round tick box with a 44px tap target. */
export function CheckBox({ checked, onToggle, color = '#6366f1', label }: { checked: boolean; onToggle: () => void; color?: string; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'Mark as not done' : 'Mark as done')}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: checked ? '#10b981' : color, background: checked ? '#10b981' : 'transparent' }}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

/** Tick / untick a task. Top-level tasks go through the full completion flow (logs, momentum). */
export function useToggleTask() {
  const { completeTask, undoTaskCompletion, updateTask } = useStore();
  return (t: Task) => {
    if (t.status === 'DONE') return undoTaskCompletion(t.id);
    if (t.parentTaskId) return updateTask(t.id, { status: 'DONE', completedAt: new Date().toISOString() });
    completeTask(t.id, t.estimatedMinutes);
  };
}

export function dateLabel(date: string | undefined, today: string): { text: string; late: boolean } | null {
  if (!date) return null;
  const diff = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
  const late = diff < 0;
  if (diff === 0) return { text: 'Today', late };
  if (diff === 1) return { text: 'Tomorrow', late };
  if (diff === -1) return { text: 'Yesterday', late };
  if (diff > 1 && diff < 7) return { text: format(parseISO(date), 'EEE'), late };
  return { text: format(parseISO(date), 'd MMM'), late };
}

export function Checklist({ task }: { task: Task }) {
  const { tasks, addSubtask, softDeleteTask } = useStore();
  const toggle = useToggleTask();
  const [text, setText] = useState('');
  const items = tasks.filter((t) => t.parentTaskId === task.id && !t.isDeleted);

  const add = () => {
    if (!text.trim()) return;
    addSubtask(task.id, text.trim());
    setText('');
  };

  return (
    <div className="space-y-0.5">
      {items.map((s) => (
        <div key={s.id} className="group flex min-h-[44px] items-center gap-3 pl-3">
          <CheckBox checked={s.status === 'DONE'} onToggle={() => toggle(s)} color="#94a3b8" />
          <span className={cn('flex-1 text-sm', s.status === 'DONE' && 'text-muted-foreground line-through')}>{s.title}</span>
          <button onClick={() => softDeleteTask(s.id)} className="h-9 px-2 text-xs text-muted-foreground opacity-60" aria-label={`Remove ${s.title}`}>
            ✕
          </button>
        </div>
      ))}
      <div className="flex min-h-[44px] items-center gap-3 pl-3">
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          onBlur={add}
          placeholder="Add checklist item"
          className="min-h-[40px] flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

/** One task as a checklist row. */
export function TaskRow({
  task,
  onOpen,
  showCalendar = true,
  expandable = false,
  pullToToday = false,
  compact = false,
}: {
  task: Task;
  onOpen: (t: Task) => void;
  showCalendar?: boolean;
  expandable?: boolean;
  pullToToday?: boolean;
  compact?: boolean;
}) {
  const { tasks, businesses, rescheduleTask } = useStore();
  const toggle = useToggleTask();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const color = useCalendarColor();
  const done = task.status === 'DONE';
  const subs = tasks.filter((t) => t.parentTaskId === task.id && !t.isDeleted);
  const subsDone = subs.filter((s) => s.status === 'DONE').length;
  const label = dateLabel(taskDay(task), today);
  const biz = businesses.find((b) => b.code === task.businessCode);

  return (
    <div className={cn('rounded-xl border border-border surface-1', done && 'opacity-60')}>
      <div className={cn('flex items-center gap-3 px-3.5', compact ? 'min-h-[44px]' : 'min-h-[56px] py-1.5')}>
        <CheckBox checked={done} onToggle={() => toggle(task)} color={color(task.businessCode)} />
        <button onClick={() => onOpen(task)} className="min-w-0 flex-1 py-1.5 text-left">
          <div className={cn('text-[15px] font-medium leading-snug', done && 'line-through')}>{task.title}</div>
          {!compact && (showCalendar && biz || label || subs.length > 0) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
              {showCalendar && biz && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: biz.color }} />
                  {biz.name}
                </span>
              )}
              {label && <span className={cn(label.late && !done && 'font-semibold text-red-500')}>{label.text}</span>}
              {subs.length > 0 && (
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3 w-3" />
                  {subsDone}/{subs.length}
                </span>
              )}
            </div>
          )}
        </button>
        {pullToToday && !done && (
          <button
            onClick={() => rescheduleTask(task.id, today)}
            className="min-h-[36px] shrink-0 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary"
          >
            Today
          </button>
        )}
        {expandable && (
          <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Hide checklist' : 'Show checklist'} className="flex h-10 w-8 shrink-0 items-center justify-center text-muted-foreground">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
      {expandable && open && (
        <div className="border-t border-border/60 px-2 pb-1.5">
          <Checklist task={task} />
        </div>
      )}
    </div>
  );
}

/** One-line capture. Enter adds. Everything else can be set later. */
export function QuickAddBar({
  date,
  businessCode = '',
  placeholder = 'Add a task…',
  onAdded,
}: {
  date?: string;
  businessCode?: string;
  placeholder?: string;
  onAdded?: () => void;
}) {
  const { addTask } = useStore();
  const today = useToday();
  const [title, setTitle] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      businessCode,
      scheduledDate: date,
      status: statusForDate(date, today),
    });
    setTitle('');
    onAdded?.();
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border surface-1 pl-3.5 pr-1.5 focus-within:border-primary">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        enterKeyHint="done"
        className="min-h-[48px] flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      {title.trim() && (
        <button onClick={submit} className="min-h-[38px] rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
          Add
        </button>
      )}
    </div>
  );
}

export const tomorrowOf = (today: string) => format(addDays(parseISO(today), 1), 'yyyy-MM-dd');

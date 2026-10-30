'use client';

import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTracker } from '@/lib/tracker/store';
import {
  Person,
  TTask,
  isOverdue,
  nextStatus,
  priorityMeta,
  relativeDue,
  statusMeta,
  tint,
} from '@/lib/tracker/model';

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('tk-card p-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] tk-muted">{children}</h3>
      {right}
    </div>
  );
}

export function Chip({
  color,
  children,
  active,
  onClick,
  className,
}: {
  color?: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold transition-colors',
        onClick ? 'min-h-[36px] text-xs' : 'py-0.5',
        className
      )}
      style={
        color
          ? { background: active === false ? undefined : tint(color, active ? 30 : 16), color, outline: active ? `2px solid ${color}` : undefined }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}

export function PersonDot({ person, size = 20 }: { person?: Person; size?: number }) {
  if (!person) return null;
  return (
    <span
      title={person.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: person.color, fontSize: size * 0.48 }}
    >
      {person.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: tint(color, 18) }}>
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Donut({
  segments,
  size = 120,
  stroke = 16,
  center,
  sub,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--tk-soft))" strokeWidth={stroke} />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s, i) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-extrabold leading-none">{center}</div>
        {sub && <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider tk-muted">{sub}</div>}
      </div>
    </div>
  );
}

export function CheckButton({ task, onToggle }: { task: TTask; onToggle: () => void }) {
  const done = task.status === 'done';
  return (
    <button
      type="button"
      aria-label={done ? 'Mark as not done' : 'Mark as done'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: done ? '#10b981' : 'hsl(var(--tk-muted) / 0.5)',
          background: done ? '#10b981' : 'transparent',
        }}
      >
        {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
      </span>
    </button>
  );
}

export function TaskCard({
  task,
  showStatus,
  advance,
  className,
}: {
  task: TTask;
  showStatus?: boolean;
  advance?: boolean;
  className?: string;
}) {
  const { openSheet, toggleDone, setStatus, personById, today } = useTracker();
  const done = task.status === 'done';
  const pr = priorityMeta(task.priority);
  const st = statusMeta(task.status);
  const late = isOverdue(task, today);
  const person = personById(task.assignee);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openSheet(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openSheet(task.id);
      }}
      className={cn('tk-card flex cursor-pointer items-start gap-3 p-3 text-left active:scale-[0.99]', done && 'opacity-60', className)}
    >
      <div className="pt-0.5 pl-2">
        <CheckButton task={task} onToggle={() => toggleDone(task.id)} />
      </div>
      <div className="min-w-0 flex-1 pl-1">
        <div className={cn('text-sm font-semibold leading-snug', done && 'line-through')}>{task.title}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Chip color={pr.color}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: pr.color }} />
            {pr.label}
          </Chip>
          {showStatus && <Chip color={st.color}>{st.label}</Chip>}
          {task.due && (
            <span className="text-[11px] font-semibold" style={{ color: late ? '#ef4444' : undefined }}>
              <span className={late ? '' : 'tk-muted'}>{relativeDue(task.due, today)}</span>
            </span>
          )}
          {task.repeat !== 'none' && <span className="text-[11px] tk-muted">↻ {task.repeat}</span>}
          {task.project && <span className="truncate text-[11px] tk-muted">· {task.project}</span>}
        </div>
        {task.progress > 0 && task.status !== 'done' && (
          <div className="mt-2">
            <ProgressBar value={task.progress} color={st.color} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <PersonDot person={person} />
        {advance && !done && (
          <button
            type="button"
            aria-label="Move to next stage"
            onClick={(e) => {
              e.stopPropagation();
              setStatus(task.id, nextStatus(task.status));
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="-mb-1 -mr-1 flex h-9 w-9 items-center justify-center rounded-full tk-soft tk-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed tk-line px-4 py-6 text-center text-sm tk-muted">{children}</div>;
}

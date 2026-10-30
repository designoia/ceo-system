'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTracker } from '@/lib/tracker/store';
import { PRIORITIES, STATUSES, isOverdue } from '@/lib/tracker/model';
import { Chip, EmptyState, TaskCard } from './ui';

type StatusFilter = 'open' | 'all' | 'overdue' | (typeof STATUSES)[number]['id'];

export function TasksView() {
  const { tasks, people, today } = useTracker();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [person, setPerson] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (status === 'open' && t.status === 'done') return false;
        if (status === 'overdue' && !isOverdue(t, today)) return false;
        if (status !== 'open' && status !== 'all' && status !== 'overdue' && t.status !== status) return false;
        if (person !== 'all' && t.assignee !== person) return false;
        if (priority !== 'all' && t.priority !== priority) return false;
        if (needle && !`${t.title} ${t.project ?? ''} ${t.notes ?? ''}`.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  }, [tasks, q, status, person, priority, today]);

  const row = 'tk-scroll-x -mx-1 flex gap-2 overflow-x-auto px-1';

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 tk-muted" />
        <input className="tk-input pl-9" placeholder="Search tasks, projects, notes…" value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" />
      </div>

      <div className={row}>
        {([['open', 'Open'], ['overdue', 'Overdue'], ['all', 'All']] as const).map(([id, label]) => (
          <Chip key={id} color={id === 'overdue' ? '#ef4444' : '#6366f1'} active={status === id} onClick={() => setStatus(id)}>
            {label}
          </Chip>
        ))}
        {STATUSES.map((s) => (
          <Chip key={s.id} color={s.color} active={status === s.id} onClick={() => setStatus(s.id)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <div className={row}>
        <Chip color="#94a3b8" active={person === 'all'} onClick={() => setPerson('all')}>
          Everyone
        </Chip>
        {people.map((p) => (
          <Chip key={p.id} color={p.color} active={person === p.id} onClick={() => setPerson(p.id)}>
            {p.name}
          </Chip>
        ))}
      </div>
      <div className={row}>
        <Chip color="#94a3b8" active={priority === 'all'} onClick={() => setPriority('all')}>
          Any priority
        </Chip>
        {PRIORITIES.map((p) => (
          <Chip key={p.id} color={p.color} active={priority === p.id} onClick={() => setPriority(p.id)}>
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="text-xs font-semibold tk-muted">
        {list.length} task{list.length === 1 ? '' : 's'}
      </div>
      <div className="space-y-2">
        {list.length === 0 && <EmptyState>No tasks match these filters.</EmptyState>}
        {list.map((t) => (
          <TaskCard key={t.id} task={t} showStatus advance />
        ))}
      </div>
    </div>
  );
}

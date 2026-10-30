'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { useTracker } from '@/lib/tracker/store';
import { PRIORITIES, QUADRANTS, REPEATS, STATUSES, TTask, todayYmd } from '@/lib/tracker/model';
import { Chip } from './ui';

type Draft = Omit<TTask, 'id' | 'createdAt' | 'completedAt'>;

const blank = (): Draft => ({
  title: '',
  status: 'todo',
  priority: 'medium',
  quadrant: 'decide',
  progress: 0,
  repeat: 'none',
  due: todayYmd(),
});

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] tk-muted">{children}</div>;
}

export function TaskSheet() {
  const { sheet, closeSheet, tasks, people, addTask, updateTask, deleteTask } = useTracker();
  const existing = useMemo(() => (sheet?.id ? tasks.find((t) => t.id === sheet.id) : undefined), [sheet, tasks]);
  const [draft, setDraft] = useState<Draft>(blank());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const projects = useMemo(() => Array.from(new Set(tasks.map((t) => t.project).filter(Boolean))) as string[], [tasks]);

  // Re-seed the form whenever a different task (or a new one) is opened.
  useEffect(() => {
    if (!sheet) return;
    setConfirmDelete(false);
    if (existing) {
      const { id: _id, createdAt: _c, completedAt: _d, ...rest } = existing;
      setDraft(rest);
    } else {
      setDraft({ ...blank(), ...sheet.defaults });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet?.id, sheet?.defaults]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const title = draft.title.trim();
    if (!title) return;
    const clean: Draft = {
      ...draft,
      title,
      project: draft.project?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      due: draft.due || undefined,
      start: draft.start || undefined,
    };
    if (existing) updateTask(existing.id, clean);
    else addTask(clean);
    closeSheet();
  };

  return (
    <AnimatePresence>
      {sheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
            className="absolute inset-0 bg-black/55"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="tk-root tk-card relative flex max-h-[92dvh] w-full flex-col rounded-b-none sm:max-w-lg sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={existing ? 'Edit task' : 'New task'}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <h2 className="text-base font-bold">{existing ? 'Edit task' : 'New task'}</h2>
              <button onClick={closeSheet} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full tk-soft">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
              <div>
                <input
                  className="tk-input text-base font-semibold"
                  placeholder="What needs doing?"
                  value={draft.title}
                  onChange={(e) => set('title', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                  autoFocus={!existing}
                />
              </div>

              <div>
                <Label>Stage</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <Chip key={s.id} color={s.color} active={draft.status === s.id} onClick={() => set('status', s.id)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <Chip key={p.id} color={p.color} active={draft.priority === p.id} onClick={() => set('priority', p.id)}>
                      {p.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Decision matrix</Label>
                <div className="flex flex-wrap gap-2">
                  {QUADRANTS.map((q) => (
                    <Chip key={q.id} color={q.color} active={draft.quadrant === q.id} onClick={() => set('quadrant', q.id)}>
                      {q.label}
                    </Chip>
                  ))}
                </div>
                <p className="mt-1.5 text-xs tk-muted">{QUADRANTS.find((q) => q.id === draft.quadrant)?.hint}</p>
              </div>

              <div>
                <Label>Assigned to</Label>
                <div className="flex flex-wrap gap-2">
                  <Chip color="#94a3b8" active={!draft.assignee} onClick={() => set('assignee', undefined)}>
                    Nobody
                  </Chip>
                  {people.map((p) => (
                    <Chip key={p.id} color={p.color} active={draft.assignee === p.id} onClick={() => set('assignee', p.id)}>
                      {p.name}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start</Label>
                  <input type="date" className="tk-input" value={draft.start ?? ''} onChange={(e) => set('start', e.target.value || undefined)} />
                </div>
                <div>
                  <Label>Due</Label>
                  <input
                    type="date"
                    className="tk-input"
                    value={draft.due ?? ''}
                    min={draft.start}
                    onChange={(e) => set('due', e.target.value || undefined)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Project</Label>
                  <input
                    className="tk-input"
                    list="tk-projects"
                    placeholder="e.g. Website"
                    value={draft.project ?? ''}
                    onChange={(e) => set('project', e.target.value)}
                  />
                  <datalist id="tk-projects">
                    {projects.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label>Repeat</Label>
                  <select className="tk-input" value={draft.repeat} onChange={(e) => set('repeat', e.target.value as Draft['repeat'])}>
                    {REPEATS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Progress · {draft.progress}%</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={draft.progress}
                  onChange={(e) => set('progress', Number(e.target.value))}
                  className="h-11 w-full accent-indigo-500"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <textarea
                  className="tk-input py-2.5"
                  style={{ minHeight: 88 }}
                  placeholder="Anything worth remembering…"
                  value={draft.notes ?? ''}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t tk-line px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {existing && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmDelete) return setConfirmDelete(true);
                    deleteTask(existing.id);
                    closeSheet();
                  }}
                  className="flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
                  style={{ background: confirmDelete ? '#ef4444' : 'color-mix(in srgb, #ef4444 14%, transparent)', color: confirmDelete ? '#fff' : '#ef4444' }}
                >
                  <Trash2 className="h-4 w-4" />
                  {confirmDelete ? 'Tap to confirm' : 'Delete'}
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={!draft.title.trim()}
                className="tk-accent-bg h-12 flex-1 rounded-xl text-sm font-bold disabled:opacity-40"
              >
                {existing ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

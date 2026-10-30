'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { useTracker } from '@/lib/tracker/store';
import { PersonDot, SectionTitle } from './ui';

export function SetupSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { people, addPerson, removePerson, loadSample, clearAll, tasks } = useTracker();
  const [name, setName] = useState('');
  const [armed, setArmed] = useState<'sample' | 'clear' | null>(null);

  useEffect(() => {
    if (!open) setArmed(null);
  }, [open]);

  const submit = () => {
    addPerson(name);
    setName('');
  };

  const confirm = (kind: 'sample' | 'clear') => {
    if (armed !== kind) return setArmed(kind);
    if (kind === 'sample') loadSample();
    else clearAll();
    setArmed(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/55" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="tk-root tk-card relative max-h-[90dvh] w-full overflow-y-auto rounded-b-none p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Setup"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Setup</h2>
              <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full tk-soft">
                <X className="h-5 w-5" />
              </button>
            </div>

            <SectionTitle>People</SectionTitle>
            <ul className="mb-3 space-y-1">
              {people.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl px-1 py-1">
                  <PersonDot person={p} size={28} />
                  <span className="flex-1 text-sm font-semibold">{p.name}</span>
                  <button aria-label={`Remove ${p.name}`} onClick={() => removePerson(p.id)} className="flex h-10 w-10 items-center justify-center rounded-full tk-muted">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {people.length === 0 && <li className="text-sm tk-muted">No one yet — add a teammate (or just yourself).</li>}
            </ul>
            <div className="flex gap-2">
              <input className="tk-input" placeholder="Add a person" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
              <button onClick={submit} disabled={!name.trim()} className="tk-accent-bg h-11 shrink-0 rounded-xl px-5 text-sm font-bold disabled:opacity-40">
                Add
              </button>
            </div>

            <div className="mt-6">
              <SectionTitle>Data</SectionTitle>
              <p className="mb-3 text-xs tk-muted">
                Everything is saved on this device ({tasks.length} tasks). Nothing is sent anywhere.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={() => confirm('sample')} className="h-11 rounded-xl text-sm font-bold tk-soft">
                  {armed === 'sample' ? 'Tap again — replaces all tasks' : 'Load sample tasks'}
                </button>
                <button
                  onClick={() => confirm('clear')}
                  className="h-11 rounded-xl text-sm font-bold"
                  style={{ background: armed === 'clear' ? '#ef4444' : 'color-mix(in srgb, #ef4444 14%, transparent)', color: armed === 'clear' ? '#fff' : '#ef4444' }}
                >
                  {armed === 'clear' ? 'Tap again to delete everything' : 'Start empty (delete all tasks)'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

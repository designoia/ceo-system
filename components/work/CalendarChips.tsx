'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Settings2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { CAL_COLORS } from '@/lib/work';

/** "All calendars" + one chip per calendar the user created. */
export function CalendarChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { businesses } = useStore();
  const [manage, setManage] = useState(false);

  // A deleted calendar can't stay selected.
  const selected = value === 'ALL' || businesses.some((b) => b.code === value) ? value : 'ALL';

  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => onChange('ALL')}
          className={cn(
            'min-h-[40px] shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-colors',
            selected === 'ALL' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
          )}
        >
          {businesses.length > 0 ? 'All calendars' : 'All'}
        </button>
        {businesses.map((b) => (
          <button
            key={b.code}
            onClick={() => onChange(b.code)}
            className={cn(
              'flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors',
              selected === b.code ? 'text-white' : 'border-border text-muted-foreground'
            )}
            style={selected === b.code ? { background: b.color, borderColor: b.color } : undefined}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: selected === b.code ? '#fff' : b.color }} />
            {b.name}
          </button>
        ))}
        <button
          onClick={() => setManage(true)}
          aria-label="Add or edit calendars"
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-[13px] font-semibold text-muted-foreground"
        >
          {businesses.length === 0 ? <Plus className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          {businesses.length === 0 ? 'Add calendar' : 'Edit'}
        </button>
      </div>
      <ManageCalendarsSheet open={manage} onClose={() => setManage(false)} />
    </>
  );
}

export function ManageCalendarsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { businesses, addBusiness, updateBusiness, deleteBusiness } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(CAL_COLORS[0]);
  const [armed, setArmed] = useState<string | null>(null);

  const add = () => {
    if (!name.trim()) return;
    addBusiness(name, color);
    setName('');
    setColor(CAL_COLORS[(businesses.length + 1) % CAL_COLORS.length]);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="surface-1 relative max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl border border-border p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Calendars"
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-bold">Your calendars</h2>
              <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">One per part of your life or business. Every task can belong to one, and the combined view shows them all.</p>

            <ul className="mb-4 space-y-2">
              {businesses.map((b) => (
                <li key={b.code} className="rounded-xl border border-border p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: b.color }} />
                    <input
                      defaultValue={b.name}
                      onBlur={(e) => e.target.value.trim() && updateBusiness(b.code, { name: e.target.value.trim() })}
                      className="min-h-[40px] flex-1 bg-transparent text-[15px] font-semibold outline-none"
                      aria-label="Calendar name"
                    />
                    <button
                      onClick={() => {
                        if (armed !== b.code) return setArmed(b.code);
                        deleteBusiness(b.code);
                        setArmed(null);
                      }}
                      className={cn('flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold', armed === b.code ? 'bg-red-500 text-white' : 'text-muted-foreground')}
                      aria-label={`Delete ${b.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {armed === b.code && 'Sure?'}
                    </button>
                  </div>
                  <div className="mt-1.5 flex gap-2 pl-6">
                    {CAL_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateBusiness(b.code, { color: c })}
                        aria-label={`Colour ${c}`}
                        className="h-6 w-6 rounded-full"
                        style={{ background: c, outline: b.color === c ? `2px solid ${c}` : undefined, outlineOffset: 2 }}
                      />
                    ))}
                  </div>
                </li>
              ))}
              {businesses.length === 0 && <li className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No calendars yet. Add your first below.</li>}
            </ul>

            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && add()}
                  placeholder="New calendar name"
                  className="min-h-[44px] flex-1 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-primary"
                />
                <button onClick={add} disabled={!name.trim()} className="min-h-[44px] rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-40">
                  Add
                </button>
              </div>
              <div className="mt-2.5 flex gap-2.5">
                {CAL_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Colour ${c}`}
                    className="h-7 w-7 rounded-full"
                    style={{ background: c, outline: color === c ? `2px solid ${c}` : undefined, outlineOffset: 2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

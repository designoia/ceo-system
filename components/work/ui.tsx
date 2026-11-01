'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pill({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('min-h-[40px] rounded-full border px-4 text-[13px] font-semibold transition-colors', active ? 'text-white' : 'border-border text-muted-foreground')}
      style={active ? { background: color ?? 'hsl(var(--primary))', borderColor: color ?? 'hsl(var(--primary))' } : undefined}
    >
      {children}
    </button>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{children}</div>;
}

export function ProgressBar({ value, color = 'hsl(var(--primary))' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function EmptyCard({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** One-line "type and press Enter" input used on every list page. */
export function AddLine({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [text, setText] = React.useState('');
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border surface-1 pl-3.5 pr-1.5 focus-within:border-primary">
      <span className="text-lg leading-none text-muted-foreground">+</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        enterKeyHint="done"
        className="min-h-[48px] flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      {text.trim() && (
        <button onClick={submit} className="min-h-[38px] rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
          Add
        </button>
      )}
    </div>
  );
}

/**
 * Bottom sheet on phones, centred card on desktop.
 * `onDelete` shows a two-tap Delete button in the footer.
 */
export function Sheet({
  open,
  onClose,
  title,
  onTitleChange,
  onDelete,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  onTitleChange?: (t: string) => void;
  onDelete?: () => void;
  children: React.ReactNode;
}) {
  const [armed, setArmed] = React.useState(false);
  const [draft, setDraft] = React.useState(title);

  useEffect(() => {
    setDraft(title);
    setArmed(false);
  }, [title, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    if (onTitleChange && draft.trim() && draft.trim() !== title) onTitleChange(draft.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="surface-1 relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-border sm:max-w-lg sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-start gap-2 px-5 pb-1 pt-4">
              {onTitleChange ? (
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => draft.trim() && draft.trim() !== title && onTitleChange(draft.trim())}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  aria-label="Name"
                  className="min-h-[44px] flex-1 bg-transparent text-lg font-bold outline-none"
                />
              ) : (
                <h2 className="flex-1 pt-2.5 text-lg font-bold">{title}</h2>
              )}
              <button onClick={close} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-4 pt-2">{children}</div>
            <div className="flex items-center gap-3 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {onDelete && (
                <button
                  onClick={() => {
                    if (!armed) return setArmed(true);
                    onDelete();
                  }}
                  className={cn('flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold', armed ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500')}
                >
                  <Trash2 className="h-4 w-4" />
                  {armed ? 'Tap to confirm' : 'Delete'}
                </button>
              )}
              <button onClick={close} className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

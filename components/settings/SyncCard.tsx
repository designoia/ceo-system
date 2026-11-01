'use client';

import React, { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSync } from '@/lib/sync/SyncProvider';

const STEPS = [
  'Create a free project at supabase.com.',
  'Open SQL Editor and run the file supabase/migrations/20261101_user_sync.sql (copy and paste it).',
  'Authentication → Providers → Email: turn OFF “Confirm email” (easiest for one person).',
  'Project Settings → API: copy the Project URL and the anon public key.',
  'In Vercel → Settings → Environment Variables add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.',
  'Come back here, create your account, and sign in on each device with the same email.',
];

/** "Sync across devices": sign in once on each device and your data follows you. */
export function SyncCard() {
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (kind: 'in' | 'up') => {
    if (!email.trim() || password.length < 6) return setMsg('Enter your email and a password of at least 6 characters.');
    setBusy(true);
    setMsg(null);
    const err = kind === 'in' ? await sync.signIn(email, password) : await sync.signUp(email, password);
    setBusy(false);
    if (err) setMsg(err);
  };

  if (sync.status === 'loading') return null;

  const dot = (c: string) => <span className={cn('h-2 w-2 rounded-full', c)} />;

  return (
    <section className="surface-1 rounded-2xl border border-border p-5" aria-label="Sync across devices">
      <div className="mb-3 flex items-center gap-2">
        {sync.configured ? <Cloud className="h-4 w-4 text-primary" /> : <CloudOff className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-sm font-bold">Sync across devices</h3>
      </div>

      {!sync.configured && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sync isn’t switched on for this site yet. Your data is safe on this device only. To use the same tasks on your phone and laptop, set it up once:
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-snug text-foreground/90">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {sync.configured && sync.status === 'signed-out' && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run('in');
          }}
        >
          <p className="text-sm text-muted-foreground">Sign in on each device with the same email. Everything on this device is kept and merged with what’s in the cloud.</p>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="min-h-[48px] w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-primary"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="min-h-[48px] w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-primary"
          />
          {msg && <p className="text-[13px] text-amber-500">{msg}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="min-h-[48px] flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">
              {busy ? 'Please wait…' : 'Sign in'}
            </button>
            <button type="button" disabled={busy} onClick={() => run('up')} className="min-h-[48px] flex-1 rounded-xl border border-border text-sm font-semibold disabled:opacity-50">
              Create account
            </button>
          </div>
        </form>
      )}

      {sync.configured && sync.status !== 'signed-out' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{sync.email}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                {sync.status === 'syncing' && (<>{dot('bg-blue-400 animate-pulse')} Syncing…</>)}
                {sync.status === 'synced' && (<>{dot('bg-emerald-500')} Synced{sync.lastSyncedAt ? ` · ${formatDistanceToNow(parseISO(sync.lastSyncedAt), { addSuffix: true })}` : ''}</>)}
                {sync.status === 'offline' && (<>{dot('bg-amber-500')} Offline — will sync when you’re back online</>)}
                {sync.status === 'error' && (<>{dot('bg-red-500')} Couldn’t sync</>)}
                {sync.status === 'held' && (<>{dot('bg-amber-500')} Sync paused</>)}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={sync.syncNow} aria-label="Sync now" className="flex h-11 w-11 items-center justify-center rounded-full border border-border">
                <RefreshCw className={cn('h-4 w-4', sync.status === 'syncing' && 'animate-spin')} />
              </button>
              <button onClick={sync.signOut} aria-label="Sign out" className="flex h-11 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-semibold">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          {sync.status === 'error' && sync.error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{sync.error}</p>}

          {sync.status === 'held' && (
            <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
              <p className="text-sm font-semibold">This would delete {sync.heldCount} items from every device.</p>
              <p className="text-xs text-muted-foreground">Most of what was synced before is missing on this device. If that’s not what you meant (for example, you cleared your browser data), bring the cloud copy back.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => sync.resolveHeld('restore')} className="min-h-[44px] flex-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
                  Restore from cloud
                </button>
                <button onClick={() => sync.resolveHeld('delete')} className="min-h-[44px] flex-1 rounded-xl bg-red-500/15 px-4 text-sm font-semibold text-red-400">
                  Delete everywhere
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

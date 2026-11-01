'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { clearPending, markPendingChange } from '@/lib/offline-queue';
import { Collections, Item, Meta, RemoteRow, SYNC_KINDS, SyncKind, hashOf, isMassDeletion, reconcile } from './engine';

export type SyncStatus = 'loading' | 'off' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error' | 'held';

interface SyncApi {
  /** Supabase keys are present in this build. */
  configured: boolean;
  status: SyncStatus;
  email: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  /** How many records a held sync would delete everywhere. */
  heldCount: number;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  syncNow: () => void;
  /** Call right before an intentional "delete everything" so the safety check lets it through. */
  allowWipe: () => void;
  /** Resolve a held sync: delete on every device, or bring the cloud copy back. */
  resolveHeld: (action: 'delete' | 'restore') => void;
}

const SyncContext = createContext<SyncApi | null>(null);

export function useSync(): SyncApi {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside <SyncProvider>');
  return ctx;
}

const META_KEY = (uid: string) => `ceo_os_sync_meta_v1:${uid}`;
const PAGE = 1000;
const CHUNK = 400;

const loadMeta = (uid: string): Meta => {
  try {
    return JSON.parse(localStorage.getItem(META_KEY(uid)) || '{}') as Meta;
  } catch {
    return {};
  }
};
const saveMeta = (uid: string, meta: Meta) => {
  try {
    localStorage.setItem(META_KEY(uid), JSON.stringify(meta));
  } catch {
    /* storage full — the next sync recomputes from scratch, which is safe */
  }
};

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { isLoaded, applySyncPatch, businesses, goals, projects, tasks, scheduleEntries } = store;

  // Created after mount so the server render and the first browser render are identical.
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heldCount, setHeldCount] = useState(0);

  // Always-current view of local data for the sync loop (it must not capture stale arrays).
  const colsRef = useRef<Collections>({ businesses: [], goals: [], projects: [], tasks: [], scheduleEntries: [] });
  colsRef.current = { businesses, goals, projects, tasks, scheduleEntries } as unknown as Collections;

  const running = useRef(false);
  const rerun = useRef(false);
  const wipeUntil = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    if (!client) setStatus('off');
  }, []);

  // ---- auth session
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !authReady) return;
    if (!session) {
      setStatus('signed-out');
      setError(null);
      setHeldCount(0);
    }
  }, [supabase, authReady, session]);

  // ---- one full pass: pull everything, merge, push our changes
  const runSync = useCallback(
    async (opts?: { restore?: boolean }) => {
      if (!supabase || !userId || !isLoaded) return;
      if (running.current) {
        rerun.current = true;
        return;
      }
      running.current = true;
      setStatus((s) => (s === 'held' ? s : 'syncing'));
      try {
        const rows: RemoteRow[] = [];
        for (let from = 0; ; from += PAGE) {
          const { data, error: e } = await supabase
            .from('sync_records')
            .select('kind,id,data,deleted,updated_at')
            .order('updated_at', { ascending: true })
            .order('id', { ascending: true })
            .range(from, from + PAGE - 1);
          if (e) throw e;
          rows.push(...((data ?? []) as RemoteRow[]));
          if (!data || data.length < PAGE) break;
        }

        const snapshot = colsRef.current;
        const meta = opts?.restore ? {} : loadMeta(userId);
        const plan = reconcile({ local: snapshot, remote: rows, meta, now: new Date().toISOString() });

        if (isMassDeletion(plan) && Date.now() > wipeUntil.current) {
          const total = SYNC_KINDS.reduce((a, k) => a + plan.deletions[k].count, 0);
          setHeldCount(total);
          setStatus('held');
          return; // nothing applied, nothing pushed
        }
        setHeldCount(0);

        // Apply what arrived from other devices. Anything edited here while we were waiting is left alone.
        for (const kind of SYNC_KINDS as readonly SyncKind[]) {
          const { upserts, deletes } = plan.apply[kind];
          if (upserts.length === 0 && deletes.length === 0) continue;
          const before = new Map(snapshot[kind].map((i) => [i.id, hashOf(i)]));
          applySyncPatch(kind, (prev: Item[]) => {
            const del = new Set(deletes);
            const up = new Map(upserts.map((u) => [u.id, u]));
            const out: Item[] = [];
            for (const item of prev) {
              const editedMeanwhile = before.has(item.id) && before.get(item.id) !== hashOf(item);
              if (del.has(item.id)) {
                if (editedMeanwhile) out.push(item);
              } else if (up.has(item.id)) {
                out.push(editedMeanwhile ? item : (up.get(item.id) as Item));
                up.delete(item.id);
              } else out.push(item);
            }
            up.forEach((u) => out.push(u));
            return out;
          });
        }

        for (let i = 0; i < plan.push.length; i += CHUNK) {
          const chunk = plan.push.slice(i, i + CHUNK).map((r) => ({
            user_id: userId,
            kind: r.kind,
            id: r.id,
            data: r.data,
            deleted: r.deleted,
            updated_at: r.updated_at,
          }));
          const { error: e } = await supabase.from('sync_records').upsert(chunk, { onConflict: 'user_id,kind,id' });
          if (e) throw e;
        }

        saveMeta(userId, plan.meta);
        clearPending();
        setError(null);
        setLastSyncedAt(new Date().toISOString());
        setStatus('synced');
      } catch (e) {
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        markPendingChange();
        setStatus(offline ? 'offline' : 'error');
        setError(offline ? null : e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Sync failed');
      } finally {
        running.current = false;
        if (rerun.current) {
          rerun.current = false;
          schedule(400);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, userId, isLoaded, applySyncPatch]
  );

  const runRef = useRef(runSync);
  runRef.current = runSync;

  function schedule(delay: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runRef.current(), delay);
  }

  // ---- when to sync: signing in, any local change, other devices' changes, focus, reconnect, a slow heartbeat
  useEffect(() => {
    if (!supabase || !userId || !isLoaded) return;
    schedule(100);
    const onWake = () => schedule(300);
    const onVisible = () => document.visibilityState === 'visible' && schedule(300);
    window.addEventListener('focus', onWake);
    window.addEventListener('online', onWake);
    document.addEventListener('visibilitychange', onVisible);
    const beat = setInterval(() => schedule(0), 90_000);

    const channel = supabase
      .channel(`sync-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sync_records', filter: `user_id=eq.${userId}` }, () => schedule(400))
      .subscribe();

    return () => {
      window.removeEventListener('focus', onWake);
      window.removeEventListener('online', onWake);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(beat);
      supabase.removeChannel(channel);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, isLoaded]);

  useEffect(() => {
    if (!supabase || !userId || !isLoaded) return;
    schedule(1500); // debounce bursts of edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses, goals, projects, tasks, scheduleEntries]);

  const api: SyncApi = useMemo(
    () => ({
      configured: !!supabase,
      status,
      email: session?.user.email ?? null,
      lastSyncedAt,
      error,
      heldCount,
      signIn: async (email, password) => {
        if (!supabase) return 'Sync is not set up yet.';
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return e ? e.message : null;
      },
      signUp: async (email, password) => {
        if (!supabase) return 'Sync is not set up yet.';
        const { data, error: e } = await supabase.auth.signUp({ email: email.trim(), password });
        if (e) return e.message;
        if (!data.session) return 'Account created. Check your email to confirm it, then sign in.';
        return null;
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
      },
      syncNow: () => schedule(0),
      allowWipe: () => {
        wipeUntil.current = Date.now() + 60_000;
      },
      resolveHeld: (action) => {
        if (action === 'delete') {
          wipeUntil.current = Date.now() + 60_000;
          schedule(0);
        } else {
          setHeldCount(0);
          setStatus('syncing');
          runRef.current({ restore: true });
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, status, session, lastSyncedAt, error, heldCount]
  );

  return <SyncContext.Provider value={api}>{children}</SyncContext.Provider>;
}

/**
 * Minimal offline-queue tracker. Task CRUD itself already works offline
 * (everything reads/writes local React state + localStorage first — see
 * lib/store.tsx). This just tracks how many local changes haven't been
 * pushed to Supabase yet, so the UI can honestly say "Offline · N changes
 * queued" instead of silently swallowing failed background syncs.
 */

const STORAGE_KEY = 'ceo_os_pending_sync_count_v1';
const EVENT_NAME = 'designoia:pending-sync-changed';

export function getPendingCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function setPendingCount(n: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(Math.max(0, n)));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: Math.max(0, n) }));
}

export function markPendingChange() {
  setPendingCount(getPendingCount() + 1);
}

export function clearPending() {
  setPendingCount(0);
}

export function onPendingChange(cb: (count: number) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

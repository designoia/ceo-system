/**
 * Two-device sync engine (pure logic — no network, no React).
 *
 * Every record (task, goal, project, calendar, schedule block) is synced on its own,
 * "last edit wins" by timestamp. `meta` remembers, per record, what we last agreed on with
 * the cloud and when it was last edited here, so we can tell "I changed it" from "they changed it"
 * and "I deleted it" from "it was never here".
 */

export const SYNC_KINDS = ['businesses', 'goals', 'projects', 'tasks', 'scheduleEntries'] as const;
export type SyncKind = (typeof SYNC_KINDS)[number];

export type Item = { id: string } & Record<string, unknown>;
export type Collections = Record<SyncKind, Item[]>;

export interface RemoteRow {
  kind: string;
  id: string;
  data: Item | null;
  deleted: boolean;
  updated_at: string;
}

export interface PushRow {
  kind: SyncKind;
  id: string;
  data: Item | null;
  deleted: boolean;
  updated_at: string;
}

/** key = `${kind}:${id}`. hash '' = "known deleted". */
export type Meta = Record<string, { hash: string; modifiedAt: string }>;

export interface Plan {
  apply: Record<SyncKind, { upserts: Item[]; deletes: string[] }>;
  push: PushRow[];
  /** Meta to store once the push has succeeded. */
  meta: Meta;
  /** Local deletions about to be sent, and how many records of that kind were previously synced. */
  deletions: Record<SyncKind, { count: number; known: number }>;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v === undefined ? null : v)).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const k of Object.keys(obj).sort()) {
    if (obj[k] === undefined) continue;
    parts.push(`${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  }
  return `{${parts.join(',')}}`;
}

/** cyrb53 — small, fast, good enough to notice "did this record change". */
export function hashOf(value: unknown): string {
  const str = stableStringify(value);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const ms = (iso: string) => {
  const n = Date.parse(iso);
  return Number.isNaN(n) ? 0 : n;
};

const emptyApply = () => ({ upserts: [] as Item[], deletes: [] as string[] });

export function reconcile(input: { local: Collections; remote: RemoteRow[]; meta: Meta; now: string }): Plan {
  const { local, remote, meta, now } = input;
  const nextMeta: Meta = {};
  const push: PushRow[] = [];
  const apply = {} as Plan['apply'];
  const deletions = {} as Plan['deletions'];

  const remoteByKey = new Map<string, RemoteRow>();
  for (const r of remote) remoteByKey.set(`${r.kind}:${r.id}`, r);

  for (const kind of SYNC_KINDS) {
    apply[kind] = emptyApply();
    deletions[kind] = { count: 0, known: 0 };

    const localById = new Map<string, Item>();
    for (const it of local[kind]) localById.set(it.id, it);

    const ids = new Set<string>(localById.keys());
    for (const r of remote) if (r.kind === kind) ids.add(r.id);
    const prefix = `${kind}:`;
    for (const key of Object.keys(meta)) {
      if (key.startsWith(prefix)) {
        ids.add(key.slice(prefix.length));
        if (meta[key].hash !== '') deletions[kind].known++;
      }
    }

    for (const id of Array.from(ids)) {
      const key = `${kind}:${id}`;
      const li = localById.get(id);
      const r = remoteByKey.get(key);
      const m = meta[key];

      if (li) {
        const lh = hashOf(li);
        const lmod = m && m.hash === lh ? m.modifiedAt : now; // unchanged since last sync keeps its old time
        if (!r) {
          push.push({ kind, id, data: li, deleted: false, updated_at: lmod });
          nextMeta[key] = { hash: lh, modifiedAt: lmod };
        } else if (r.deleted) {
          if (ms(r.updated_at) > ms(lmod)) {
            apply[kind].deletes.push(id); // deleted elsewhere after our last edit
          } else {
            push.push({ kind, id, data: li, deleted: false, updated_at: lmod }); // edited here after the delete
            nextMeta[key] = { hash: lh, modifiedAt: lmod };
          }
        } else {
          const rh = hashOf(r.data);
          if (rh === lh) {
            nextMeta[key] = { hash: lh, modifiedAt: r.updated_at };
          } else if (ms(r.updated_at) > ms(lmod)) {
            apply[kind].upserts.push(r.data as Item);
            nextMeta[key] = { hash: rh, modifiedAt: r.updated_at };
          } else {
            push.push({ kind, id, data: li, deleted: false, updated_at: lmod });
            nextMeta[key] = { hash: lh, modifiedAt: lmod };
          }
        }
        continue;
      }

      // Not here locally.
      if (r && !r.deleted) {
        if (m && m.hash !== '' && ms(r.updated_at) <= ms(m.modifiedAt)) {
          // We had it, it is gone, and nobody edited it since: that's a deletion made here.
          push.push({ kind, id, data: null, deleted: true, updated_at: now });
          nextMeta[key] = { hash: '', modifiedAt: now };
          deletions[kind].count++;
        } else {
          // New from the other device (or edited there after we deleted it): bring it in.
          apply[kind].upserts.push(r.data as Item);
          nextMeta[key] = { hash: hashOf(r.data), modifiedAt: r.updated_at };
        }
      }
      // r deleted, or no remote row and only stale meta: nothing to keep.
    }
  }

  return { apply, push, meta: nextMeta, deletions };
}

/** Would pushing this plan wipe out a large share of what was previously synced? */
export function isMassDeletion(plan: Plan): boolean {
  return SYNC_KINDS.some((k) => {
    const { count, known } = plan.deletions[k];
    return count >= 10 && count >= known * 0.6;
  });
}

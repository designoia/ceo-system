'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FocusSession,
  Person,
  PERSON_COLORS,
  Status,
  TTask,
  buildSeed,
  nextOccurrence,
  todayYmd,
  uid,
} from './model';

const STORAGE_KEY = 'tk-tracker-v1';

type Theme = 'light' | 'dark';

interface Persisted {
  tasks: TTask[];
  people: Person[];
  sessions: FocusSession[];
  theme: Theme;
}

export interface SheetState {
  id: string | null; // null = new task
  defaults?: Partial<TTask>;
}

interface TrackerApi {
  ready: boolean;
  tasks: TTask[];
  people: Person[];
  sessions: FocusSession[];
  theme: Theme;
  today: string;
  sheet: SheetState | null;
  openSheet: (id: string | null, defaults?: Partial<TTask>) => void;
  closeSheet: () => void;
  addTask: (t: Partial<TTask> & { title: string }) => void;
  updateTask: (id: string, patch: Partial<TTask>) => void;
  setStatus: (id: string, status: Status) => void;
  toggleDone: (id: string) => void;
  deleteTask: (id: string) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  logSession: (minutes: number, taskId?: string) => void;
  setTheme: (t: Theme) => void;
  loadSample: () => void;
  clearAll: () => void;
  personById: (id?: string) => Person | undefined;
}

const TrackerContext = createContext<TrackerApi | null>(null);

export type TimerMode = 'focus' | 'short' | 'long';
export const TIMER_MINUTES: Record<TimerMode, number> = { focus: 25, short: 5, long: 15 };

interface TimerApi {
  mode: TimerMode;
  leftMs: number;
  totalMs: number;
  running: boolean;
  taskId?: string;
  finishedAt: number | null;
  setMode: (m: TimerMode) => void;
  setTaskId: (id?: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const TimerContext = createContext<TimerApi | null>(null);

export function useTracker(): TrackerApi {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used inside <TrackerProvider>');
  return ctx;
}

export function useFocusTimer(): TimerApi {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used inside <TrackerProvider>');
  return ctx;
}

/** Applies a status change, keeping progress/completion in sync. Returns the updated task plus a follow-up for recurring work. */
function applyStatus(task: TTask, status: Status): { task: TTask; spawn?: TTask } {
  if (task.status === status) return { task };
  const now = new Date().toISOString();
  if (status === 'done') {
    const done: TTask = { ...task, status, progress: 100, completedAt: now };
    let spawn: TTask | undefined;
    if (task.repeat !== 'none') {
      const base = task.due ?? todayYmd();
      let due = nextOccurrence(base, task.repeat);
      // Never spawn something already in the past (e.g. a daily task completed days late).
      while (due < todayYmd()) due = nextOccurrence(due, task.repeat);
      const span = task.start && task.due ? (new Date(task.due).getTime() - new Date(task.start).getTime()) / 86_400_000 : 0;
      spawn = {
        ...task,
        id: uid(),
        status: 'todo',
        progress: 0,
        due,
        start: task.start ? new Date(new Date(due).getTime() - span * 86_400_000).toISOString().slice(0, 10) : undefined,
        createdAt: now,
        completedAt: undefined,
      };
    }
    return { task: done, spawn };
  }
  const reopened: TTask = { ...task, status, completedAt: undefined };
  if (task.status === 'done') reopened.progress = status === 'backlog' || status === 'todo' ? 0 : 75;
  if (status === 'backlog' || status === 'todo') reopened.progress = 0;
  return { task: reopened };
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<TTask[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [theme, setThemeState] = useState<Theme>('light');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [today, setToday] = useState(todayYmd());

  // Load once on mount (client-only: avoids SSR/localStorage mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Persisted;
        setTasks(data.tasks ?? []);
        setPeople(data.people ?? []);
        setSessions(data.sessions ?? []);
        setThemeState(data.theme === 'dark' ? 'dark' : 'light');
      } else {
        const seed = buildSeed(todayYmd());
        setTasks(seed.tasks);
        setPeople(seed.people);
        setThemeState(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    } catch {
      const seed = buildSeed(todayYmd());
      setTasks(seed.tasks);
      setPeople(seed.people);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, people, sessions, theme } satisfies Persisted));
    } catch {
      /* storage full or blocked — the app keeps working in memory */
    }
  }, [ready, tasks, people, sessions, theme]);

  // Roll "today" over at midnight / when the tab regains focus after being backgrounded.
  useEffect(() => {
    const sync = () => setToday(todayYmd());
    const id = window.setInterval(sync, 60_000);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const addTask: TrackerApi['addTask'] = useCallback((t) => {
    const now = new Date().toISOString();
    const base: TTask = {
      status: 'todo',
      priority: 'medium',
      quadrant: 'decide',
      progress: 0,
      repeat: 'none',
      ...t,
      id: uid(),
      createdAt: now,
    };
    setTasks((prev) => [base, ...prev]);
  }, []);

  const updateTask: TrackerApi['updateTask'] = useCallback((id, patch) => {
    setTasks((prev) => {
      const out: TTask[] = [];
      for (const t of prev) {
        if (t.id !== id) {
          out.push(t);
          continue;
        }
        const { status, ...rest } = patch;
        let next: TTask = { ...t, ...rest };
        if (status && status !== t.status) {
          const res = applyStatus(next, status);
          next = res.task;
          if (res.spawn) out.push(res.spawn);
        } else if (next.progress >= 100 && next.status !== 'done') {
          const res = applyStatus(next, 'done');
          next = res.task;
          if (res.spawn) out.push(res.spawn);
        }
        out.push(next);
      }
      return out;
    });
  }, []);

  const setStatus = useCallback((id: string, status: Status) => updateTask(id, { status }), [updateTask]);

  const toggleDone = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      updateTask(id, { status: t.status === 'done' ? 'todo' : 'done' });
    },
    [tasks, updateTask]
  );

  const deleteTask = useCallback((id: string) => setTasks((prev) => prev.filter((t) => t.id !== id)), []);

  const addPerson = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setPeople((prev) => [...prev, { id: uid(), name: clean, color: PERSON_COLORS[prev.length % PERSON_COLORS.length] }]);
  }, []);

  const removePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.map((t) => (t.assignee === id ? { ...t, assignee: undefined } : t)));
  }, []);

  const logSession = useCallback((minutes: number, taskId?: string) => {
    setSessions((prev) => [...prev, { id: uid(), minutes, taskId, at: new Date().toISOString() }]);
  }, []);

  const loadSample = useCallback(() => {
    const seed = buildSeed(todayYmd());
    setTasks(seed.tasks);
    setPeople(seed.people);
    setSessions([]);
  }, []);

  const clearAll = useCallback(() => {
    setTasks([]);
    setSessions([]);
  }, []);

  const personById = useCallback((id?: string) => people.find((p) => p.id === id), [people]);

  const openSheet = useCallback((id: string | null, defaults?: Partial<TTask>) => setSheet({ id, defaults }), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  // ---- Focus timer (lives here so it keeps running while you browse other views) ----
  const [mode, setModeState] = useState<TimerMode>('focus');
  const [totalMs, setTotalMs] = useState(TIMER_MINUTES.focus * 60_000);
  const [leftMs, setLeftMs] = useState(TIMER_MINUTES.focus * 60_000);
  const [running, setRunning] = useState(false);
  const [timerTask, setTimerTask] = useState<string | undefined>();
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const endsAt = useRef<number | null>(null);
  const modeRef = useRef(mode);
  const taskRef = useRef(timerTask);
  const totalRef = useRef(totalMs);
  modeRef.current = mode;
  taskRef.current = timerTask;
  totalRef.current = totalMs;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (endsAt.current == null) return;
      const left = endsAt.current - Date.now();
      if (left > 0) {
        setLeftMs(left);
        return;
      }
      endsAt.current = null;
      setRunning(false);
      setLeftMs(totalRef.current);
      setFinishedAt(Date.now());
      if (modeRef.current === 'focus') logSession(Math.round(totalRef.current / 60_000), taskRef.current);
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        /* vibration unsupported */
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, logSession]);

  const timer: TimerApi = useMemo(
    () => ({
      mode,
      leftMs,
      totalMs,
      running,
      taskId: timerTask,
      finishedAt,
      setMode: (m) => {
        endsAt.current = null;
        setRunning(false);
        setModeState(m);
        const ms = TIMER_MINUTES[m] * 60_000;
        setTotalMs(ms);
        setLeftMs(ms);
        setFinishedAt(null);
      },
      setTaskId: setTimerTask,
      start: () => {
        endsAt.current = Date.now() + leftMs;
        setFinishedAt(null);
        setRunning(true);
      },
      pause: () => {
        if (endsAt.current != null) setLeftMs(Math.max(0, endsAt.current - Date.now()));
        endsAt.current = null;
        setRunning(false);
      },
      reset: () => {
        endsAt.current = null;
        setRunning(false);
        setLeftMs(totalMs);
        setFinishedAt(null);
      },
    }),
    [mode, leftMs, totalMs, running, timerTask, finishedAt]
  );

  const api: TrackerApi = useMemo(
    () => ({
      ready,
      tasks,
      people,
      sessions,
      theme,
      today,
      sheet,
      openSheet,
      closeSheet,
      addTask,
      updateTask,
      setStatus,
      toggleDone,
      deleteTask,
      addPerson,
      removePerson,
      logSession,
      setTheme: setThemeState,
      loadSample,
      clearAll,
      personById,
    }),
    [ready, tasks, people, sessions, theme, today, sheet, openSheet, closeSheet, addTask, updateTask, setStatus, toggleDone, deleteTask, addPerson, removePerson, logSession, loadSample, clearAll, personById]
  );

  return (
    <TrackerContext.Provider value={api}>
      <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
    </TrackerContext.Provider>
  );
}

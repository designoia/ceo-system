'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckSquare, Columns3, GanttChartSquare, LayoutDashboard, LineChart, Moon, Plus, Settings2, Sun, Target, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackerProvider, useFocusTimer, useTracker } from '@/lib/tracker/store';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { DashboardView } from './DashboardView';
import { FocusView, fmtClock } from './FocusView';
import { InsightsView } from './InsightsView';
import { MatrixView } from './MatrixView';
import { SetupSheet } from './SetupSheet';
import { TaskSheet } from './TaskSheet';
import { TasksView } from './TasksView';
import { TimelineView } from './TimelineView';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'matrix', label: 'Matrix', icon: Target },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'insights', label: 'Insights', icon: LineChart },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];
const VIEW_KEY = 'tk-view';

function Shell() {
  const { ready, theme, setTheme, openSheet } = useTracker();
  const timer = useFocusTimer();
  const [view, setView] = useState<ViewId>('dashboard');
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY) as ViewId | null;
      if (saved && VIEWS.some((v) => v.id === saved)) setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const go = (v: string) => {
    setView(v as ViewId);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  };

  if (!ready) {
    return <div className="tk-root tk-light min-h-[60vh] rounded-2xl" aria-busy="true" />;
  }

  const showMiniTimer = timer.running && view !== 'focus';

  return (
    <div className={cn('tk-root relative rounded-2xl p-3 pb-24 sm:p-5', theme === 'dark' ? 'tk-dark' : 'tk-light')}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Task Tracker</h1>
          <p className="text-[11px] font-semibold tk-muted">Dashboard · calendar · board · matrix · timeline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSetupOpen(true)} aria-label="Setup" className="flex h-11 w-11 items-center justify-center rounded-full tk-soft">
            <Settings2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-11 w-11 items-center justify-center rounded-full tk-soft"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <nav aria-label="Tracker views" className="tk-scroll-x -mx-3 mb-4 flex gap-2 overflow-x-auto px-3 sm:-mx-5 sm:px-5">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => go(v.id)}
              aria-current={active ? 'page' : undefined}
              className={cn('flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-bold transition-colors', active ? 'tk-accent-bg shadow-md' : 'tk-card')}
            >
              <Icon className="h-4 w-4" />
              {v.label}
            </button>
          );
        })}
      </nav>

      <main>
        {view === 'dashboard' && <DashboardView onNavigate={go} />}
        {view === 'calendar' && <CalendarView />}
        {view === 'tasks' && <TasksView />}
        {view === 'board' && <BoardView />}
        {view === 'matrix' && <MatrixView />}
        {view === 'timeline' && <TimelineView />}
        {view === 'focus' && <FocusView />}
        {view === 'insights' && <InsightsView />}
      </main>

      {showMiniTimer && (
        <button onClick={() => go('focus')} className="tk-card fixed left-4 z-30 flex h-12 items-center gap-2 rounded-full px-4 text-sm font-extrabold tabular-nums shadow-xl bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6">
          <Timer className="h-4 w-4 tk-accent-text" />
          {fmtClock(timer.leftMs)}
        </button>
      )}

      <button
        onClick={() => openSheet(null)}
        aria-label="Add task"
        className="tk-accent-bg fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-xl bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
      </button>

      <div className={cn(theme === 'dark' ? 'tk-dark' : 'tk-light')}>
        <TaskSheet />
        <SetupSheet open={setupOpen} onClose={() => setSetupOpen(false)} />
      </div>
    </div>
  );
}

export function TrackerApp() {
  return (
    <TrackerProvider>
      <Shell />
    </TrackerProvider>
  );
}

'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Business,
  Goal,
  StrategicMonth,
  Project,
  Task,
  TaskLog,
  ScheduleBlock,
  DailyCheckin,
  WeeklyReview,
  MonthlyReview,
  UserSettings,
  TaskStatus,
  TaskPriority,
  BusinessCode,
} from './types';
import {
  INITIAL_BUSINESSES,
  INITIAL_GOALS,
  INITIAL_STRATEGIC_MONTHS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_SCHEDULE_BLOCKS,
  INITIAL_SETTINGS,
} from './seed-data';
import { getTodayDateString } from './utils';

const STORAGE_KEYS = {
  BUSINESSES: 'ceo_os_businesses_v1',
  GOALS: 'ceo_os_goals_v1',
  STRATEGIC_MONTHS: 'ceo_os_months_v1',
  PROJECTS: 'ceo_os_projects_v1',
  TASKS: 'ceo_os_tasks_v1',
  TASK_LOGS: 'ceo_os_task_logs_v1',
  SCHEDULE: 'ceo_os_schedule_v1',
  CHECKINS: 'ceo_os_checkins_v1',
  WEEKLY_REVIEWS: 'ceo_os_weekly_reviews_v1',
  MONTHLY_REVIEWS: 'ceo_os_monthly_reviews_v1',
  SETTINGS: 'ceo_os_settings_v1',
};

interface StoreContextType {
  businesses: Business[];
  goals: Goal[];
  months: StrategicMonth[];
  projects: Project[];
  tasks: Task[];
  taskLogs: TaskLog[];
  scheduleBlocks: ScheduleBlock[];
  dailyCheckins: DailyCheckin[];
  weeklyReviews: WeeklyReview[];
  monthlyReviews: MonthlyReview[];
  settings: UserSettings;
  activeFocusTask: Task | null;
  focusMode: 'NORMAL' | 'RESCUE_10MIN' | null;
  isQuickAddOpen: boolean;
  welcomeBackInfo: { isReturning: boolean; daysMissed: number; lastTask: Task | null } | null;
  yesterdayMissedTask: Task | null;

  // Actions
  setQuickAddOpen: (open: boolean) => void;
  startFocus: (task: Task, mode?: 'NORMAL' | 'RESCUE_10MIN') => void;
  stopFocus: () => void;
  completeTask: (taskId: string, durationMinutes?: number, notes?: string) => void;
  completeRescueAction: (taskId: string, notes?: string) => void;
  setMustWin: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => Goal;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  updateMonth: (monthId: string, updates: Partial<StrategicMonth>) => void;
  updateScheduleBlock: (blockId: string, updates: Partial<ScheduleBlock>) => void;
  addDailyCheckin: (checkin: Omit<DailyCheckin, 'id' | 'createdAt'>) => void;
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => void;
  addMonthlyReview: (review: Omit<MonthlyReview, 'id' | 'createdAt'>) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resolveYesterdayMissed: (action: 'CONTINUE_TODAY' | 'THIS_WEEK' | 'NEXT' | 'BACKLOG' | 'DROP') => void;
  dismissWelcomeBack: () => void;
  resetToDemoData: () => void;
  exportDataJSON: () => string;
  exportTasksCSV: () => string;
  importDataJSON: (jsonString: string) => boolean;

  // Computed state
  mustWinTask: Task | null;
  optionalTasks: Task[];
  activeProjects: Project[];
  currentMonth: StrategicMonth | null;
  meaningfulDaysThisWeek: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [months, setMonths] = useState<StrategicMonth[]>(INITIAL_STRATEGIC_MONTHS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>(INITIAL_SCHEDULE_BLOCKS);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [focusMode, setFocusMode] = useState<'NORMAL' | 'RESCUE_10MIN' | null>(null);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [welcomeBackInfo, setWelcomeBackInfo] = useState<{ isReturning: boolean; daysMissed: number; lastTask: Task | null } | null>(null);
  const [yesterdayMissedTask, setYesterdayMissedTask] = useState<Task | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedBusinesses = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
      if (storedBusinesses) setBusinesses(JSON.parse(storedBusinesses));

      const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (storedGoals) setGoals(JSON.parse(storedGoals));

      const storedMonths = localStorage.getItem(STORAGE_KEYS.STRATEGIC_MONTHS);
      if (storedMonths) setMonths(JSON.parse(storedMonths));

      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) setProjects(JSON.parse(storedProjects));

      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      let currentTasks = INITIAL_TASKS;
      if (storedTasks) {
        currentTasks = JSON.parse(storedTasks);
        setTasks(currentTasks);
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.TASK_LOGS);
      if (storedLogs) setTaskLogs(JSON.parse(storedLogs));

      const storedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (storedSchedule) setScheduleBlocks(JSON.parse(storedSchedule));

      const storedCheckins = localStorage.getItem(STORAGE_KEYS.CHECKINS);
      if (storedCheckins) setDailyCheckins(JSON.parse(storedCheckins));

      const storedWeekly = localStorage.getItem(STORAGE_KEYS.WEEKLY_REVIEWS);
      if (storedWeekly) setWeeklyReviews(JSON.parse(storedWeekly));

      const storedMonthly = localStorage.getItem(STORAGE_KEYS.MONTHLY_REVIEWS);
      if (storedMonthly) setMonthlyReviews(JSON.parse(storedMonthly));

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      let currentSettings = INITIAL_SETTINGS;
      if (storedSettings) {
        currentSettings = JSON.parse(storedSettings);
        setSettings(currentSettings);
      }

      // Check for Resume / No-Guilt Welcome Back
      const today = getTodayDateString();
      const lastActive = currentSettings.lastActiveDate || today;

      if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const currDate = new Date(today);
        const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays >= 1) {
          const lastTask = currentTasks.find((t: Task) => t.isMustWin && t.status !== 'DONE') ||
            currentTasks.find((t: Task) => t.id === currentSettings.lastMustWinId) ||
            currentTasks.find((t: Task) => t.status === 'TODAY') || null;

          if (diffDays > 1) {
            setWelcomeBackInfo({
              isReturning: true,
              daysMissed: diffDays,
              lastTask: lastTask || null,
            });
          }

          // Check for "Never Miss Twice" yesterday's uncompleted task
          if (lastTask && lastTask.status === 'TODAY') {
            setYesterdayMissedTask(lastTask);
          }
        }

        // Update lastActiveDate silently
        const updated = { ...currentSettings, lastActiveDate: today };
        setSettings(updated);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      }
    } catch {
      // Ignore parse errors and use initial
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(businesses));
  }, [businesses, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.STRATEGIC_MONTHS, JSON.stringify(months));
  }, [months, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TASK_LOGS, JSON.stringify(taskLogs));
  }, [taskLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(scheduleBlocks));
  }, [scheduleBlocks, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(dailyCheckins));
  }, [dailyCheckins, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WEEKLY_REVIEWS, JSON.stringify(weeklyReviews));
  }, [weeklyReviews, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MONTHLY_REVIEWS, JSON.stringify(monthlyReviews));
  }, [monthlyReviews, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings, isLoaded]);

  // Computed state
  const mustWinTask = useMemo(() => {
    // 1. Explicit must-win scheduled for today
    const explicit = tasks.find(t => t.isMustWin && t.status !== 'DONE');
    if (explicit) return explicit;

    // 2. Intelligent recommendation from TODAY tasks
    const todayP1 = tasks.find(t => t.status === 'TODAY' && t.priority === 'P1');
    if (todayP1) return todayP1;

    const anyToday = tasks.find(t => t.status === 'TODAY');
    if (anyToday) return anyToday;

    // 3. Fallback from THIS_WEEK
    const thisWeek = tasks.find(t => t.status === 'THIS_WEEK' && t.priority === 'P1');
    if (thisWeek) return thisWeek;

    return null;
  }, [tasks]);

  const optionalTasks = useMemo(() => {
    if (!mustWinTask) {
      return tasks.filter(t => t.status === 'TODAY').slice(0, 2);
    }
    return tasks
      .filter(t => t.status === 'TODAY' && t.id !== mustWinTask.id)
      .slice(0, 2);
  }, [tasks, mustWinTask]);

  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'ACTIVE');
  }, [projects]);

  const currentMonth = useMemo(() => {
    return months.find(m => m.isCurrent) || months[0] || null;
  }, [months]);

  const meaningfulDaysThisWeek = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // 1 = Mon, 7 = Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const datesWithLogs = new Set(
      taskLogs
        .filter(log => new Date(log.completedAt) >= startOfWeek)
        .map(log => log.completedAt.split('T')[0])
    );

    // Also include daily completed tasks
    tasks
      .filter(t => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= startOfWeek)
      .forEach(t => {
        if (t.completedAt) datesWithLogs.add(t.completedAt.split('T')[0]);
      });

    return Math.max(datesWithLogs.size, 4); // Default to at least 4 for warm momentum
  }, [taskLogs, tasks]);

  // Actions
  const startFocus = useCallback((task: Task, mode: 'NORMAL' | 'RESCUE_10MIN' = 'NORMAL') => {
    setActiveFocusTask(task);
    setFocusMode(mode);
  }, []);

  const stopFocus = useCallback(() => {
    setActiveFocusTask(null);
    setFocusMode(null);
  }, []);

  const completeTask = useCallback((taskId: string, durationMinutes = 45, notes?: string) => {
    const now = new Date().toISOString();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'DONE', completedAt: now, isMustWin: false }
          : t
      )
    );

    setTaskLogs(prev => [
      {
        id: `log-${Date.now()}`,
        taskId,
        taskTitle: task.title,
        businessCode: task.businessCode,
        durationMinutes,
        mode: 'NORMAL',
        notes,
        completedAt: now,
      },
      ...prev,
    ]);

    setActiveFocusTask(null);
    setFocusMode(null);
  }, [tasks]);

  const completeRescueAction = useCallback((taskId: string, notes?: string) => {
    const now = new Date().toISOString();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Logs meaningful progress without closing macro task if unfinished
    setTaskLogs(prev => [
      {
        id: `log-${Date.now()}`,
        taskId,
        taskTitle: `${task.title} (Rescue Action: ${task.rescueAction || '10m Action'})`,
        businessCode: task.businessCode,
        durationMinutes: 10,
        mode: 'RESCUE_10MIN',
        notes,
        completedAt: now,
      },
      ...prev,
    ]);

    setActiveFocusTask(null);
    setFocusMode(null);
  }, [tasks]);

  const setMustWin = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(t => ({
        ...t,
        isMustWin: t.id === taskId,
        status: t.id === taskId ? 'TODAY' : t.status,
      }))
    );
    setSettings(prev => ({ ...prev, lastMustWinId: taskId }));
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    const now = new Date().toISOString();
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === 'DONE' ? now : undefined,
              isMustWin: status === 'DONE' ? false : t.isMustWin,
            }
          : t
      )
    );
  }, []);

  const addTask = useCallback((taskData: Partial<Task> & { title: string }) => {
    const count = tasks.length + 1;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      code: `T-${count.toString().padStart(3, '0')}`,
      title: taskData.title.trim(),
      businessCode: taskData.businessCode || 'COL',
      projectId: taskData.projectId,
      status: taskData.status || 'INBOX',
      priority: taskData.priority || 'P2',
      isMustWin: taskData.isMustWin || false,
      estimatedMinutes: taskData.estimatedMinutes || 45,
      scheduledDate: taskData.scheduledDate,
      scheduledTime: taskData.scheduledTime,
      notes: taskData.notes,
      rescueAction: taskData.rescueAction || `Spend 10 minutes initiating ${taskData.title.trim()}`,
      createdAt: new Date().toISOString(),
    };

    if (newTask.isMustWin) {
      setTasks(prev => [
        newTask,
        ...prev.map(t => (t.isMustWin ? { ...t, isMustWin: false } : t)),
      ]);
    } else {
      setTasks(prev => [newTask, ...prev]);
    }

    return newTask;
  }, [tasks.length]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      })
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const count = projects.length + 1;
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      code: `P-${count.toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, [projects.length]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const addGoal = useCallback((goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, ...updates } : g))
    );
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  const updateMonth = useCallback((monthId: string, updates: Partial<StrategicMonth>) => {
    setMonths(prev =>
      prev.map(m => (m.id === monthId ? { ...m, ...updates } : m))
    );
  }, []);

  const updateScheduleBlock = useCallback((blockId: string, updates: Partial<ScheduleBlock>) => {
    setScheduleBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, ...updates } : b))
    );
  }, []);

  const addDailyCheckin = useCallback((checkin: Omit<DailyCheckin, 'id' | 'createdAt'>) => {
    const newCheckin: DailyCheckin = {
      ...checkin,
      id: `checkin-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDailyCheckins(prev => [newCheckin, ...prev]);
  }, []);

  const addWeeklyReview = useCallback((review: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
    const newReview: WeeklyReview = {
      ...review,
      id: `wreview-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWeeklyReviews(prev => [newReview, ...prev]);
  }, []);

  const addMonthlyReview = useCallback((review: Omit<MonthlyReview, 'id' | 'createdAt'>) => {
    const newReview: MonthlyReview = {
      ...review,
      id: `mreview-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMonthlyReviews(prev => [newReview, ...prev]);
  }, []);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resolveYesterdayMissed = useCallback((action: 'CONTINUE_TODAY' | 'THIS_WEEK' | 'NEXT' | 'BACKLOG' | 'DROP') => {
    if (!yesterdayMissedTask) return;
    const targetStatusMap: Record<string, TaskStatus | 'DELETED'> = {
      CONTINUE_TODAY: 'TODAY',
      THIS_WEEK: 'THIS_WEEK',
      NEXT: 'NEXT',
      BACKLOG: 'BACKLOG',
      DROP: 'DELETED',
    };

    const target = targetStatusMap[action];
    if (target === 'DELETED') {
      deleteTask(yesterdayMissedTask.id);
    } else {
      updateTask(yesterdayMissedTask.id, {
        status: target,
        isMustWin: action === 'CONTINUE_TODAY',
      });
    }
    setYesterdayMissedTask(null);
  }, [yesterdayMissedTask, deleteTask, updateTask]);

  const dismissWelcomeBack = useCallback(() => {
    setWelcomeBackInfo(null);
  }, []);

  const resetToDemoData = useCallback(() => {
    setBusinesses(INITIAL_BUSINESSES);
    setGoals(INITIAL_GOALS);
    setMonths(INITIAL_STRATEGIC_MONTHS);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setTaskLogs([]);
    setScheduleBlocks(INITIAL_SCHEDULE_BLOCKS);
    setDailyCheckins([]);
    setWeeklyReviews([]);
    setMonthlyReviews([]);
    setSettings(INITIAL_SETTINGS);
  }, []);

  const exportDataJSON = useCallback(() => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      businesses,
      goals,
      months,
      projects,
      tasks,
      taskLogs,
      scheduleBlocks,
      dailyCheckins,
      weeklyReviews,
      monthlyReviews,
      settings,
    };
    return JSON.stringify(fullBackup, null, 2);
  }, [businesses, goals, months, projects, tasks, taskLogs, scheduleBlocks, dailyCheckins, weeklyReviews, monthlyReviews, settings]);

  const exportTasksCSV = useCallback(() => {
    const headers = ['Task ID', 'Title', 'Business', 'Project', 'Priority', 'Status', 'Is Must-Win', 'Est Min', 'Created At', 'Notes'];
    const rows = tasks.map(t => {
      const proj = projects.find(p => p.id === t.projectId)?.name || '';
      return [
        t.code || '',
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.businessCode,
        `"${proj.replace(/"/g, '""')}"`,
        t.priority,
        t.status,
        t.isMustWin ? 'YES' : 'NO',
        t.estimatedMinutes,
        t.createdAt,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tasks, projects]);

  const importDataJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) setTasks(data.tasks);
      if (data.projects) setProjects(data.projects);
      if (data.goals) setGoals(data.goals);
      if (data.months) setMonths(data.months);
      if (data.businesses) setBusinesses(data.businesses);
      if (data.scheduleBlocks) setScheduleBlocks(data.scheduleBlocks);
      if (data.settings) setSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = {
    businesses,
    goals,
    months,
    projects,
    tasks,
    taskLogs,
    scheduleBlocks,
    dailyCheckins,
    weeklyReviews,
    monthlyReviews,
    settings,
    activeFocusTask,
    focusMode,
    isQuickAddOpen,
    welcomeBackInfo,
    yesterdayMissedTask,
    setQuickAddOpen,
    startFocus,
    stopFocus,
    completeTask,
    completeRescueAction,
    setMustWin,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    addGoal,
    updateGoal,
    deleteGoal,
    updateMonth,
    updateScheduleBlock,
    addDailyCheckin,
    addWeeklyReview,
    addMonthlyReview,
    updateSettings,
    resolveYesterdayMissed,
    dismissWelcomeBack,
    resetToDemoData,
    exportDataJSON,
    exportTasksCSV,
    importDataJSON,
    mustWinTask,
    optionalTasks,
    activeProjects,
    currentMonth,
    meaningfulDaysThisWeek,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

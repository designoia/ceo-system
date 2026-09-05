'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Business,
  Goal,
  StrategicMonth,
  Project,
  Task,
  TaskLog,
  ActivityLog,
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
  INITIAL_ACTIVITY_LOGS,
} from './seed-data';
import { getTodayDateString, calculateDaysOverdue } from './utils';

const STORAGE_KEYS = {
  BUSINESSES: 'ceo_os_businesses_v2',
  GOALS: 'ceo_os_goals_v2',
  STRATEGIC_MONTHS: 'ceo_os_months_v2',
  PROJECTS: 'ceo_os_projects_v2',
  TASKS: 'ceo_os_tasks_v2',
  TASK_LOGS: 'ceo_os_task_logs_v2',
  ACTIVITY_LOGS: 'ceo_os_activity_logs_v2',
  SCHEDULE: 'ceo_os_schedule_v2',
  CHECKINS: 'ceo_os_checkins_v2',
  WEEKLY_REVIEWS: 'ceo_os_weekly_reviews_v2',
  MONTHLY_REVIEWS: 'ceo_os_monthly_reviews_v2',
  SETTINGS: 'ceo_os_settings_v2',
};

interface StoreContextType {
  businesses: Business[];
  goals: Goal[];
  months: StrategicMonth[];
  projects: Project[];
  tasks: Task[];
  taskLogs: TaskLog[];
  activityLogs: ActivityLog[];
  scheduleBlocks: ScheduleBlock[];
  dailyCheckins: DailyCheckin[];
  weeklyReviews: WeeklyReview[];
  monthlyReviews: MonthlyReview[];
  settings: UserSettings;
  activeFocusTask: Task | null;
  focusMode: 'NORMAL' | 'RESCUE_10MIN' | null;
  isQuickAddOpen: boolean;
  isOverdueReviewOpen: boolean;
  welcomeBackInfo: { isReturning: boolean; daysMissed: number; lastTask: Task | null } | null;
  mustWinCarryForwardTask: Task | null;

  // Actions
  setQuickAddOpen: (open: boolean) => void;
  setOverdueReviewOpen: (open: boolean) => void;
  startFocus: (task: Task, mode?: 'NORMAL' | 'RESCUE_10MIN') => void;
  stopFocus: () => void;
  completeTask: (taskId: string, durationMinutes?: number, notes?: string) => void;
  completeRescueAction: (taskId: string, notes?: string) => void;
  setMustWin: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addSubtask: (parentTaskId: string, title: string) => Task;
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
  resolveOverdueTask: (taskId: string, targetStatus: TaskStatus | 'DELETED') => void;
  resolveMustWinCarryForward: (makeTodayMustWin: boolean) => void;
  dismissWelcomeBack: () => void;
  logActivity: (entityType: 'TASK' | 'PROJECT' | 'SYSTEM', entityId: string, title: string, action: ActivityLog['action'], details?: string) => void;
  resetToDemoData: () => void;
  exportDataJSON: () => string;
  exportTasksCSV: () => string;
  importDataJSON: (jsonString: string) => boolean;

  // Hierarchy & Rollup Helpers
  getProjectProgress: (projectId: string) => number;
  getProjectSubprojects: (projectId: string) => Project[];
  getTopLevelProjects: () => Project[];
  getSubtasks: (parentTaskId: string) => Task[];
  getSubtaskProgress: (parentTaskId: string) => { total: number; done: number; percent: number };

  // Computed state
  mustWinTask: Task | null;
  optionalTasks: Task[];
  overdueTasks: Task[];
  todayTasks: Task[];
  activeProjects: Project[];
  activeTopLevelProjectsCount: number;
  activeSubprojectsCount: number;
  currentMonth: StrategicMonth | null;
  meaningfulDaysThisWeek: number;
  todayPlannedMinutes: number;
  todayTaskCount: number;
  isCapacityOverloaded: boolean;
  isTaskCountOverloaded: boolean;
  isTaskCountSeverelyOverloaded: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [months, setMonths] = useState<StrategicMonth[]>(INITIAL_STRATEGIC_MONTHS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>(INITIAL_SCHEDULE_BLOCKS);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [focusMode, setFocusMode] = useState<'NORMAL' | 'RESCUE_10MIN' | null>(null);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [isOverdueReviewOpen, setOverdueReviewOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [welcomeBackInfo, setWelcomeBackInfo] = useState<{ isReturning: boolean; daysMissed: number; lastTask: Task | null } | null>(null);
  const [mustWinCarryForwardTask, setMustWinCarryForwardTask] = useState<Task | null>(null);

  const logActivity = useCallback((
    entityType: 'TASK' | 'PROJECT' | 'SYSTEM',
    entityId: string,
    title: string,
    action: ActivityLog['action'],
    details?: string
  ) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      entityType,
      entityId,
      title,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, []);

  // Load and execute timezone-aware daily rollover
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
      let loadedTasks = INITIAL_TASKS;
      if (storedTasks) {
        loadedTasks = JSON.parse(storedTasks);
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.TASK_LOGS);
      if (storedLogs) setTaskLogs(JSON.parse(storedLogs));

      const storedActLogs = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (storedActLogs) setActivityLogs(JSON.parse(storedActLogs));

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

      // TIMEZONE-AWARE ROLLOVER LOGIC
      const localTodayStr = getTodayDateString(currentSettings.timezone || 'Asia/Kolkata');
      const lastActive = currentSettings.lastActiveDate || localTodayStr;

      let rolledTasks = [...loadedTasks];
      let hasRolledOver = false;

      // Identify uncompleted TODAY tasks whose scheduledDate is prior to localTodayStr
      rolledTasks = rolledTasks.map((t) => {
        if (t.status === 'TODAY' && t.scheduledDate && t.scheduledDate < localTodayStr) {
          hasRolledOver = true;
          return {
            ...t,
            status: 'OVERDUE',
            overdueAt: new Date().toISOString(),
            lastStatusChangeAt: new Date().toISOString(),
          };
        }
        return t;
      });

      if (hasRolledOver) {
        setTasks(rolledTasks);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(rolledTasks));
      } else {
        setTasks(loadedTasks);
      }

      // Check for Must-Win Carry-Forward & Welcome Back
      if (lastActive !== localTodayStr) {
        const lastDate = new Date(lastActive);
        const currDate = new Date(localTodayStr);
        const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        const prevMustWin = loadedTasks.find(t => t.id === currentSettings.lastMustWinId && t.status !== 'DONE') ||
                            loadedTasks.find(t => t.isMustWin && t.status !== 'DONE');

        if (prevMustWin) {
          setMustWinCarryForwardTask(prevMustWin);
        }

        if (diffDays >= 2) {
          const nextAction = prevMustWin || loadedTasks.find(t => t.status === 'TODAY' || t.status === 'OVERDUE') || null;
          setWelcomeBackInfo({
            isReturning: true,
            daysMissed: diffDays,
            lastTask: nextAction,
          });
        }

        const updatedSettings = { ...currentSettings, lastActiveDate: localTodayStr };
        setSettings(updatedSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      }
    } catch {
      // Storage fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync state to localStorage
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
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs, isLoaded]);

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

  // Project Hierarchy & Aggregated Progress Rollup
  const getProjectSubprojects = useCallback((projectId: string): Project[] => {
    return projects.filter(p => p.parentProjectId === projectId && p.status !== 'ARCHIVED');
  }, [projects]);

  const getTopLevelProjects = useCallback((): Project[] => {
    return projects.filter(p => !p.parentProjectId && p.status !== 'ARCHIVED');
  }, [projects]);

  const getProjectProgress = useCallback((projectId: string): number => {
    const subprojects = projects.filter(p => p.parentProjectId === projectId);
    const directTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);

    if (subprojects.length === 0) {
      if (directTasks.length === 0) return 0;
      const doneCount = directTasks.filter(t => t.status === 'DONE').length;
      return Math.round((doneCount / directTasks.length) * 100);
    }

    // Weighted rollup: Average subproject progress + direct tasks
    let totalScore = 0;
    let componentsCount = subprojects.length;

    subprojects.forEach(sub => {
      const subTasks = tasks.filter(t => t.projectId === sub.id && !t.parentTaskId);
      if (subTasks.length > 0) {
        const done = subTasks.filter(t => t.status === 'DONE').length;
        totalScore += (done / subTasks.length) * 100;
      } else {
        totalScore += sub.status === 'COMPLETED' ? 100 : 0;
      }
    });

    if (directTasks.length > 0) {
      componentsCount += 1;
      const directDone = directTasks.filter(t => t.status === 'DONE').length;
      totalScore += (directDone / directTasks.length) * 100;
    }

    return Math.round(totalScore / componentsCount);
  }, [projects, tasks]);

  // Subtask Helpers
  const getSubtasks = useCallback((parentTaskId: string): Task[] => {
    return tasks.filter(t => t.parentTaskId === parentTaskId);
  }, [tasks]);

  const getSubtaskProgress = useCallback((parentTaskId: string) => {
    const childs = tasks.filter(t => t.parentTaskId === parentTaskId);
    if (childs.length === 0) return { total: 0, done: 0, percent: 0 };
    const done = childs.filter(t => t.status === 'DONE').length;
    return {
      total: childs.length,
      done,
      percent: Math.round((done / childs.length) * 100),
    };
  }, [tasks]);

  // Computed state
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'TODAY' && !t.parentTaskId);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'OVERDUE' && !t.parentTaskId);
  }, [tasks]);

  const mustWinTask = useMemo(() => {
    // 1. Explicit must-win
    const explicit = tasks.find(t => t.isMustWin && t.status !== 'DONE');
    if (explicit) return explicit;

    // 2. Overdue P1 Must-Win Candidate
    const overdueP1 = tasks.find(t => t.status === 'OVERDUE' && t.priority === 'P1' && !t.parentTaskId);
    if (overdueP1) return overdueP1;

    // 3. Today P1
    const todayP1 = tasks.find(t => t.status === 'TODAY' && t.priority === 'P1' && !t.parentTaskId);
    if (todayP1) return todayP1;

    // 4. Any today task
    const anyToday = tasks.find(t => t.status === 'TODAY' && !t.parentTaskId);
    if (anyToday) return anyToday;

    // 5. This week fallback
    const thisWeekP1 = tasks.find(t => t.status === 'THIS_WEEK' && t.priority === 'P1' && !t.parentTaskId);
    if (thisWeekP1) return thisWeekP1;

    return null;
  }, [tasks]);

  const optionalTasks = useMemo(() => {
    if (!mustWinTask) {
      return tasks.filter(t => t.status === 'TODAY' && !t.parentTaskId).slice(0, 2);
    }
    return tasks
      .filter(t => t.status === 'TODAY' && t.id !== mustWinTask.id && !t.parentTaskId)
      .slice(0, 2);
  }, [tasks, mustWinTask]);

  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'ACTIVE');
  }, [projects]);

  const activeTopLevelProjectsCount = useMemo(() => {
    return projects.filter(p => !p.parentProjectId && p.status === 'ACTIVE').length;
  }, [projects]);

  const activeSubprojectsCount = useMemo(() => {
    return projects.filter(p => p.parentProjectId && p.status === 'ACTIVE').length;
  }, [projects]);

  const currentMonth = useMemo(() => {
    return months.find(m => m.isCurrent) || months[0] || null;
  }, [months]);

  const meaningfulDaysThisWeek = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const datesWithLogs = new Set(
      taskLogs
        .filter(log => new Date(log.completedAt) >= startOfWeek)
        .map(log => log.completedAt.split('T')[0])
    );

    tasks
      .filter(t => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= startOfWeek)
      .forEach(t => {
        if (t.completedAt) datesWithLogs.add(t.completedAt.split('T')[0]);
      });

    return Math.max(datesWithLogs.size, 4);
  }, [taskLogs, tasks]);

  // Capacity calculations
  const todayPlannedMinutes = useMemo(() => {
    return todayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 45), 0);
  }, [todayTasks]);

  const todayTaskCount = todayTasks.length;
  const isCapacityOverloaded = todayPlannedMinutes > (settings.dailyWorkCapacityMinutes || 45);
  const isTaskCountOverloaded = todayTaskCount > 5;
  const isTaskCountSeverelyOverloaded = todayTaskCount > 8;

  // Actions
  const startFocus = useCallback((task: Task, mode: 'NORMAL' | 'RESCUE_10MIN' = 'NORMAL') => {
    setActiveFocusTask(task);
    setFocusMode(mode);
    logActivity('TASK', task.id, task.title, 'STARTED', `${mode === 'RESCUE_10MIN' ? '10-Minute Rescue' : 'Focus session'} started`);
  }, [logActivity]);

  const stopFocus = useCallback(() => {
    setActiveFocusTask(null);
    setFocusMode(null);
  }, []);

  const completeTask = useCallback((taskId: string, durationMinutes = 45, notes?: string) => {
    const now = new Date().toISOString();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Mark task done and complete child subtasks if any
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: 'DONE', completedAt: now, isMustWin: false };
        }
        if (t.parentTaskId === taskId) {
          return { ...t, status: 'DONE', completedAt: now };
        }
        return t;
      })
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

    logActivity('TASK', taskId, task.title, 'COMPLETED', `Finished in ~${durationMinutes}m`);

    setActiveFocusTask(null);
    setFocusMode(null);
  }, [tasks, logActivity]);

  const completeRescueAction = useCallback((taskId: string, notes?: string) => {
    const now = new Date().toISOString();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

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

    logActivity('TASK', taskId, task.title, 'COMPLETED', 'Completed 10-minute rescue micro-action');

    setActiveFocusTask(null);
    setFocusMode(null);
  }, [tasks, logActivity]);

  const setMustWin = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev =>
      prev.map(t => ({
        ...t,
        isMustWin: t.id === taskId,
        status: t.id === taskId ? 'TODAY' : t.status,
      }))
    );
    setSettings(prev => ({ ...prev, lastMustWinId: taskId }));
    if (task) {
      logActivity('TASK', taskId, task.title, 'MUST_WIN_SET', 'Designated as Today\'s Primary Must-Win');
    }
  }, [tasks, logActivity]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    const now = new Date().toISOString();
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt: status === 'DONE' ? now : undefined,
              isMustWin: status === 'DONE' ? false : t.isMustWin,
              lastStatusChangeAt: now,
            }
          : t
      )
    );
    if (task) {
      logActivity('TASK', taskId, task.title, 'STATUS_CHANGED', `Moved: ${task.status} → ${status}`);
    }
  }, [tasks, logActivity]);

  const addTask = useCallback((taskData: Partial<Task> & { title: string }) => {
    const count = tasks.length + 1;
    const localToday = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: `T-${count.toString().padStart(3, '0')}`,
      title: taskData.title.trim(),
      businessCode: taskData.businessCode || 'COL',
      projectId: taskData.projectId,
      parentTaskId: taskData.parentTaskId,
      status: taskData.status || 'INBOX',
      priority: taskData.priority || 'P2',
      isMustWin: taskData.isMustWin || false,
      estimatedMinutes: taskData.estimatedMinutes || 45,
      scheduledDate: taskData.status === 'TODAY' ? (taskData.scheduledDate || localToday) : taskData.scheduledDate,
      scheduledTime: taskData.scheduledTime,
      dueDate: taskData.dueDate,
      notes: taskData.notes,
      rescueAction: taskData.rescueAction || `Spend 10 minutes initiating ${taskData.title.trim()}`,
      createdAt: new Date().toISOString(),
      lastStatusChangeAt: new Date().toISOString(),
    };

    if (newTask.isMustWin) {
      setTasks(prev => [
        newTask,
        ...prev.map(t => (t.isMustWin ? { ...t, isMustWin: false } : t)),
      ]);
    } else {
      setTasks(prev => [newTask, ...prev]);
    }

    logActivity('TASK', newTask.id, newTask.title, 'STATUS_CHANGED', `Created task in ${newTask.status}`);
    return newTask;
  }, [tasks.length, settings.timezone, logActivity]);

  const addSubtask = useCallback((parentTaskId: string, title: string) => {
    const parent = tasks.find(t => t.id === parentTaskId);
    if (!parent) throw new Error('Parent task not found');

    const newSubtask: Task = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      parentTaskId,
      title: title.trim(),
      businessCode: parent.businessCode,
      projectId: parent.projectId,
      status: 'TODAY',
      priority: parent.priority,
      estimatedMinutes: 15,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, newSubtask]);
    return newSubtask;
  }, [tasks]);

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
    setTasks(prev => prev.filter(t => t.id !== taskId && t.parentTaskId !== taskId));
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const count = projects.length + 1;
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: projectData.parentProjectId ? `P-${count}-S` : `P-${count.toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    logActivity('PROJECT', newProject.id, newProject.name, 'STATUS_CHANGED', `Created project (${newProject.status})`);
    return newProject;
  }, [projects.length, logActivity]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId && p.parentProjectId !== projectId));
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

  const resolveOverdueTask = useCallback((taskId: string, targetStatus: TaskStatus | 'DELETED') => {
    const localToday = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    if (targetStatus === 'DELETED') {
      deleteTask(taskId);
      return;
    }

    updateTask(taskId, {
      status: targetStatus,
      scheduledDate: targetStatus === 'TODAY' ? localToday : undefined,
      isMustWin: targetStatus === 'TODAY' ? false : undefined,
    });
    logActivity('TASK', taskId, 'Overdue Task', 'STATUS_CHANGED', `Triaged overdue task to ${targetStatus}`);
  }, [settings.timezone, deleteTask, updateTask, logActivity]);

  const resolveMustWinCarryForward = useCallback((makeTodayMustWin: boolean) => {
    if (!mustWinCarryForwardTask) return;
    const localToday = getTodayDateString(settings.timezone || 'Asia/Kolkata');

    if (makeTodayMustWin) {
      updateTask(mustWinCarryForwardTask.id, {
        status: 'TODAY',
        isMustWin: true,
        scheduledDate: localToday,
      });
      setMustWin(mustWinCarryForwardTask.id);
    } else {
      updateTask(mustWinCarryForwardTask.id, {
        isMustWin: false,
      });
    }
    setMustWinCarryForwardTask(null);
  }, [mustWinCarryForwardTask, settings.timezone, updateTask, setMustWin]);

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
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setScheduleBlocks(INITIAL_SCHEDULE_BLOCKS);
    setDailyCheckins([]);
    setWeeklyReviews([]);
    setMonthlyReviews([]);
    setSettings(INITIAL_SETTINGS);
  }, []);

  const exportDataJSON = useCallback(() => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      businesses,
      goals,
      months,
      projects,
      tasks,
      taskLogs,
      activityLogs,
      scheduleBlocks,
      dailyCheckins,
      weeklyReviews,
      monthlyReviews,
      settings,
    };
    return JSON.stringify(fullBackup, null, 2);
  }, [businesses, goals, months, projects, tasks, taskLogs, activityLogs, scheduleBlocks, dailyCheckins, weeklyReviews, monthlyReviews, settings]);

  const exportTasksCSV = useCallback(() => {
    const headers = ['Task ID', 'Title', 'Business', 'Project', 'Parent Task', 'Priority', 'Status', 'Is Must-Win', 'Est Min', 'Created At', 'Notes'];
    const rows = tasks.map(t => {
      const proj = projects.find(p => p.id === t.projectId)?.name || '';
      const parentTitle = tasks.find(p => p.id === t.parentTaskId)?.title || '';
      return [
        t.code || '',
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.businessCode,
        `"${proj.replace(/"/g, '""')}"`,
        `"${parentTitle.replace(/"/g, '""')}"`,
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
      if (data.activityLogs) setActivityLogs(data.activityLogs);
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
    activityLogs,
    scheduleBlocks,
    dailyCheckins,
    weeklyReviews,
    monthlyReviews,
    settings,
    activeFocusTask,
    focusMode,
    isQuickAddOpen,
    isOverdueReviewOpen,
    welcomeBackInfo,
    mustWinCarryForwardTask,
    setQuickAddOpen,
    setOverdueReviewOpen,
    startFocus,
    stopFocus,
    completeTask,
    completeRescueAction,
    setMustWin,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
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
    resolveOverdueTask,
    resolveMustWinCarryForward,
    dismissWelcomeBack,
    logActivity,
    resetToDemoData,
    exportDataJSON,
    exportTasksCSV,
    importDataJSON,
    getProjectProgress,
    getProjectSubprojects,
    getTopLevelProjects,
    getSubtasks,
    getSubtaskProgress,
    mustWinTask,
    optionalTasks,
    overdueTasks,
    todayTasks,
    activeProjects,
    activeTopLevelProjectsCount,
    activeSubprojectsCount,
    currentMonth,
    meaningfulDaysThisWeek,
    todayPlannedMinutes,
    todayTaskCount,
    isCapacityOverloaded,
    isTaskCountOverloaded,
    isTaskCountSeverelyOverloaded,
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

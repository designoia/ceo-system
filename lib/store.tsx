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
  CapacitySource,
  DailyCapacityRecord,
  ScheduleOverride,
  DailyPlan,
  RecommendationResult,
  MomentumStats,
  ScheduleEntry,
  ScheduleDayReview,
  ScheduleActivityType,
  ScheduleDifferenceReason,
  ScheduleAnalytics,
  GoogleConnection,
  GoogleTaskListMapping,
  GoogleTaskMapping,
  GoogleCalendarMapping,
  GoogleSyncLog,
  SyncConflict,
  ConflictResolutionStrategy,
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
  INITIAL_SCHEDULE_ENTRIES,
  INITIAL_SCHEDULE_DAY_REVIEWS,
  INITIAL_GOOGLE_CONNECTION,
  INITIAL_TASK_LIST_MAPPINGS,
  INITIAL_GOOGLE_TASK_MAPPINGS,
  INITIAL_GOOGLE_CALENDAR_MAPPINGS,
  INITIAL_GOOGLE_SYNC_LOGS,
} from './seed-data';
import { 
  getTodayDateString, 
  calculateDaysOverdue, 
  calculateMinutesBetween, 
  getCurrentTimeString, 
  formatTime12Hour, 
  parseTimeToMinutes 
} from './utils';
import { generateDailyRecommendation } from './recommendation-engine';
import { calculateMomentum } from './momentum-engine';
import { GoogleBidirectionalSyncEngine } from './integrations/google/sync';
import { buildCalendarEventDescription, resolveBusinessAndProjectFromList } from './integrations/google/mappings';

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
  DAILY_CAPACITY: 'ceo_os_daily_capacity_v3',
  SCHEDULE_OVERRIDES: 'ceo_os_schedule_overrides_v3',
  DAILY_PLANS: 'ceo_os_daily_plans_v3',
  SCHEDULE_ENTRIES: 'ceo_os_schedule_entries_v5',
  SCHEDULE_REVIEWS: 'ceo_os_schedule_reviews_v5',
  GOOGLE_CONNECTION: 'ceo_os_google_conn_v2',
  GOOGLE_TASK_LIST_MAPPINGS: 'ceo_os_google_lists_v2',
  GOOGLE_TASK_MAPPINGS: 'ceo_os_google_tmap_v2',
  GOOGLE_CALENDAR_MAPPINGS: 'ceo_os_google_cmap_v2',
  GOOGLE_SYNC_LOGS: 'ceo_os_google_logs_v2',
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

  // Phase 3 Capacity & Planning State
  todayCapacityMinutes: number;
  capacitySource: CapacitySource;
  scheduleOverrides: ScheduleOverride[];
  dailyPlans: DailyPlan[];
  energyLevel: 'LOW' | 'NORMAL' | 'HIGH';
  isTodayDifferentModalOpen: boolean;
  isMorningPlanOpen: boolean;
  isTimeAdjustModalOpen: boolean;
  timeAdjustMode: 'MORE' | 'LESS';
  dailyRecommendation: RecommendationResult;

  // Phase 4 Task Restoration & Real Momentum State
  momentumStats: MomentumStats;
  isRestoreModalOpen: boolean;
  taskToRestore: Task | null;
  isTrashModalOpen: boolean;
  deletedTasks: Task[];
  isCelebrationOpen: boolean;
  celebrationMilestone: number | null;

  // Phase 5 Daily Scheduler & Planned vs Actual State
  scheduleEntries: ScheduleEntry[];
  scheduleDayReviews: ScheduleDayReview[];
  selectedScheduleDate: string;
  isPlanTomorrowOpen: boolean;
  isScheduleReviewOpen: boolean;
  isAddBlockModalOpen: boolean;
  editingScheduleEntry: ScheduleEntry | null;
  scheduleFilterActivity: ScheduleActivityType | 'ALL';
  scheduleViewMode: 'ALL' | 'PLANNED_ONLY' | 'ACTUAL_ONLY';

  // Phase 5 Daily Scheduler Actions
  setSelectedScheduleDate: (date: string) => void;
  setPlanTomorrowOpen: (open: boolean) => void;
  setScheduleReviewOpen: (open: boolean) => void;
  setAddBlockModalOpen: (open: boolean, entry?: ScheduleEntry | null) => void;
  setScheduleFilterActivity: (activity: ScheduleActivityType | 'ALL') => void;
  setScheduleViewMode: (mode: 'ALL' | 'PLANNED_ONLY' | 'ACTUAL_ONLY') => void;
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id' | 'createdAt'>) => ScheduleEntry;
  updateScheduleEntry: (id: string, updates: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
  startScheduleBlock: (id: string) => void;
  stopScheduleBlock: (id: string, actualDurationMinutes?: number, markTaskDone?: boolean) => void;
  rescheduleBlock: (id: string, targetDate: string, newStartTime?: string, newEndTime?: string) => void;
  generateDayScheduleFromBaseline: (date: string, force?: boolean) => void;
  saveTomorrowPlan: (planEntries: Omit<ScheduleEntry, 'id' | 'createdAt'>[]) => void;
  saveScheduleDayReview: (review: Omit<ScheduleDayReview, 'id' | 'createdAt'>) => void;

  // Phase 4 Actions
  undoTaskCompletion: (taskId: string) => void;
  restoreTask: (taskId: string, targetStatus?: TaskStatus) => void;
  softDeleteTask: (taskId: string) => void;
  restoreFromTrash: (taskId: string) => void;
  permanentlyDeleteTask: (taskId: string) => void;
  setRestoreModalOpen: (open: boolean) => void;
  setTaskToRestore: (task: Task | null) => void;
  setTrashModalOpen: (open: boolean) => void;
  setCelebrationOpen: (open: boolean) => void;
  setCelebrationMilestone: (days: number | null) => void;

  // Phase 3 Capacity & Planning Actions
  setDailyCapacity: (minutes: number, source: CapacitySource, notes?: string) => void;
  setScheduleOverride: (blockType: ScheduleOverride['blockType'], isOff: boolean, deltaMinutes: number, name?: string) => void;
  addExtraTime: (deltaMinutes: number) => void;
  reduceAvailableTime: (targetMinutes: number) => void;
  setLowEnergyMode: () => void;
  acceptDailyPlan: () => void;
  setTodayDifferentModalOpen: (open: boolean) => void;
  setMorningPlanOpen: (open: boolean) => void;
  setTimeAdjustModalOpen: (open: boolean, mode?: 'MORE' | 'LESS') => void;

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
  logActivity: (entityType: 'TASK' | 'PROJECT' | 'SYSTEM' | 'CAPACITY' | 'SCHEDULE' | 'MOMENTUM' | 'INTEGRATION', entityId: string, title: string, action: ActivityLog['action'], details?: string) => void;
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

  // Phase 5 Daily Scheduler Computed
  currentDayScheduleEntries: ScheduleEntry[];
  currentScheduleBlock: ScheduleEntry | null;
  nextScheduleBlock: ScheduleEntry | null;
  scheduleDayStats: {
    plannedMinutes: number;
    actualMinutes: number;
    varianceMinutes: number;
    accuracyPercent: number;
    completedCount: number;
    missedCount: number;
    totalCount: number;
    mustWinCompleted: boolean;
  };
  scheduleWeeklyAnalytics: ScheduleAnalytics;
  // Google Integration State
  googleConnection: GoogleConnection | null;
  taskListMappings: GoogleTaskListMapping[];
  googleTaskMappings: GoogleTaskMapping[];
  googleCalendarMappings: GoogleCalendarMapping[];
  googleSyncLogs: GoogleSyncLog[];
  isSyncingGoogle: boolean;
  syncConflicts: SyncConflict[];
  taskToSchedule: Task | null;
  isScheduleTaskModalOpen: boolean;
  conflictModalOpen: boolean;
  conflictToResolve: SyncConflict | null;
  isSyncLogViewerOpen: boolean;

  // Google Integration Actions
  connectGoogle: (email?: string) => void;
  disconnectGoogle: () => void;
  syncGoogleNow: (origin?: 'CEO_OS' | 'GOOGLE_TASKS' | 'GOOGLE_CALENDAR') => Promise<any>;
  openScheduleModal: (task: Task) => void;
  closeScheduleModal: () => void;
  scheduleTaskOnCalendar: (
    taskId: string,
    date: string,
    startTime: string,
    endTime: string,
    syncToCalendar?: boolean
  ) => void;
  unscheduleTask: (taskId: string) => void;
  updateTaskListMapping: (mapping: GoogleTaskListMapping) => void;
  resolveSyncConflict: (conflictId: string, strategy: ConflictResolutionStrategy) => void;
  setConflictModalOpen: (open: boolean, conflict?: SyncConflict | null) => void;
  setSyncLogViewerOpen: (open: boolean) => void;
  simulateExternalGoogleTask: (title: string, listTitle?: string) => void;
  simulateExternalCalendarEvent: (title: string, date: string, startTime: string, endTime: string) => void;
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

  // Google Integration State
  const [googleConnection, setGoogleConnection] = useState<GoogleConnection | null>(() => {
    if (typeof window === 'undefined') return INITIAL_GOOGLE_CONNECTION;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_CONNECTION);
      return stored ? JSON.parse(stored) : INITIAL_GOOGLE_CONNECTION;
    } catch {
      return INITIAL_GOOGLE_CONNECTION;
    }
  });
  const [taskListMappings, setTaskListMappings] = useState<GoogleTaskListMapping[]>(INITIAL_TASK_LIST_MAPPINGS);
  const [googleTaskMappings, setGoogleTaskMappings] = useState<GoogleTaskMapping[]>(INITIAL_GOOGLE_TASK_MAPPINGS);
  const [googleCalendarMappings, setGoogleCalendarMappings] = useState<GoogleCalendarMapping[]>(INITIAL_GOOGLE_CALENDAR_MAPPINGS);
  const [googleSyncLogs, setGoogleSyncLogs] = useState<GoogleSyncLog[]>(INITIAL_GOOGLE_SYNC_LOGS);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [taskToSchedule, setTaskToSchedule] = useState<Task | null>(null);
  const [isScheduleTaskModalOpen, setIsScheduleTaskModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpenState] = useState(false);
  const [conflictToResolve, setConflictToResolve] = useState<SyncConflict | null>(null);
  const [isSyncLogViewerOpen, setIsSyncLogViewerOpen] = useState(false);

  // Phase 5 Daily Scheduler State
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(INITIAL_SCHEDULE_ENTRIES);
  const [scheduleDayReviews, setScheduleDayReviews] = useState<ScheduleDayReview[]>(INITIAL_SCHEDULE_DAY_REVIEWS);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('2026-09-07');
  const [isPlanTomorrowOpen, setPlanTomorrowOpen] = useState(false);
  const [isScheduleReviewOpen, setScheduleReviewOpen] = useState(false);
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [editingScheduleEntry, setEditingScheduleEntry] = useState<ScheduleEntry | null>(null);
  const [scheduleFilterActivity, setScheduleFilterActivity] = useState<ScheduleActivityType | 'ALL'>('ALL');
  const [scheduleViewMode, setScheduleViewMode] = useState<'ALL' | 'PLANNED_ONLY' | 'ACTUAL_ONLY'>('ALL');

  // Phase 3 State
  const [todayCapacityMinutes, setTodayCapacityMinutes] = useState<number>(45);
  const [capacitySource, setCapacitySource] = useState<CapacitySource>('DEFAULT');
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [energyLevel, setEnergyLevel] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [isTodayDifferentModalOpen, setTodayDifferentModalOpen] = useState(false);
  const [isMorningPlanOpen, setMorningPlanOpen] = useState(false);
  const [isTimeAdjustModalOpen, setIsTimeAdjustModalOpen] = useState(false);
  const [timeAdjustMode, setTimeAdjustMode] = useState<'MORE' | 'LESS'>('MORE');

  // Phase 4 Task Restoration & Real Momentum State
  const [isRestoreModalOpen, setRestoreModalOpen] = useState(false);
  const [taskToRestore, setTaskToRestore] = useState<Task | null>(null);
  const [isTrashModalOpen, setTrashModalOpen] = useState(false);
  const [isCelebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | null>(null);

  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [focusMode, setFocusMode] = useState<'NORMAL' | 'RESCUE_10MIN' | null>(null);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [isOverdueReviewOpen, setOverdueReviewOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [welcomeBackInfo, setWelcomeBackInfo] = useState<{ isReturning: boolean; daysMissed: number; lastTask: Task | null } | null>(null);
  const [mustWinCarryForwardTask, setMustWinCarryForwardTask] = useState<Task | null>(null);

  const logActivity = useCallback((
    entityType: 'TASK' | 'PROJECT' | 'SYSTEM' | 'CAPACITY' | 'SCHEDULE' | 'MOMENTUM' | 'INTEGRATION',
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

  // Load and execute timezone-aware daily rollover + capacity initialization
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

      const localTodayStr = getTodayDateString(currentSettings.timezone || 'Asia/Kolkata');

      // Load Phase 3 Daily Capacity for today
      const storedCapacities = localStorage.getItem(STORAGE_KEYS.DAILY_CAPACITY);
      if (storedCapacities) {
        const parsedCaps: DailyCapacityRecord[] = JSON.parse(storedCapacities);
        const todayCap = parsedCaps.find(c => c.date === localTodayStr);
        if (todayCap) {
          setTodayCapacityMinutes(todayCap.capacityMinutes);
          setCapacitySource(todayCap.source);
        } else {
          setTodayCapacityMinutes(currentSettings.dailyWorkCapacityMinutes || 45);
          setCapacitySource('DEFAULT');
        }
      } else {
        setTodayCapacityMinutes(currentSettings.dailyWorkCapacityMinutes || 45);
        setCapacitySource('DEFAULT');
      }

      // Load Phase 3 Schedule Overrides
      const storedOverrides = localStorage.getItem(STORAGE_KEYS.SCHEDULE_OVERRIDES);
      if (storedOverrides) {
        const parsedOverrides: ScheduleOverride[] = JSON.parse(storedOverrides);
        setScheduleOverrides(parsedOverrides);
      }

      // Load Phase 3 Daily Plans
      const storedPlans = localStorage.getItem(STORAGE_KEYS.DAILY_PLANS);
      if (storedPlans) {
        const parsedPlans: DailyPlan[] = JSON.parse(storedPlans);
        setDailyPlans(parsedPlans);
      }

      // Load Phase 5 Daily Schedule Entries
      const storedEntries = localStorage.getItem(STORAGE_KEYS.SCHEDULE_ENTRIES);
      if (storedEntries) {
        setScheduleEntries(JSON.parse(storedEntries));
      } else {
        setScheduleEntries(INITIAL_SCHEDULE_ENTRIES);
      }

      // Load Phase 5 Schedule Day Reviews
      const storedSchedReviews = localStorage.getItem(STORAGE_KEYS.SCHEDULE_REVIEWS);
      if (storedSchedReviews) {
        setScheduleDayReviews(JSON.parse(storedSchedReviews));
      } else {
        setScheduleDayReviews(INITIAL_SCHEDULE_DAY_REVIEWS);
      }

      const storedGoogleLists = localStorage.getItem(STORAGE_KEYS.GOOGLE_TASK_LIST_MAPPINGS);
      if (storedGoogleLists) {
        setTaskListMappings(JSON.parse(storedGoogleLists));
      } else {
        setTaskListMappings(INITIAL_TASK_LIST_MAPPINGS);
      }

      const storedGoogleTMaps = localStorage.getItem(STORAGE_KEYS.GOOGLE_TASK_MAPPINGS);
      if (storedGoogleTMaps) {
        setGoogleTaskMappings(JSON.parse(storedGoogleTMaps));
      } else {
        setGoogleTaskMappings(INITIAL_GOOGLE_TASK_MAPPINGS);
      }

      const storedGoogleCMaps = localStorage.getItem(STORAGE_KEYS.GOOGLE_CALENDAR_MAPPINGS);
      if (storedGoogleCMaps) {
        setGoogleCalendarMappings(JSON.parse(storedGoogleCMaps));
      } else {
        setGoogleCalendarMappings(INITIAL_GOOGLE_CALENDAR_MAPPINGS);
      }

      const storedGoogleLogs = localStorage.getItem(STORAGE_KEYS.GOOGLE_SYNC_LOGS);
      if (storedGoogleLogs) {
        setGoogleSyncLogs(JSON.parse(storedGoogleLogs));
      } else {
        setGoogleSyncLogs(INITIAL_GOOGLE_SYNC_LOGS);
      }

      setSelectedScheduleDate(localTodayStr);

      // TIMEZONE-AWARE ROLLOVER LOGIC
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

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_ENTRIES, JSON.stringify(scheduleEntries));
  }, [scheduleEntries, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_REVIEWS, JSON.stringify(scheduleDayReviews));
  }, [scheduleDayReviews, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    const localToday = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    const existing: DailyCapacityRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_CAPACITY) || '[]');
    const filtered = existing.filter(c => c.date !== localToday);
    filtered.push({
      id: `cap-${localToday}`,
      date: localToday,
      capacityMinutes: todayCapacityMinutes,
      source: capacitySource,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.DAILY_CAPACITY, JSON.stringify(filtered));
  }, [todayCapacityMinutes, capacitySource, settings.timezone, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_OVERRIDES, JSON.stringify(scheduleOverrides));
  }, [scheduleOverrides, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.DAILY_PLANS, JSON.stringify(dailyPlans));
  }, [dailyPlans, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    if (googleConnection) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_CONNECTION, JSON.stringify(googleConnection));
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_CONNECTION);
    }
  }, [googleConnection, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOOGLE_TASK_LIST_MAPPINGS, JSON.stringify(taskListMappings));
  }, [taskListMappings, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOOGLE_TASK_MAPPINGS, JSON.stringify(googleTaskMappings));
  }, [googleTaskMappings, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOOGLE_CALENDAR_MAPPINGS, JSON.stringify(googleCalendarMappings));
  }, [googleCalendarMappings, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SYNC_LOGS, JSON.stringify(googleSyncLogs));
  }, [googleSyncLogs, isLoaded]);

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
  const deletedTasks = useMemo(() => {
    return tasks.filter(t => t.isDeleted);
  }, [tasks]);

  const activeTasks = useMemo(() => {
    return tasks.filter(t => !t.isDeleted);
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return activeTasks.filter(t => t.status === 'TODAY' && !t.parentTaskId);
  }, [activeTasks]);

  const overdueTasks = useMemo(() => {
    return activeTasks.filter(t => t.status === 'OVERDUE' && !t.parentTaskId);
  }, [activeTasks]);

  const mustWinTask = useMemo(() => {
    // 1. Explicit must-win
    const explicit = activeTasks.find(t => t.isMustWin && t.status !== 'DONE');
    if (explicit) return explicit;

    // 2. Overdue P1 Must-Win Candidate
    const overdueP1 = activeTasks.find(t => t.status === 'OVERDUE' && t.priority === 'P1' && !t.parentTaskId);
    if (overdueP1) return overdueP1;

    // 3. Today P1
    const todayP1 = activeTasks.find(t => t.status === 'TODAY' && t.priority === 'P1' && !t.parentTaskId);
    if (todayP1) return todayP1;

    // 4. Any today task
    const anyToday = activeTasks.find(t => t.status === 'TODAY' && !t.parentTaskId);
    if (anyToday) return anyToday;

    // 5. This week fallback
    const thisWeekP1 = activeTasks.find(t => t.status === 'THIS_WEEK' && t.priority === 'P1' && !t.parentTaskId);
    if (thisWeekP1) return thisWeekP1;

    return null;
  }, [activeTasks]);

  const optionalTasks = useMemo(() => {
    if (!mustWinTask) {
      return activeTasks.filter(t => t.status === 'TODAY' && !t.parentTaskId).slice(0, 2);
    }
    return activeTasks
      .filter(t => t.status === 'TODAY' && t.id !== mustWinTask.id && !t.parentTaskId)
      .slice(0, 2);
  }, [activeTasks, mustWinTask]);

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

  // Real data-driven Momentum calculation (consecutive calendar days ending today/yesterday)
  const momentumStats = useMemo(() => {
    return calculateMomentum(tasks, settings.timezone || 'Asia/Kolkata');
  }, [tasks, settings.timezone]);

  const meaningfulDaysThisWeek = momentumStats.currentStreak;

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

    // Mark task done, record previousStatus for safe restoration, and complete child subtasks if any
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            previousStatus: t.status !== 'DONE' ? t.status : (t.previousStatus || 'TODAY'),
            status: 'DONE', 
            completedAt: now, 
            isMustWin: false 
          };
        }
        if (t.parentTaskId === taskId) {
          return { 
            ...t, 
            previousStatus: t.status !== 'DONE' ? t.status : (t.previousStatus || 'TODAY'),
            status: 'DONE', 
            completedAt: now 
          };
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

    // Check if new completion triggers a milestone
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'DONE' as TaskStatus, completedAt: now, isDeleted: false } : t);
    const newMomentum = calculateMomentum(updatedTasks, settings.timezone || 'Asia/Kolkata');
    if (newMomentum.isMilestone && newMomentum.milestoneDays) {
      setCelebrationMilestone(newMomentum.milestoneDays);
      setCelebrationOpen(true);
      logActivity('MOMENTUM', `m-${Date.now()}`, `${newMomentum.milestoneDays}-Day Momentum Achieved!`, 'MOMENTUM_MILESTONE', `${newMomentum.milestoneDays} consecutive days with completed work`);
    }

    setActiveFocusTask(null);
    setFocusMode(null);
  }, [tasks, settings.timezone, logActivity]);

  const undoTaskCompletion = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetStatus = task.previousStatus || 'TODAY';
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: targetStatus,
            completedAt: undefined,
            lastStatusChangeAt: new Date().toISOString(),
          };
        }
        if (t.parentTaskId === taskId) {
          return {
            ...t,
            status: t.previousStatus || 'TODAY',
            completedAt: undefined,
          };
        }
        return t;
      })
    );

    // Remove matching taskLog entry so Momentum recalculates accurately
    setTaskLogs(prev => prev.filter(l => l.taskId !== taskId));

    logActivity('TASK', taskId, task.title, 'TASK_COMPLETION_UNDONE', `Undid completion → Restored to ${targetStatus}`);
  }, [tasks, logActivity]);

  const restoreTask = useCallback((taskId: string, targetStatus?: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const destStatus = targetStatus || task.previousStatus || 'TODAY';
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: destStatus,
              completedAt: undefined,
              isDeleted: false,
              deletedAt: undefined,
              lastStatusChangeAt: new Date().toISOString(),
            }
          : t
      )
    );

    // Remove taskLog if it was completed
    setTaskLogs(prev => prev.filter(l => l.taskId !== taskId));

    logActivity('TASK', taskId, task.title, 'TASK_RESTORED', `Restored to ${destStatus}`);
    setRestoreModalOpen(false);
    setTaskToRestore(null);
  }, [tasks, logActivity]);

  const completeRescueAction = useCallback((taskId: string, notes?: string) => {
    completeTask(taskId, 10, notes ? `[10-min Rescue] ${notes}` : '[10-min Rescue] Completed');
  }, [completeTask]);

  const setMustWin = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(t => ({
        ...t,
        isMustWin: t.id === taskId,
        status: t.id === taskId ? 'TODAY' : t.status,
      }))
    );
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      logActivity('TASK', taskId, task.title, 'MUST_WIN_SET', 'Designated as Today’s MUST-WIN');
    }
  }, [tasks, logActivity]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (status === 'DONE') {
      completeTask(taskId, task.estimatedMinutes);
      return;
    }
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              status,
              previousStatus: t.status !== 'DONE' ? t.status : t.previousStatus,
              isMustWin: status === 'TODAY' ? t.isMustWin : false,
              completedAt: undefined,
              lastStatusChangeAt: new Date().toISOString(),
            }
          : t
      )
    );
    logActivity('TASK', taskId, task.title, 'STATUS_CHANGED', `Status changed to ${status}`);
  }, [tasks, completeTask, logActivity]);

  const addTask = useCallback((taskData: Partial<Task> & { title: string }) => {
    const count = tasks.length + 1;
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: `T-${count.toString().padStart(3, '0')}`,
      title: taskData.title,
      businessCode: taskData.businessCode || 'DESIGNOIA',
      priority: taskData.priority || 'P2',
      status: taskData.status || 'TODAY',
      estimatedMinutes: taskData.estimatedMinutes || 45,
      isMustWin: taskData.isMustWin || false,
      projectId: taskData.projectId,
      parentTaskId: taskData.parentTaskId,
      scheduledDate: taskData.scheduledDate,
      notes: taskData.notes,
      blockReason: taskData.blockReason,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    logActivity('TASK', newTask.id, newTask.title, 'STATUS_CHANGED', `Created task (${newTask.status})`);
    return newTask;
  }, [tasks.length, logActivity]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const addSubtask = useCallback((parentTaskId: string, title: string) => {
    const parent = tasks.find(t => t.id === parentTaskId);
    const count = tasks.length + 1;
    const newSubtask: Task = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: `T-${count.toString().padStart(3, '0')}`,
      title,
      businessCode: parent?.businessCode || 'DESIGNOIA',
      priority: parent?.priority || 'P2',
      status: 'TODAY',
      estimatedMinutes: 15,
      isMustWin: false,
      projectId: parent?.projectId,
      parentTaskId,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newSubtask]);
    return newSubtask;
  }, [tasks]);

  const softDeleteTask = useCallback((taskId: string) => {
    const now = new Date().toISOString();
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId || t.parentTaskId === taskId
          ? { ...t, isDeleted: true, deletedAt: now }
          : t
      )
    );
    if (task) {
      logActivity('TASK', taskId, task.title, 'TASK_SOFT_DELETED', 'Moved to Trash (recoverable)');
    }
  }, [tasks, logActivity]);

  const restoreFromTrash = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId || t.parentTaskId === taskId
          ? { ...t, isDeleted: false, deletedAt: undefined }
          : t
      )
    );
    if (task) {
      logActivity('TASK', taskId, task.title, 'TASK_RESTORED_FROM_TRASH', 'Restored from Trash to active queue');
    }
  }, [tasks, logActivity]);

  const permanentlyDeleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId && t.parentTaskId !== taskId));
    if (task) {
      logActivity('TASK', taskId, task.title, 'TASK_PERMANENTLY_DELETED', 'Permanently deleted task');
    }
  }, [tasks, logActivity]);

  const deleteTask = useCallback((taskId: string) => {
    softDeleteTask(taskId);
  }, [softDeleteTask]);

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

  // Phase 3 Actions & Adaptive Capacity Engine
  const setDailyCapacity = useCallback((minutes: number, source: CapacitySource, notes?: string) => {
    setTodayCapacityMinutes(minutes);
    setCapacitySource(source);
    logActivity('CAPACITY', `cap-${Date.now()}`, 'Daily Capacity Updated', 'CAPACITY_CHANGED', `Capacity set to ${minutes} min (source: ${source}${notes ? ` - ${notes}` : ''})`);
  }, [logActivity]);

  const setScheduleOverride = useCallback((
    blockType: ScheduleOverride['blockType'],
    isOff: boolean,
    deltaMinutes: number,
    name?: string
  ) => {
    const localToday = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    const newOverride: ScheduleOverride = {
      id: `override-${Date.now()}`,
      date: localToday,
      blockType,
      name,
      isOff,
      availableMinutesDelta: deltaMinutes,
      createdAt: new Date().toISOString(),
    };

    setScheduleOverrides(prev => {
      const filtered = prev.filter(o => !(o.date === localToday && o.blockType === blockType));
      return [...filtered, newOverride];
    });

    if (isOff && deltaMinutes > 0) {
      // Add extra time safely with rest buffer
      const newCapacity = (todayCapacityMinutes || 45) + deltaMinutes;
      setTodayCapacityMinutes(newCapacity);
      setCapacitySource('SCHEDULE_CALCULATED');
    }

    logActivity('SCHEDULE', newOverride.id, `${blockType} Schedule Override`, 'SCHEDULE_OVERRIDE', `${blockType} marked ${isOff ? 'OFF (+time)' : 'ON'}`);
  }, [settings.timezone, todayCapacityMinutes, logActivity]);

  const addExtraTime = useCallback((deltaMinutes: number) => {
    const newCap = (todayCapacityMinutes || 45) + deltaMinutes;
    setTodayCapacityMinutes(newCap);
    setCapacitySource('EXTRA_TIME');
    logActivity('CAPACITY', `extra-${Date.now()}`, 'Extra Time Added', 'EXTRA_TIME_ADDED', `Added +${deltaMinutes} min. Total capacity: ${newCap} min`);
  }, [todayCapacityMinutes, logActivity]);

  const reduceAvailableTime = useCallback((targetMinutes: number) => {
    setTodayCapacityMinutes(targetMinutes);
    setCapacitySource('REDUCED_TIME');
    logActivity('CAPACITY', `reduced-${Date.now()}`, 'Available Time Reduced', 'TIME_REDUCED', `Reduced capacity to ${targetMinutes} min`);
  }, [logActivity]);

  const setLowEnergyMode = useCallback(() => {
    setEnergyLevel('LOW');
    const lowCap = Math.min(todayCapacityMinutes, 20);
    setTodayCapacityMinutes(lowCap);
    setCapacitySource('LOW_ENERGY');
    logActivity('CAPACITY', `low-energy-${Date.now()}`, 'Low Energy Mode Activated', 'LOW_ENERGY_MODE', `Reduced to ${lowCap} min minimum day execution`);
  }, [todayCapacityMinutes, logActivity]);

  const setTimeAdjustModalOpen = useCallback((open: boolean, mode: 'MORE' | 'LESS' = 'MORE') => {
    setTimeAdjustMode(mode);
    setIsTimeAdjustModalOpen(open);
  }, []);

  const acceptDailyPlan = useCallback(() => {
    const localToday = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    const newPlan: DailyPlan = {
      id: `plan-${Date.now()}`,
      date: localToday,
      capacityMinutes: todayCapacityMinutes,
      plannedMinutes: todayPlannedMinutes,
      mustWinTaskId: mustWinTask?.id,
      recommendedTaskIds: optionalTasks.map(t => t.id),
      status: 'ACCEPTED',
      energyLevel,
      generatedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    };

    setDailyPlans(prev => {
      const filtered = prev.filter(p => p.date !== localToday);
      return [...filtered, newPlan];
    });

    logActivity('SYSTEM', newPlan.id, 'Daily Execution Plan', 'DAILY_PLAN_ACCEPTED', `Accepted plan for ${localToday} (${todayCapacityMinutes} min capacity)`);
    setMorningPlanOpen(false);
  }, [settings.timezone, todayCapacityMinutes, todayPlannedMinutes, mustWinTask, optionalTasks, energyLevel, logActivity]);

  // Phase 3 Deterministic Daily Recommendation
  const dailyRecommendation = useMemo(() => {
    return generateDailyRecommendation(
      tasks,
      projects,
      businesses,
      currentMonth,
      todayCapacityMinutes,
      settings.timezone || 'Asia/Kolkata',
      energyLevel === 'LOW'
    );
  }, [tasks, projects, businesses, currentMonth, todayCapacityMinutes, settings.timezone, energyLevel]);

  const dismissWelcomeBack = useCallback(() => {
    setWelcomeBackInfo(null);
  }, []);

  // Phase 5 Daily Scheduler Actions
  const setAddBlockModalOpen = useCallback((open: boolean, entry?: ScheduleEntry | null) => {
    setEditingScheduleEntry(entry || null);
    setIsAddBlockModalOpen(open);
  }, []);

  const addScheduleEntry = useCallback((entryData: Omit<ScheduleEntry, 'id' | 'createdAt'>) => {
    const duration = entryData.plannedDurationMinutes || calculateMinutesBetween(entryData.plannedStartTime, entryData.plannedEndTime);
    const newEntry: ScheduleEntry = {
      ...entryData,
      id: `sched-entry-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      plannedDurationMinutes: duration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setScheduleEntries(prev => [...prev, newEntry]);
    logActivity('SCHEDULE', newEntry.id, newEntry.title, 'STATUS_CHANGED', `Added block: ${newEntry.plannedStartTime}–${newEntry.plannedEndTime}`);
    return newEntry;
  }, [logActivity]);

  const updateScheduleEntry = useCallback((id: string, updates: Partial<ScheduleEntry>) => {
    setScheduleEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const updated = { ...entry, ...updates, updatedAt: new Date().toISOString() };
      if (updates.plannedStartTime || updates.plannedEndTime) {
        updated.plannedDurationMinutes = calculateMinutesBetween(
          updated.plannedStartTime,
          updated.plannedEndTime
        );
      }
      if (updates.actualStartTime && updates.actualEndTime) {
        updated.actualDurationMinutes = calculateMinutesBetween(
          updates.actualStartTime,
          updates.actualEndTime
        );
      }
      return updated;
    }));
  }, []);

  const deleteScheduleEntry = useCallback((id: string) => {
    setScheduleEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const startScheduleBlock = useCallback((id: string) => {
    const nowStr = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');
    const entry = scheduleEntries.find(e => e.id === id);
    if (!entry) return;
    updateScheduleEntry(id, {
      status: 'IN_PROGRESS',
      actualStartTime: entry.actualStartTime || nowStr,
    });
    logActivity('SCHEDULE', id, entry.title, 'SCHEDULE_BLOCK_STARTED', `Started at ${nowStr}`);
  }, [scheduleEntries, settings.timezone, updateScheduleEntry, logActivity]);

  const stopScheduleBlock = useCallback((id: string, actualDurationMinutes?: number, markTaskDone = false) => {
    const nowStr = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');
    const entry = scheduleEntries.find(e => e.id === id);
    if (!entry) return;
    const start = entry.actualStartTime || entry.plannedStartTime;
    const calculatedDuration = actualDurationMinutes !== undefined 
      ? actualDurationMinutes 
      : calculateMinutesBetween(start, nowStr);

    updateScheduleEntry(id, {
      status: 'COMPLETED',
      actualEndTime: nowStr,
      actualDurationMinutes: calculatedDuration,
    });

    if (markTaskDone && entry.taskId) {
      completeTask(entry.taskId, calculatedDuration);
    }

    logActivity('SCHEDULE', id, entry.title, 'SCHEDULE_BLOCK_COMPLETED', `Completed (${calculatedDuration}m actual vs ${entry.plannedDurationMinutes}m planned)`);
  }, [scheduleEntries, settings.timezone, updateScheduleEntry, completeTask, logActivity]);

  const rescheduleBlock = useCallback((id: string, targetDate: string, newStartTime?: string, newEndTime?: string) => {
    const entry = scheduleEntries.find(e => e.id === id);
    if (!entry) return;

    updateScheduleEntry(id, { status: 'RESCHEDULED', remarks: `${entry.remarks ? entry.remarks + ' • ' : ''}Rescheduled to ${targetDate}` });

    const start = newStartTime || entry.plannedStartTime;
    const end = newEndTime || entry.plannedEndTime;
    const duration = calculateMinutesBetween(start, end);

    const newClonedEntry: ScheduleEntry = {
      id: `sched-entry-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: targetDate,
      plannedStartTime: start,
      plannedEndTime: end,
      plannedDurationMinutes: duration,
      title: entry.title,
      description: entry.description,
      activityType: entry.activityType,
      businessCode: entry.businessCode,
      projectId: entry.projectId,
      subProjectId: entry.subProjectId,
      taskId: entry.taskId,
      status: 'PLANNED',
      isMustWin: entry.isMustWin,
      remarks: `Rescheduled from ${entry.date}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setScheduleEntries(prev => [...prev, newClonedEntry]);
    logActivity('SCHEDULE', id, entry.title, 'SCHEDULE_BLOCK_RESCHEDULED', `Rescheduled from ${entry.date} to ${targetDate}`);
  }, [scheduleEntries, updateScheduleEntry, logActivity]);

  const generateDayScheduleFromBaseline = useCallback((targetDate: string, force = false) => {
    const existingForDate = scheduleEntries.filter(e => e.date === targetDate);
    if (existingForDate.length > 0 && !force) return;

    const [y, m, dNum] = targetDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, dNum);
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay(); // 1 = Monday, 7 = Sunday
    const matchingBlocks = scheduleBlocks.filter(b => b.daysOfWeek.includes(dayOfWeek));

    const newEntries: ScheduleEntry[] = matchingBlocks.map((b, idx) => {
      let actType: ScheduleActivityType = 'OTHER';
      if (b.category === 'SCHOOL') actType = 'SCHOOL';
      else if (b.category === 'TUITION') actType = 'TUITION';
      else if (b.category === 'CLASSES') actType = 'CLASSES';
      else if (b.category === 'REST') actType = 'REST';
      else if (b.category === 'CEO_BLOCK') actType = mustWinTask ? (mustWinTask.businessCode as ScheduleActivityType) : 'DESIGNOIA';

      const duration = calculateMinutesBetween(b.startTime, b.endTime);
      return {
        id: `sched-gen-${targetDate}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        date: targetDate,
        plannedStartTime: b.startTime,
        plannedEndTime: b.endTime,
        plannedDurationMinutes: duration,
        title: b.isCeoTime && mustWinTask ? mustWinTask.title : b.name,
        description: b.description,
        activityType: actType,
        businessCode: b.isCeoTime && mustWinTask ? mustWinTask.businessCode : undefined,
        projectId: b.isCeoTime && mustWinTask ? mustWinTask.projectId : undefined,
        taskId: b.isCeoTime && mustWinTask ? mustWinTask.id : undefined,
        status: 'PLANNED',
        isMustWin: b.isCeoTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    if (force) {
      setScheduleEntries(prev => [...prev.filter(e => e.date !== targetDate), ...newEntries]);
    } else {
      setScheduleEntries(prev => [...prev, ...newEntries]);
    }
  }, [scheduleEntries, scheduleBlocks, mustWinTask]);

  const saveTomorrowPlan = useCallback((planEntries: Omit<ScheduleEntry, 'id' | 'createdAt'>[]) => {
    const targetDate = planEntries[0]?.date || getTodayDateString(settings.timezone || 'Asia/Kolkata');
    const created: ScheduleEntry[] = planEntries.map(e => ({
      ...e,
      id: `sched-plan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      plannedDurationMinutes: e.plannedDurationMinutes || calculateMinutesBetween(e.plannedStartTime, e.plannedEndTime),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setScheduleEntries(prev => [
      ...prev.filter(entry => entry.date !== targetDate),
      ...created,
    ]);

    logActivity('SCHEDULE', `plan-${targetDate}`, 'Tomorrow Plan Created', 'NIGHT_PLAN_CREATED', `Created ${created.length} scheduled time blocks for ${targetDate}`);
    setPlanTomorrowOpen(false);
  }, [settings.timezone, logActivity]);

  const saveScheduleDayReview = useCallback((reviewData: Omit<ScheduleDayReview, 'id' | 'createdAt'>) => {
    const newReview: ScheduleDayReview = {
      ...reviewData,
      id: `sched-rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setScheduleDayReviews(prev => [
      ...prev.filter(r => r.date !== reviewData.date),
      newReview,
    ]);
    logActivity('SCHEDULE', newReview.id, `Schedule Review (${reviewData.date})`, 'NIGHT_REVIEW_COMPLETED', `Accuracy: ${reviewData.planningAccuracyPercent}%, Variance: ${reviewData.varianceMinutes > 0 ? '+' : ''}${reviewData.varianceMinutes}m`);
    setScheduleReviewOpen(false);
  }, [logActivity]);

  // Google Integration Actions
  const openScheduleModal = useCallback((task: Task) => {
    setTaskToSchedule(task);
    setIsScheduleTaskModalOpen(true);
  }, []);

  const closeScheduleModal = useCallback(() => {
    setTaskToSchedule(null);
    setIsScheduleTaskModalOpen(false);
  }, []);

  const setConflictModalOpen = useCallback((open: boolean, conflict?: SyncConflict | null) => {
    setConflictToResolve(conflict || null);
    setConflictModalOpenState(open);
  }, []);

  const setSyncLogViewerOpen = useCallback((open: boolean) => {
    setIsSyncLogViewerOpen(open);
  }, []);

  const connectGoogle = useCallback((email = 'founder.ceo@gmail.com') => {
    const newConn: GoogleConnection = {
      id: `conn-${Date.now()}`,
      userId: 'user-founder-01',
      googleAccountEmail: email,
      googleUserId: '109283746501928374',
      scopes: [
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      status: 'CONNECTED',
      isTasksEnabled: true,
      isCalendarEnabled: true,
      primaryCalendarId: 'primary',
      selectedCalendarIds: ['primary'],
      defaultTaskListId: 'list-inbox',
      lastSyncAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setGoogleConnection(newConn);
    const newLog: GoogleSyncLog = {
      id: `log-${Date.now()}-conn`,
      eventType: 'SYNC_STARTED',
      details: `Google Account connected (${email}). Ready for bidirectional sync.`,
      createdAt: new Date().toISOString(),
    };
    setGoogleSyncLogs(prev => [newLog, ...prev]);
    logActivity('INTEGRATION', newConn.id, 'Google Integration Connected', 'GOOGLE_CONNECTED', `Connected as ${email}`);
  }, [logActivity]);

  const disconnectGoogle = useCallback(() => {
    setGoogleConnection(prev => prev ? { ...prev, status: 'DISCONNECTED' } : null);
    const newLog: GoogleSyncLog = {
      id: `log-${Date.now()}-disconn`,
      eventType: 'SYNC_COMPLETED',
      details: 'Google Account disconnected. All CEO OS data preserved.',
      createdAt: new Date().toISOString(),
    };
    setGoogleSyncLogs(prev => [newLog, ...prev]);
    logActivity('INTEGRATION', 'google-conn', 'Google Integration Disconnected', 'GOOGLE_DISCONNECTED', 'Sync paused. Local CEO OS data preserved.');
  }, [logActivity]);

  const scheduleTaskOnCalendar = useCallback((
    taskId: string,
    date: string,
    startTime: string,
    endTime: string,
    syncToCalendar = true
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const duration = calculateMinutesBetween(startTime, endTime);
    const generatedEventId = task.googleCalendarEventId || `gcal-${task.id}-${Date.now()}`;

    // 1. Update Task in CEO OS
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              scheduledDate: date,
              scheduledTime: startTime,
              dueDate: date,
              estimatedMinutes: duration,
              googleCalendarEventId: syncToCalendar ? generatedEventId : t.googleCalendarEventId,
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date().toISOString(),
            }
          : t
      )
    );

    // 2. Create or Update ScheduleEntry in Scheduler
    const existingEntryIndex = scheduleEntries.findIndex(e => e.taskId === taskId && e.date === date);
    if (existingEntryIndex !== -1) {
      updateScheduleEntry(scheduleEntries[existingEntryIndex].id, {
        plannedStartTime: startTime,
        plannedEndTime: endTime,
        plannedDurationMinutes: duration,
        status: 'PLANNED',
        sourceType: 'CEO_OS_TASK',
        googleCalendarEventId: syncToCalendar ? generatedEventId : undefined,
      });
    } else {
      const newEntry: ScheduleEntry = {
        id: `sched-entry-${Date.now()}`,
        date,
        plannedStartTime: startTime,
        plannedEndTime: endTime,
        plannedDurationMinutes: duration,
        title: task.title,
        activityType: (task.businessCode as ScheduleActivityType) || 'DESIGNOIA',
        businessCode: task.businessCode,
        projectId: task.projectId,
        taskId: task.id,
        status: 'PLANNED',
        isMustWin: task.isMustWin,
        sourceType: 'CEO_OS_TASK',
        googleCalendarEventId: syncToCalendar ? generatedEventId : undefined,
        googleCalendarId: 'primary',
        syncStatus: 'SYNCED',
        createdAt: new Date().toISOString(),
      };
      setScheduleEntries(prev => [...prev, newEntry]);
    }

    // 3. Update Google Calendar Mappings
    if (syncToCalendar) {
      setGoogleCalendarMappings(prev => {
        const filtered = prev.filter(m => m.ceoTaskId !== taskId);
        return [
          ...filtered,
          {
            id: `gcmap-${Date.now()}`,
            userId: googleConnection?.userId || 'user-founder-01',
            ceoTaskId: task.id,
            calendarId: 'primary',
            googleEventId: generatedEventId,
            lastGoogleUpdatedAt: new Date().toISOString(),
            lastCeoUpdatedAt: new Date().toISOString(),
            syncStatus: 'SYNCED',
          },
        ];
      });

      const newLog: GoogleSyncLog = {
        id: `log-${Date.now()}-sched`,
        eventType: 'GOOGLE_EVENT_CREATED',
        details: `Scheduled task in Google Calendar: "${task.title}" on ${date} (${startTime}–${endTime})`,
        entityId: taskId,
        entityTitle: task.title,
        createdAt: new Date().toISOString(),
      };
      setGoogleSyncLogs(prev => [newLog, ...prev]);
    }

    logActivity('SCHEDULE', taskId, task.title, 'SCHEDULE_OVERRIDE', `Scheduled for ${date} at ${startTime}–${endTime}${syncToCalendar ? ' (Google Calendar Linked)' : ''}`);
    closeScheduleModal();
  }, [tasks, scheduleEntries, googleConnection, updateScheduleEntry, logActivity, closeScheduleModal]);

  const unscheduleTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              scheduledDate: undefined,
              scheduledTime: undefined,
              googleCalendarEventId: undefined,
            }
          : t
      )
    );

    // Cancel matching schedule entry
    setScheduleEntries(prev =>
      prev.map(e =>
        e.taskId === taskId
          ? { ...e, status: 'CANCELLED', remarks: 'Unscheduled from calendar' }
          : e
      )
    );

    const newLog: GoogleSyncLog = {
      id: `log-${Date.now()}-unsched`,
      eventType: 'GOOGLE_EVENT_DELETED',
      details: `Removed schedule block for task "${task.title}". Google Task preserved.`,
      entityId: taskId,
      entityTitle: task.title,
      createdAt: new Date().toISOString(),
    };
    setGoogleSyncLogs(prev => [newLog, ...prev]);
    logActivity('SCHEDULE', taskId, task.title, 'SCHEDULE_BLOCK_CANCELLED', 'Unscheduled from execution timeline');
  }, [tasks, logActivity]);

  const updateTaskListMapping = useCallback((mapping: GoogleTaskListMapping) => {
    setTaskListMappings(prev => {
      const filtered = prev.filter(m => m.taskListId !== mapping.taskListId);
      return [...filtered, mapping];
    });
  }, []);

  const resolveSyncConflict = useCallback((conflictId: string, strategy: ConflictResolutionStrategy) => {
    const conflict = syncConflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    if (strategy === 'KEEP_GOOGLE') {
      setTasks(prev =>
        prev.map(t =>
          t.id === conflict.ceoTaskId
            ? {
                ...t,
                title: conflict.googleTitle,
                dueDate: conflict.googleDueDate,
                status: conflict.googleCompleted ? 'DONE' : (t.status === 'DONE' ? 'TODAY' : t.status),
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date().toISOString(),
              }
            : t
        )
      );
    } else {
      // KEEP_CEO_OS
      setTasks(prev =>
        prev.map(t =>
          t.id === conflict.ceoTaskId
            ? {
                ...t,
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date().toISOString(),
              }
            : t
        )
      );
    }

    setSyncConflicts(prev => prev.filter(c => c.id !== conflictId));
    setConflictModalOpen(false);

    const newLog: GoogleSyncLog = {
      id: `log-${Date.now()}-resolved`,
      eventType: 'SYNC_COMPLETED',
      details: `Conflict resolved for "${conflict.taskTitle}" (Strategy: ${strategy})`,
      entityId: conflict.ceoTaskId,
      entityTitle: conflict.taskTitle,
      createdAt: new Date().toISOString(),
    };
    setGoogleSyncLogs(prev => [newLog, ...prev]);
  }, [syncConflicts, setConflictModalOpen]);

  const syncGoogleNow = useCallback(async (origin: 'CEO_OS' | 'GOOGLE_TASKS' | 'GOOGLE_CALENDAR' = 'CEO_OS') => {
    if (!googleConnection || googleConnection.status !== 'CONNECTED') {
      return {
        tasksImported: 0,
        tasksExported: 0,
        tasksUpdated: 0,
        tasksCompleted: 0,
        eventsImported: 0,
        eventsExported: 0,
        eventsUpdated: 0,
        conflictsDetected: 0,
        errors: ['Google integration not connected'],
        lastSyncAt: new Date().toISOString(),
      };
    }

    setIsSyncingGoogle(true);
    try {
      const output = await GoogleBidirectionalSyncEngine.runSync(
        {
          tasks,
          scheduleEntries,
          connection: googleConnection,
          taskListMappings,
          taskMappings: googleTaskMappings,
          calendarMappings: googleCalendarMappings,
        },
        origin
      );

      setTasks(output.updatedTasks);
      setScheduleEntries(output.updatedScheduleEntries);
      setGoogleTaskMappings(output.updatedTaskMappings);
      setGoogleCalendarMappings(output.updatedCalendarMappings);
      setGoogleSyncLogs(prev => [...output.newLogs, ...prev].slice(0, 100));

      if (output.conflicts.length > 0) {
        setSyncConflicts(output.conflicts);
        setConflictToResolve(output.conflicts[0]);
        setConflictModalOpenState(true);
      }

      setGoogleConnection(prev => prev ? { ...prev, lastSyncAt: new Date().toISOString() } : null);
      logActivity('INTEGRATION', 'google-sync', 'Google Bidirectional Sync', 'GOOGLE_SYNC_COMPLETED', `Synced ${output.stats.tasksImported} tasks & ${output.stats.eventsImported} calendar commitments`);
      return output.stats;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errorLog: GoogleSyncLog = {
        id: `log-${Date.now()}-err`,
        eventType: 'SYNC_FAILED',
        details: `Sync error: ${msg}`,
        isError: true,
        createdAt: new Date().toISOString(),
      };
      setGoogleSyncLogs(prev => [errorLog, ...prev]);
      throw err;
    } finally {
      setIsSyncingGoogle(false);
    }
  }, [googleConnection, tasks, scheduleEntries, taskListMappings, googleTaskMappings, googleCalendarMappings, logActivity]);

  const simulateExternalGoogleTask = useCallback((title: string, listTitle = 'My Tasks') => {
    const { businessCode, projectId } = resolveBusinessAndProjectFromList(
      'sim-list',
      listTitle,
      taskListMappings
    );

    const generatedId = `task-gt-${Date.now()}`;
    const newTask: Task = {
      id: generatedId,
      code: `T-GT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title,
      businessCode,
      projectId,
      status: 'INBOX',
      priority: 'P2',
      estimatedMinutes: 30,
      source: 'GOOGLE_TASKS',
      externalTaskId: `gtask-${Date.now()}`,
      externalTaskListId: 'sim-list',
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);
    const newLog: GoogleSyncLog = {
      id: `log-${Date.now()}-sim-task`,
      eventType: 'GOOGLE_TASK_IMPORTED',
      details: `Simulated capture from Google Tasks: "${title}" into Inbox`,
      entityId: generatedId,
      entityTitle: title,
      createdAt: new Date().toISOString(),
    };
    setGoogleSyncLogs(prev => [newLog, ...prev]);
    logActivity('TASK', generatedId, title, 'STATUS_CHANGED', 'Imported from Google Tasks into Inbox');
  }, [taskListMappings, logActivity]);

  const simulateExternalCalendarEvent = useCallback((
    title: string,
    date: string,
    startTime: string,
    endTime: string
  ) => {
    const duration = calculateMinutesBetween(startTime, endTime);
    const newCommitment: ScheduleEntry = {
      id: `sched-gcal-sim-${Date.now()}`,
      date,
      plannedStartTime: startTime,
      plannedEndTime: endTime,
      plannedDurationMinutes: duration,
      title,
      activityType: 'MEETING',
      status: 'PLANNED',
      sourceType: 'FIXED_COMMITMENT',
      isExternalCommitment: true,
      googleCalendarEventId: `gcal-sim-${Date.now()}`,
      googleCalendarId: 'primary',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    setScheduleEntries(prev => [...prev, newCommitment]);
    const newLog: GoogleSyncLog = {
      id: `log-${Date.now()}-sim-event`,
      eventType: 'GOOGLE_EVENT_CREATED',
      details: `Imported external Calendar appointment: "${title}" (${startTime}–${endTime})`,
      entityId: newCommitment.id,
      entityTitle: title,
      createdAt: new Date().toISOString(),
    };
    setGoogleSyncLogs(prev => [newLog, ...prev]);
    logActivity('SCHEDULE', newCommitment.id, title, 'STATUS_CHANGED', `Imported Google Calendar commitment: ${startTime}–${endTime}`);
  }, [logActivity]);

  // Phase 5 Daily Scheduler Computed
  const currentDayScheduleEntries = useMemo(() => {
    let list = scheduleEntries.filter(e => e.date === selectedScheduleDate);
    if (scheduleFilterActivity !== 'ALL') {
      list = list.filter(e => e.activityType === scheduleFilterActivity);
    }
    return list.sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime));
  }, [scheduleEntries, selectedScheduleDate, scheduleFilterActivity]);

  const { currentScheduleBlock, nextScheduleBlock } = useMemo(() => {
    const todayStr = getTodayDateString(settings.timezone || 'Asia/Kolkata');
    if (selectedScheduleDate !== todayStr) {
      return { currentScheduleBlock: null, nextScheduleBlock: null };
    }
    const nowTime = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');
    const dayBlocks = scheduleEntries
      .filter(e => e.date === todayStr && e.status !== 'CANCELLED')
      .sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime));

    const inProgress = dayBlocks.find(e => e.status === 'IN_PROGRESS');
    if (inProgress) {
      const idx = dayBlocks.findIndex(e => e.id === inProgress.id);
      const next = dayBlocks.slice(idx + 1).find(e => e.status === 'PLANNED') || null;
      return { currentScheduleBlock: inProgress, nextScheduleBlock: next };
    }

    const currentIdx = dayBlocks.findIndex(e => {
      const start = e.plannedStartTime;
      let end = e.plannedEndTime;
      if (end === '00:00' && start.startsWith('23')) end = '24:00';
      return nowTime >= start && nowTime < end;
    });

    if (currentIdx !== -1) {
      const current = dayBlocks[currentIdx];
      const next = dayBlocks.slice(currentIdx + 1).find(e => e.status === 'PLANNED') || null;
      return { currentScheduleBlock: current, nextScheduleBlock: next };
    }

    const nextUpcoming = dayBlocks.find(e => e.plannedStartTime > nowTime && e.status === 'PLANNED') || null;
    return { currentScheduleBlock: null, nextScheduleBlock: nextUpcoming };
  }, [scheduleEntries, selectedScheduleDate, settings.timezone]);

  const scheduleDayStats = useMemo(() => {
    const blocks = scheduleEntries.filter(e => e.date === selectedScheduleDate && e.status !== 'CANCELLED');
    const plannedMins = blocks.reduce((acc, b) => acc + (b.plannedDurationMinutes || 0), 0);
    const actualMins = blocks.reduce((acc, b) => acc + (b.actualDurationMinutes !== undefined ? b.actualDurationMinutes : (b.status === 'COMPLETED' ? b.plannedDurationMinutes : 0)), 0);
    const variance = actualMins - plannedMins;
    const diff = Math.abs(plannedMins - actualMins);
    const accuracy = plannedMins > 0 ? Math.round(Math.max(0, Math.min(100, (1 - diff / plannedMins) * 100))) : 100;
    const completed = blocks.filter(b => b.status === 'COMPLETED').length;
    const missed = blocks.filter(b => b.status === 'MISSED').length;
    const mustWin = blocks.find(b => b.isMustWin);
    const mustWinDone = mustWin ? mustWin.status === 'COMPLETED' : false;

    return {
      plannedMinutes: plannedMins,
      actualMinutes: actualMins,
      varianceMinutes: variance,
      accuracyPercent: accuracy,
      completedCount: completed,
      missedCount: missed,
      totalCount: blocks.length,
      mustWinCompleted: mustWinDone,
    };
  }, [scheduleEntries, selectedScheduleDate]);

  const scheduleWeeklyAnalytics: ScheduleAnalytics = useMemo(() => {
    const weekEntries = scheduleEntries.filter(e => e.status === 'COMPLETED' || e.actualDurationMinutes);
    const totalPlanned = weekEntries.reduce((acc, e) => acc + (e.plannedDurationMinutes || 0), 0);
    const totalActual = weekEntries.reduce((acc, e) => acc + (e.actualDurationMinutes || e.plannedDurationMinutes || 0), 0);
    const diff = Math.abs(totalPlanned - totalActual);
    const accuracy = totalPlanned > 0 ? Math.round(Math.max(0, Math.min(100, (1 - diff / totalPlanned) * 100))) : 92;

    let bizMins = 0;
    let schoolMins = 0;
    let restMins = 0;

    weekEntries.forEach(e => {
      const dur = e.actualDurationMinutes || e.plannedDurationMinutes || 0;
      if (['DESIGNOIA', 'COL', 'CLIKIXPRESS', 'DEVELOPMENT', 'CONTENT', 'PLANNING'].includes(e.activityType)) {
        bizMins += dur;
      } else if (['SCHOOL', 'TUITION', 'CLASSES', 'ADMIN', 'MEETING'].includes(e.activityType)) {
        schoolMins += dur;
      } else if (['REST', 'BUFFER', 'PERSONAL'].includes(e.activityType)) {
        restMins += dur;
      }
    });

    const completedMWs = weekEntries.filter(e => e.isMustWin && e.status === 'COMPLETED').length;

    return {
      planningAccuracyPercent: accuracy,
      totalPlannedMinutes: totalPlanned,
      totalActualMinutes: totalActual,
      averageDelayMinutes: 12,
      completedMustWinsCount: completedMWs,
      topDifferenceReason: 'MEETING_DELAY',
      businessActualMinutes: bizMins,
      schoolTuitionActualMinutes: schoolMins,
      restBufferMinutes: restMins,
    };
  }, [scheduleEntries]);

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
      version: '3.0.0',
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
      dailyCapacityMinutes: todayCapacityMinutes,
      scheduleOverrides,
      dailyPlans,
      scheduleEntries,
      scheduleDayReviews,
    };
    return JSON.stringify(fullBackup, null, 2);
  }, [businesses, goals, months, projects, tasks, taskLogs, activityLogs, scheduleBlocks, dailyCheckins, weeklyReviews, monthlyReviews, settings, todayCapacityMinutes, scheduleOverrides, dailyPlans, scheduleEntries, scheduleDayReviews]);

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
      if (data.scheduleOverrides) setScheduleOverrides(data.scheduleOverrides);
      if (data.dailyPlans) setDailyPlans(data.dailyPlans);
      if (data.scheduleEntries) setScheduleEntries(data.scheduleEntries);
      if (data.scheduleDayReviews) setScheduleDayReviews(data.scheduleDayReviews);
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

    // Phase 5 Daily Scheduler & Planned vs Actual State
    scheduleEntries,
    scheduleDayReviews,
    selectedScheduleDate,
    isPlanTomorrowOpen,
    isScheduleReviewOpen,
    isAddBlockModalOpen,
    editingScheduleEntry,
    scheduleFilterActivity,
    scheduleViewMode,

    // Phase 5 Actions
    setSelectedScheduleDate,
    setPlanTomorrowOpen,
    setScheduleReviewOpen,
    setAddBlockModalOpen,
    setScheduleFilterActivity,
    setScheduleViewMode,
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    startScheduleBlock,
    stopScheduleBlock,
    rescheduleBlock,
    generateDayScheduleFromBaseline,
    saveTomorrowPlan,
    saveScheduleDayReview,

    // Phase 5 Computed
    currentDayScheduleEntries,
    currentScheduleBlock,
    nextScheduleBlock,
    scheduleDayStats,
    scheduleWeeklyAnalytics,

    // Phase 3 state & recommendations
    todayCapacityMinutes,
    capacitySource,
    scheduleOverrides,
    dailyPlans,
    energyLevel,
    isTodayDifferentModalOpen,
    isMorningPlanOpen,
    isTimeAdjustModalOpen,
    timeAdjustMode,
    dailyRecommendation,

    // Phase 4 Task Restoration & Real Momentum
    momentumStats,
    isRestoreModalOpen,
    taskToRestore,
    isTrashModalOpen,
    deletedTasks,
    isCelebrationOpen,
    celebrationMilestone,
    undoTaskCompletion,
    restoreTask,
    softDeleteTask,
    restoreFromTrash,
    permanentlyDeleteTask,
    setRestoreModalOpen,
    setTaskToRestore,
    setTrashModalOpen,
    setCelebrationOpen,
    setCelebrationMilestone,

    // Phase 3 actions
    setDailyCapacity,
    setScheduleOverride,
    addExtraTime,
    reduceAvailableTime,
    setLowEnergyMode,
    acceptDailyPlan,
    setTodayDifferentModalOpen,
    setMorningPlanOpen,
    setTimeAdjustModalOpen,

    // Standard Actions
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

    // Google Integration State
    googleConnection,
    taskListMappings,
    googleTaskMappings,
    googleCalendarMappings,
    googleSyncLogs,
    isSyncingGoogle,
    syncConflicts,
    taskToSchedule,
    isScheduleTaskModalOpen,
    conflictModalOpen,
    conflictToResolve,
    isSyncLogViewerOpen,

    // Google Integration Actions
    connectGoogle,
    disconnectGoogle,
    syncGoogleNow,
    openScheduleModal,
    closeScheduleModal,
    scheduleTaskOnCalendar,
    unscheduleTask,
    updateTaskListMapping,
    resolveSyncConflict,
    setConflictModalOpen,
    setSyncLogViewerOpen,
    simulateExternalGoogleTask,
    simulateExternalCalendarEvent,
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

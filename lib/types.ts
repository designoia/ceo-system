export type BusinessCode = 'COL' | 'DESIGNOIA' | 'CLIKIXPRESS' | 'PERSONAL';

export type TaskStatus = 
  | 'INBOX' 
  | 'BACKLOG' 
  | 'NEXT' 
  | 'THIS_WEEK' 
  | 'TODAY' 
  | 'OVERDUE' 
  | 'DONE' 
  | 'BLOCKED';

export type TaskPriority = 'P1' | 'P2' | 'P3';

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export type EnergyLevel = 'exhausted' | 'neutral' | 'good' | 'fire';

export type MissedReason = 
  | 'No time'
  | 'Too tired'
  | 'Forgot'
  | 'Task too large'
  | 'Unexpected work'
  | 'Blocked'
  | 'Other';

export interface Business {
  id: string;
  code: BusinessCode;
  name: string;
  tagline?: string;
  description: string;
  color: string;
  iconName: string;
  isActive: boolean;
}

export interface Goal {
  id: string;
  businessCode: BusinessCode;
  title: string;
  category: 'personal' | 'revenue' | 'infrastructure' | 'scale' | 'audience' | 'system';
  targetYear: number; // 2026 to 2031
  targetMetric?: string;
  currentMetric?: string;
  isCompleted: boolean;
  notes?: string;
}

export interface StrategicMonth {
  id: string;
  yearMonth: string; // '2026-09'
  focusTitle: string;
  targetOutcome: string;
  kpis: string[];
  definitionOfDone: string;
  isCurrent?: boolean;
}

export interface Project {
  id: string;
  code?: string; // 'P-001'
  name: string;
  businessCode: BusinessCode;
  parentProjectId?: string; // Optional: Max 1 parent (2 levels total)
  monthYear?: string;
  description: string;
  successDefinition: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate?: string;
  targetDate?: string;
  relatedGoalId?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  code?: string; // 'T-001'
  title: string;
  businessCode: BusinessCode;
  projectId?: string;
  parentTaskId?: string; // Subtasks support
  status: TaskStatus;
  previousStatus?: TaskStatus; // Preserved on completion for reliable restore
  priority: TaskPriority;
  isMustWin?: boolean;
  estimatedMinutes: number;
  scheduledDate?: string;
  scheduledTime?: string; // '23:15'
  dueDate?: string;
  notes?: string;
  blockReason?: string;
  rescueAction?: string; // 10-minute rescue version
  overdueAt?: string;
  lastStatusChangeAt?: string;
  createdAt: string;
  completedAt?: string;
  isDeleted?: boolean; // Soft delete protection
  deletedAt?: string;
  updatedAt?: string;
}

export interface MomentumStats {
  currentStreak: number;
  bestStreak: number;
  completedDates: string[];
  todayCompletedCount: number;
  completedToday: boolean;
  qualifyingDaysCount: number;
  totalCompletedTasks: number;
  isMilestone: boolean;
  milestoneDays?: number;
  milestoneValue?: number | null;
}

export interface TaskLog {
  id: string;
  taskId: string;
  taskTitle: string;
  businessCode: BusinessCode;
  durationMinutes: number;
  mode: 'NORMAL' | 'RESCUE_10MIN' | 'DEEP_WORK';
  notes?: string;
  completedAt: string;
}

export interface ActivityLog {
  id: string;
  entityType: 'TASK' | 'PROJECT' | 'SYSTEM' | 'CAPACITY' | 'SCHEDULE' | 'MOMENTUM';
  entityId: string;
  title: string;
  action: 
    | 'STARTED' 
    | 'COMPLETED' 
    | 'ROLLED_OVER' 
    | 'STATUS_CHANGED' 
    | 'MUST_WIN_SET'
    | 'CAPACITY_CHANGED'
    | 'SCHEDULE_OVERRIDE'
    | 'EXTRA_TIME_ADDED'
    | 'TIME_REDUCED'
    | 'LOW_ENERGY_MODE'
    | 'DAILY_PLAN_ACCEPTED'
    | 'TASK_COMPLETION_UNDONE'
    | 'TASK_RESTORED'
    | 'TASK_SOFT_DELETED'
    | 'TASK_RESTORED_FROM_TRASH'
    | 'TASK_PERMANENTLY_DELETED'
    | 'MOMENTUM_MILESTONE'
    | 'RESUME';
  details?: string;
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  name: string;
  startTime: string; // '08:00'
  endTime: string;   // '16:00'
  category: 'SCHOOL' | 'TUITION' | 'CLASSES' | 'CEO_BLOCK' | 'REST' | 'CUSTOM';
  daysOfWeek: number[]; // 1 = Monday, 7 = Sunday
  isCeoTime: boolean;
  description?: string;
}

// Phase 3 Daily Planning & Capacity Types
export type CapacitySource = 
  | 'DEFAULT' 
  | 'MANUAL' 
  | 'SCHEDULE_CALCULATED' 
  | 'EXTRA_TIME' 
  | 'REDUCED_TIME' 
  | 'LOW_ENERGY';

export interface DailyCapacityRecord {
  id: string;
  date: string; // 'YYYY-MM-DD'
  capacityMinutes: number;
  source: CapacitySource;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleOverride {
  id: string;
  date: string; // 'YYYY-MM-DD'
  blockType: 'SCHOOL' | 'TUITION' | 'CLASSES' | 'CEO_WORK' | 'CUSTOM';
  name?: string;
  isOff: boolean;
  startTime?: string;
  endTime?: string;
  availableMinutesDelta: number; // e.g. +120 when school is off
  notes?: string;
  createdAt: string;
}

export type DailyPlanStatus = 'GENERATED' | 'ACCEPTED' | 'COMPLETED' | 'DISMISSED';

export interface DailyPlan {
  id: string;
  date: string;
  capacityMinutes: number;
  plannedMinutes: number;
  mustWinTaskId?: string;
  recommendedTaskIds: string[];
  status: DailyPlanStatus;
  energyLevel?: 'LOW' | 'NORMAL' | 'HIGH';
  generatedAt: string;
  acceptedAt?: string;
  eveningNotes?: string;
}

export interface RecommendationResult {
  mustWinTask: Task | null;
  mustWinReason: string;
  nextTasks: Task[];
  optionalTasks: Task[];
  totalPlannedMinutes: number;
  capacityMinutes: number;
  bufferMinutes: number;
  isOverloaded: boolean;
  projectBreadcrumbs: Record<string, string>; // taskId -> "Designoia / Prorido / Prorido Website"
  taskReasons: Record<string, string>; // taskId -> "P1 Priority Due Today"
}

export interface DailyCheckin {
  id: string;
  date: string;
  mustWinCompleted: boolean;
  energyRating: EnergyLevel;
  missedReason?: MissedReason;
  accomplishments?: string;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  tasksPlanned: number;
  tasksCompleted: number;
  mustWinsCompleted: number;
  keyLearning?: string;
  nextWeekOneOutcome: string;
  createdAt: string;
}

export interface MonthlyReview {
  id: string;
  yearMonth: string;
  majorWins: string;
  majorBlockers: string;
  whatToContinue: string;
  whatToStop: string;
  whatToChange: string;
  revenueNumeric?: number;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  theme: 'dark' | 'light' | 'system';
  timezone: string; // Default: 'Asia/Kolkata'
  dailyWorkCapacityMinutes: number; // Default: 45
  morningNotificationTime: string;
  ceoBlockStart: string;
  ceoBlockEnd: string;
  defaultWorkDuration: number; // 45
  rescueModeDuration: number; // 10
  notificationsEnabled: boolean;
  audioChimeEnabled: boolean;
  lastActiveDate: string;
  lastMustWinId?: string;
  yesterdayMustWinCompleted?: boolean;
  onboardingCompleted: boolean;
}


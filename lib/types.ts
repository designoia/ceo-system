export type BusinessCode = 'COL' | 'DESIGNOIA' | 'CLIKIXPRESS' | 'PERSONAL';

export type TaskStatus = 'INBOX' | 'BACKLOG' | 'NEXT' | 'THIS_WEEK' | 'TODAY' | 'DONE' | 'BLOCKED';

export type TaskPriority = 'P1' | 'P2' | 'P3';

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

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
  monthYear?: string;
  description: string;
  successDefinition: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate?: string;
  targetDate?: string;
  relatedGoalId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  code?: string; // 'T-001'
  title: string;
  businessCode: BusinessCode;
  projectId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  isMustWin?: boolean;
  estimatedMinutes: number;
  scheduledDate?: string;
  scheduledTime?: string; // '23:15'
  notes?: string;
  blockReason?: string;
  rescueAction?: string; // 10-minute rescue version
  createdAt: string;
  completedAt?: string;
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

export interface ScheduleBlock {
  id: string;
  name: string;
  startTime: string; // '08:00'
  endTime: string;   // '16:00'
  category: 'SCHOOL' | 'TUITION' | 'CLASSES' | 'CEO_BLOCK' | 'REST';
  daysOfWeek: number[]; // 1 = Monday, 7 = Sunday
  isCeoTime: boolean;
  description?: string;
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
  morningNotificationTime: string;
  ceoBlockStart: string;
  ceoBlockEnd: string;
  defaultWorkDuration: number; // 45
  rescueModeDuration: number; // 10
  notificationsEnabled: boolean;
  audioChimeEnabled: boolean;
  lastActiveDate: string;
  lastMustWinId?: string;
  onboardingCompleted: boolean;
}

import { Task, ScheduleEntry, BusinessCode, SyncStatus, ConflictResolutionStrategy } from '@/lib/types';

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export interface GoogleTaskApiItem {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
  parent?: string;
  position?: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 date (YYYY-MM-DD or YYYY-MM-DDT00:00:00.000Z)
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
  etag?: string;
}

export interface GoogleTaskListApiItem {
  id: string;
  title: string;
  updated?: string;
  selfLink?: string;
  etag?: string;
}

export interface GoogleCalendarApiEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string; // e.g. 2026-09-08T23:15:00+05:30
    date?: string;     // e.g. 2026-09-08 (all day)
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
  extendedProperties?: {
    private?: {
      ceo_os_task_id?: string;
      ceo_os_schedule_id?: string;
      google_task_id?: string;
      integration_version?: string;
    };
  };
  etag?: string;
  updated?: string;
  htmlLink?: string;
}

export interface GoogleSyncResult {
  tasksImported: number;
  tasksExported: number;
  tasksUpdated: number;
  tasksCompleted: number;
  eventsImported: number;
  eventsExported: number;
  eventsUpdated: number;
  conflictsDetected: number;
  errors: string[];
  lastSyncAt: string;
}

export type SyncOrigin = 'CEO_OS' | 'GOOGLE_TASKS' | 'GOOGLE_CALENDAR';

import { Task } from '@/lib/types';

/** Maps a public.tasks row (snake_case) to the app's Task shape. */
export function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: (row.local_id as string) || (row.id as string),
    code: row.code as string | undefined,
    title: row.title as string,
    businessCode: row.business_code as Task['businessCode'],
    projectId: row.project_id as string | undefined,
    parentTaskId: row.parent_task_id as string | undefined,
    status: row.status as Task['status'],
    previousStatus: row.previous_status as Task['status'] | undefined,
    priority: row.priority as Task['priority'],
    isMustWin: Boolean(row.is_must_win),
    estimatedMinutes: (row.estimated_minutes as number) ?? 45,
    scheduledDate: row.scheduled_date as string | undefined,
    scheduledTime: row.scheduled_time as string | undefined,
    dueDate: row.due_date as string | undefined,
    notes: row.notes as string | undefined,
    blockReason: row.block_reason as string | undefined,
    rescueAction: row.rescue_action as string | undefined,
    overdueAt: row.overdue_at as string | undefined,
    lastStatusChangeAt: row.last_status_change_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
    source: row.source as Task['source'] | undefined,
    externalTaskId: row.external_task_id as string | undefined,
    externalTaskListId: row.external_task_list_id as string | undefined,
    googleEtag: row.google_etag as string | undefined,
    syncStatus: row.sync_status as Task['syncStatus'] | undefined,
    lastSyncedAt: row.last_synced_at as string | undefined,
  };
}

/** Maps an app Task to a public.tasks row for upsert, keyed by (user_id, local_id). */
export function taskToRow(task: Task, userId: string): Record<string, unknown> {
  return {
    user_id: userId,
    local_id: task.id,
    project_id: null, // project_id is a uuid FK; local string project ids aren't linked here yet
    parent_task_id: null,
    code: task.code ?? null,
    title: task.title,
    business_code: task.businessCode,
    status: task.status,
    previous_status: task.previousStatus ?? null,
    priority: task.priority,
    is_must_win: Boolean(task.isMustWin),
    estimated_minutes: task.estimatedMinutes ?? 45,
    scheduled_date: task.scheduledDate ?? null,
    scheduled_time: task.scheduledTime ?? null,
    due_date: task.dueDate ?? null,
    notes: task.notes ?? null,
    block_reason: task.blockReason ?? null,
    rescue_action: task.rescueAction ?? null,
    overdue_at: task.overdueAt ?? null,
    last_status_change_at: task.lastStatusChangeAt ?? new Date().toISOString(),
    completed_at: task.completedAt ?? null,
    is_deleted: Boolean(task.isDeleted),
    source: task.source ?? 'CEO_OS',
    external_task_id: task.externalTaskId ?? null,
    external_task_list_id: task.externalTaskListId ?? null,
    google_etag: task.googleEtag ?? null,
    sync_status: task.syncStatus ?? 'SYNCED',
    last_synced_at: task.lastSyncedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

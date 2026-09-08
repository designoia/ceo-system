import { Task, SyncConflict } from '@/lib/types';
import { GoogleTaskApiItem } from './types';

/**
 * Check if a task has simultaneous conflicting changes on both CEO OS and Google Tasks
 */
export function detectTaskConflict(
  ceoTask: Task,
  googleTask: GoogleTaskApiItem,
  lastSyncedAt?: string
): SyncConflict | null {
  const lastSyncTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;
  const ceoUpdateTime = new Date(ceoTask.updatedAt || ceoTask.createdAt).getTime();
  const googleUpdateTime = new Date(googleTask.updated).getTime();

  // If neither changed since last sync, no conflict
  if (lastSyncTime > 0 && ceoUpdateTime <= lastSyncTime && googleUpdateTime <= lastSyncTime) {
    return null;
  }

  // Compare core fields
  const googleCompleted = googleTask.status === 'completed';
  const ceoCompleted = ceoTask.status === 'DONE';

  const googleDueDate = googleTask.due ? googleTask.due.split('T')[0] : undefined;
  const ceoDueDate = ceoTask.dueDate ? ceoTask.dueDate.split('T')[0] : undefined;

  const isTitleDiff = ceoTask.title.trim() !== googleTask.title.trim();
  const isStatusDiff = ceoCompleted !== googleCompleted;
  const isDueDiff = (googleDueDate || '') !== (ceoDueDate || '');

  // If there are diffs AND both sides were updated after last sync time
  if ((isTitleDiff || isStatusDiff || isDueDiff) && ceoUpdateTime > lastSyncTime && googleUpdateTime > lastSyncTime) {
    return {
      id: `conflict-${ceoTask.id}-${Date.now()}`,
      ceoTaskId: ceoTask.id,
      googleTaskId: googleTask.id,
      taskTitle: ceoTask.title,
      ceoTitle: ceoTask.title,
      googleTitle: googleTask.title,
      ceoDueDate,
      googleDueDate,
      ceoCompleted,
      googleCompleted,
      ceoUpdatedAt: ceoTask.updatedAt || ceoTask.createdAt,
      googleUpdatedAt: googleTask.updated,
      detectedAt: new Date().toISOString(),
    };
  }

  return null;
}

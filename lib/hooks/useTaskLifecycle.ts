'use client';

import { useStore } from '@/lib/store';
import { useToast } from './useToast';
import { Task, TaskStatus } from '@/lib/types';

export function useTaskLifecycle() {
  const store = useStore();
  const toast = useToast();

  const handleCompleteTask = (taskId: string, durationMinutes = 45, notes?: string) => {
    const task = store.tasks.find(t => t.id === taskId);
    store.completeTask(taskId, durationMinutes, notes);
    if (task) {
      toast.showUndo(`Completed "${task.title}"`, () => {
        store.undoTaskCompletion(taskId);
      }, 5000);
    }
  };

  const handleDeleteWithUndo = (task: Task) => {
    store.softDeleteTask(task.id);
    toast.showUndo(`Task "${task.title}" moved to Trash`, () => {
      store.restoreFromTrash(task.id);
    }, 5000);
  };

  const handleRestore = (taskId: string, targetStatus?: TaskStatus) => {
    store.restoreTask(taskId, targetStatus);
    toast.success(`Task restored to ${targetStatus || 'Today'}`);
  };

  return {
    ...store,
    completeWithUndo: handleCompleteTask,
    deleteWithUndo: handleDeleteWithUndo,
    restoreTaskWithFeedback: handleRestore,
  };
}

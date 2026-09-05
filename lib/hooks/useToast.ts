'use client';

import { toastStore, ToastType } from '@/lib/toast-store';

export function useToast() {
  const success = (message: string, duration?: number) => {
    return toastStore.addToast({ type: 'SUCCESS', message, duration });
  };

  const error = (message: string, duration?: number) => {
    return toastStore.addToast({ type: 'ERROR', message, duration });
  };

  const warning = (message: string, duration?: number) => {
    return toastStore.addToast({ type: 'WARNING', message, duration });
  };

  const info = (message: string, duration?: number) => {
    return toastStore.addToast({ type: 'INFO', message, duration });
  };

  const showUndo = (message: string, onUndo: () => void, duration?: number) => {
    return toastStore.showUndoToast(message, onUndo, duration);
  };

  return {
    success,
    error,
    warning,
    info,
    showUndo,
    remove: toastStore.removeToast.bind(toastStore),
  };
}

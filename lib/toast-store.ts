'use client';

export type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  showUndoToast: (message: string, onUndo: () => void, duration?: number) => void;
}

// In-memory global subscribers if zustand is not installed or using simple vanilla store
type Listener = () => void;

class SimpleToastStore {
  private toasts: ToastItem[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getToasts() {
    return this.toasts;
  }

  addToast(toast: Omit<ToastItem, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const duration = toast.duration || 5000;
    const newToast: ToastItem = { ...toast, id, duration };

    this.toasts = [...this.toasts, newToast];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  showUndoToast(message: string, onUndo: () => void, duration = 5000) {
    return this.addToast({
      type: 'INFO',
      message,
      actionLabel: 'Undo',
      onAction: onUndo,
      duration,
    });
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const toastStore = new SimpleToastStore();

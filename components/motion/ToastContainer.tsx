'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, RotateCcw } from 'lucide-react';
import { toastStore, ToastItem } from '@/lib/toast-store';
import { VARIANTS } from '@/lib/motion';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastStore.subscribe(() => {
      setToasts([...toastStore.getToasts()]);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'ERROR';
          const isWarning = toast.type === 'WARNING';
          const isSuccess = toast.type === 'SUCCESS';

          return (
            <motion.div
              key={toast.id}
              variants={VARIANTS.toast}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md ${
                isError
                  ? 'border-destructive/40 bg-card/95 text-destructive ring-1 ring-destructive/20'
                  : isWarning
                  ? 'border-amber-500/40 bg-card/95 text-amber-500 ring-1 ring-amber-500/20'
                  : isSuccess
                  ? 'border-emerald-500/40 bg-card/95 text-emerald-500 ring-1 ring-emerald-500/20'
                  : 'border-border bg-card/95 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {isError && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
                {isWarning && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
                {isSuccess && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                {!isError && !isWarning && !isSuccess && <Info className="h-4 w-4 shrink-0 text-primary" />}

                <span className="text-xs font-semibold text-foreground truncate">
                  {toast.message}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction!();
                      toastStore.removeToast(toast.id);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{toast.actionLabel}</span>
                  </button>
                )}

                <button
                  onClick={() => toastStore.removeToast(toast.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

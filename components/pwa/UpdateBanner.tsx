'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * "New version available" banner — never auto-reloads. The user chooses
 * when to update, so in-progress typing (Quick Add, task notes, etc.)
 * is never destroyed out from under them.
 */
export function UpdateBanner() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setRegistration((e as CustomEvent<ServiceWorkerRegistration>).detail);
    };
    window.addEventListener('designoia:sw-update-available', handler);
    return () => window.removeEventListener('designoia:sw-update-available', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  const handleUpdate = () => {
    registration?.waiting?.postMessage('SKIP_WAITING');
  };

  return (
    <AnimatePresence>
      {registration && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 inset-x-0 z-[70] flex items-center justify-between gap-3 bg-primary px-4 py-2.5 text-primary-foreground safe-top"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <RefreshCw className="h-4 w-4" />
            <span>New Designoia version available</span>
          </div>
          <button
            onClick={handleUpdate}
            className="rounded-md bg-primary-foreground/20 px-3 py-1.5 text-[12px] font-semibold hover:bg-primary-foreground/30 transition-colors shrink-0"
          >
            Update now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

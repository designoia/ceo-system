'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { getPendingCount, onPendingChange } from '@/lib/offline-queue';

/**
 * "Offline · N changes queued" while disconnected, briefly "Synced" once
 * back online and the queue clears. Task viewing/creating/editing already
 * works offline (everything is local-first) — this is purely honest
 * status, not a gate on functionality.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPending(getPendingCount());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onPendingChange((count) => {
      setPending((prev) => {
        if (prev > 0 && count === 0 && navigator.onLine) {
          setShowSynced(true);
          setTimeout(() => setShowSynced(false), 2500);
        }
        return count;
      });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const showOffline = !isOnline;

  return (
    <AnimatePresence>
      {(showOffline || showSynced) && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-0 inset-x-0 z-[65] flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-medium safe-top ${
            showOffline ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
          }`}
        >
          {showOffline ? (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline{pending > 0 ? ` · ${pending} change${pending > 1 ? 's' : ''} queued` : ''}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Synced</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

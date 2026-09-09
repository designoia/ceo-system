'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const DISMISS_KEY = 'ceo_os_install_prompt_dismissed_v1';
const VISIT_COUNT_KEY = 'ceo_os_visit_count_v1';
const MEANINGFUL_VISIT_THRESHOLD = 3;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Install promotion — shown once, after the user has actually used the
 * app a few times (not on first load), and never shown again once
 * dismissed or installed.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (visits >= MEANINGFUL_VISIT_THRESHOLD) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(DISMISS_KEY, '1');
      setVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 md:bottom-4 inset-x-4 z-[55] md:left-auto md:right-4 md:w-80 rounded-xl border border-border surface-2 shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-semibold text-foreground">Install Designoia</h4>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Keep your CEO OS one tap away.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={dismiss}
                  className="rounded-md px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={install}
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Install
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="text-muted-foreground/50 hover:text-muted-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

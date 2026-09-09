'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker and dispatches a window event when an
 * updated worker is waiting, so UpdateBanner can prompt the user instead
 * of forcing a silent reload.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        window.dispatchEvent(new CustomEvent('designoia:sw-update-available', { detail: registration }));
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('designoia:sw-update-available', { detail: registration }));
          }
        });
      });
    }).catch(() => {
      // Offline-first is a progressive enhancement — a failed registration
      // (e.g. unsupported browser) should never block the app itself.
    });
  }, []);

  return null;
}

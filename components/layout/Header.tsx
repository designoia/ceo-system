'use client';

import React from 'react';
import { Plus, Bell, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { NotificationService } from '@/lib/notification-service';

export function Header() {
  const { setCommandPaletteOpen, settings } = useStore();

  const handleEnableNotifications = async () => {
    const perm = await NotificationService.requestPermission();
    if (perm === 'granted') {
      NotificationService.sendActionNotification(
        '🎯 CEO OS Ready',
        'Action reminders and CEO work block cues are now active.'
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            CEO OS
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            5-Year Plan → Today's Action
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {settings.notificationsEnabled && (
          <button
            onClick={handleEnableNotifications}
            title="Enable Action Alerts"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
        )}

        <button
          id="global-quick-add-btn"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs sm:text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Quick Add</span>
          <kbd className="hidden ml-1 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] text-primary-foreground sm:inline-block font-mono">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}

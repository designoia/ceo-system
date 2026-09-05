'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  RefreshCw, 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  Shield, 
  Smartphone, 
  Laptop,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { NotificationService } from '@/lib/notification-service';

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    businesses, 
    resetToDemoData, 
    exportDataJSON, 
    exportTasksCSV, 
    importDataJSON 
  } = useStore();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleDownloadJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceo-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportTasksCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceo-os-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('Data imported successfully!');
      } else {
        setImportStatus('Failed to parse JSON backup file.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleTestNotification = async () => {
    const perm = await NotificationService.requestPermission();
    if (perm === 'granted') {
      NotificationService.sendActionNotification(
        '🎯 CEO Work Block',
        'Your 45-minute CEO block starts now. Tonight: Finish 10th Notes.'
      );
      setNotificationMsg('Action notification sent!');
    } else {
      setNotificationMsg('Notification permission was not granted.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">
          SYSTEM PREFERENCES
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings & Data Freedom
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure notifications, themes, schedule parameters, and export your data at any time.
        </p>
      </div>

      {/* 1. NOTIFICATIONS & ALERTS */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold text-foreground">Action Notifications</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          CEO OS only sends high-action reminders (Morning mission & 11:15 PM work block start). No spam.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleTestNotification}
            className="rounded-xl border border-border bg-accent px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors"
          >
            Test Action Notification
          </button>

          {notificationMsg && (
            <span className="text-xs text-primary font-medium">{notificationMsg}</span>
          )}
        </div>
      </div>

      {/* 2. BUSINESS FOCUS AREAS */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Configured Ventures & Focus Areas</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {businesses.map((biz) => (
            <div
              key={biz.code}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3.5"
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: biz.color }}
              />
              <div>
                <div className="text-xs font-bold text-foreground">
                  {biz.name} ({biz.code})
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {biz.tagline}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PWA INSTALLATION GUIDE */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Install App on Devices (PWA)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Laptop className="h-4 w-4 text-primary" />
              <span>Windows Desktop / Chrome / Edge</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Click the <strong>Install</strong> icon in your browser address bar (top right) or go to <strong>Menu → Install CEO OS</strong>. The app will open in its own clean window and pin to your Taskbar.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Android & iPhone / iPad</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              In Safari (iOS) tap <strong>Share → Add to Home Screen</strong>. In Chrome (Android) tap <strong>Menu (⋮) → Add to Home screen</strong>. Runs fullscreen with zero browser address bar clutter.
            </p>
          </div>
        </div>
      </div>

      {/* 4. DATA EXPORT & IMPORT (ZERO LOCK-IN) */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Data Ownership & Backup</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          You own 100% of your data. Export your tasks, projects, goals, and logs at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-accent px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Full Backup (JSON)</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-accent px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Tasks (CSV)</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span>Import JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="text-xs font-semibold text-primary">{importStatus}</div>
        )}
      </div>

      {/* 5. RESET DATA */}
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground">Reset to Seed Demo Data</h4>
          <p className="text-xs text-muted-foreground">
            Restores initial sample data (COL, Designoia, Clikixpress, T-001 through T-015).
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all data to default seed data?')) {
              resetToDemoData();
            }
          }}
          className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
}

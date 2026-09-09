'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Bell, 
  Shield, 
  Globe,
  Activity,
  CheckCircle2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { NotificationService } from '@/lib/notification-service';
import { PageTransition } from '@/components/motion/PageTransition';
import { TrashModal } from '@/components/tasks/TrashModal';
import { GoogleConnectionCard } from '@/components/integrations/GoogleConnectionCard';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST - Asia/Kolkata)' },
  { value: 'America/New_York', label: 'US Eastern (EST/EDT - New York)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT - Los Angeles)' },
  { value: 'Europe/London', label: 'UK (GMT/BST - London)' },
  { value: 'Asia/Dubai', label: 'Gulf (GST - Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT - Singapore)' },
];

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    activityLogs,
    deletedTasks,
    resetToDemoData,
    exportDataJSON,
    exportTasksCSV,
    importDataJSON,
    connectGoogle,
  } = useStore();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'INTEGRATIONS' | 'GENERAL' | 'BACKUP'>('INTEGRATIONS');
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [savedSettingMsg, setSavedSettingMsg] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get('google_connected');
    const email = searchParams.get('google_email');
    const error = searchParams.get('error');

    if (connected === 'true' && email) {
      connectGoogle(email);
      router.replace('/settings');
    } else if (error) {
      setOauthError(error);
      router.replace('/settings');
    }
  }, [searchParams, connectGoogle, router]);

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
        'Your 45-minute CEO block starts now. Tonight: Finish Prorido Homepage.'
      );
      setNotificationMsg('Action notification sent!');
    } else {
      setNotificationMsg('Notification permission was not granted.');
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleUpdateSetting = (updates: Partial<typeof settings>) => {
    updateSettings(updates);
    setSavedSettingMsg('Settings saved');
    setTimeout(() => setSavedSettingMsg(null), 2500);
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">
          SYSTEM PREFERENCES
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings & Integrations
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Google Tasks + Calendar bidirectional sync, timezones, work capacity, and backups.
        </p>
      </div>

      {oauthError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs font-semibold text-destructive flex items-center gap-2 animate-in fade-in">
          <span>Google connection failed: {oauthError}</span>
        </div>
      )}

      {savedSettingMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-500 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{savedSettingMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'INTEGRATIONS'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          Google Tasks & Calendar
        </button>

        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'GENERAL'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          Timezone & Capacity
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'BACKUP'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          Backups & Logs
        </button>
      </div>

      {/* Tab 1: Google Integration */}
      {activeTab === 'INTEGRATIONS' && (
        <GoogleConnectionCard />
      )}

      {/* Tab 2: General Settings */}
      {activeTab === 'GENERAL' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-foreground">Timezone & Daily Capacity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Timezone Selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  User Timezone (Governs Daily Rollover)
                </label>
                <select
                  value={settings.timezone || 'Asia/Kolkata'}
                  onChange={(e) => handleUpdateSetting({ timezone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:border-primary"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Unfinished TODAY tasks automatically roll over to OVERDUE at local midnight.
                </p>
              </div>

              {/* Daily Work Capacity */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Daily CEO Work Capacity
                </label>
                <select
                  value={settings.dailyWorkCapacityMinutes || 45}
                  onChange={(e) => handleUpdateSetting({ dailyWorkCapacityMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value={10}>10 Minutes (Minimum Day)</option>
                  <option value={20}>20 Minutes (Sprint)</option>
                  <option value={30}>30 Minutes (Standard)</option>
                  <option value={45}>45 Minutes (CEO Work Block - Recommended)</option>
                  <option value={60}>60 Minutes (Deep Session)</option>
                  <option value={90}>90 Minutes (Extended)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Warns you if planned tasks exceed your realistic nightly execution window.
                </p>
              </div>
            </div>
          </div>

          {/* 2. NOTIFICATIONS & ALERTS */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-foreground">Action Notifications</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              CEO OS only sends high-action reminders (Morning mission & 11:15 PM work block start).
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

          {/* DATABASE & SUPABASE CLOUD STATUS */}
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Supabase Cloud Database</h3>
                  <p className="text-[11px] text-muted-foreground">PostgreSQL Cloud Database with Row-Level Security</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>

            <div className="rounded-xl bg-background/60 border border-border/80 p-3 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Endpoint:</span>
                <span className="text-foreground">https://iwbfcbnajbqkfcsxoyxi.supabase.co</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Schema & Migrations:</span>
                <span className="text-emerald-500 font-semibold">Phase 1 + Phase 2 + Google Bidirectional Sync</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Backup & Audit Logs */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-6">
          {/* SYSTEM ACTIVITY LOG */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-foreground">System Activity Log</h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{activityLogs.length} events</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
              {activityLogs.length === 0 ? (
                <p className="text-muted-foreground">No recent activity logged.</p>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                          log.action === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                          log.action === 'ROLLED_OVER' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-semibold text-foreground">{log.title}</span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-muted-foreground">{log.details}</p>
                      )}
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DATA EXPORT & IMPORT */}
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

          {/* TRASH & RECOVERY */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
                <h4 className="text-sm font-bold text-foreground">Trash & Soft-Deleted Tasks</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {deletedTasks.length} {deletedTasks.length === 1 ? 'task' : 'tasks'} currently in trash. Recover accidentally deleted tasks or permanently purge.
              </p>
            </div>

            <button
              onClick={() => setIsTrashOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-accent px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors self-start sm:self-auto min-h-[44px]"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              <span>Open Trash ({deletedTasks.length})</span>
            </button>
          </div>

          {/* RESET DATA */}
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">Reset to Seed Demo Data</h4>
              <p className="text-xs text-muted-foreground">
                Restores initial sample data (COL, Designoia hierarchy, Prorido sub-projects, Clikixpress).
              </p>
            </div>

            <button
              onClick={() => {
                if (confirm('Reset all data to default seed data?')) {
                  resetToDemoData();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors self-start sm:self-auto min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      )}

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />
    </PageTransition>
  );
}

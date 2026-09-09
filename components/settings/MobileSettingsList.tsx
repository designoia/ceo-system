'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  User,
  Bell,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SyncStatusIndicator } from '@/components/integrations/SyncStatusIndicator';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'US Eastern' },
  { value: 'America/Los_Angeles', label: 'US Pacific' },
  { value: 'Europe/London', label: 'UK' },
  { value: 'Asia/Dubai', label: 'Gulf (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
];

function timeAgo(iso?: string): string {
  if (!iso) return 'Never';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function Row({
  icon,
  label,
  value,
  onClick,
  trailing,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 min-h-[44px] surface-1 ${onClick ? 'active:bg-secondary/60' : ''} text-left transition-colors`}
    >
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <span className="text-[14px] text-foreground flex-1 min-w-0 truncate">{label}</span>
      {value && <span className="text-[13px] text-muted-foreground shrink-0 truncate max-w-[140px]">{value}</span>}
      {trailing}
      {onClick && !trailing && <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
    </Comp>
  );
}

export function MobileSettingsList() {
  const {
    settings,
    updateSettings,
    googleConnection,
    isSyncingGoogle,
    syncGoogleNow,
    connectGoogle,
    disconnectGoogle,
    setSyncLogViewerOpen,
    activityLogs,
    deletedTasks,
    exportDataJSON,
    exportTasksCSV,
    importDataJSON,
    resetToCleanStart,
  } = useStore();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const isConnected = googleConnection?.status === 'CONNECTED';

  const handleDownloadJSON = () => {
    const blob = new Blob([exportDataJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceo-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([exportTasksCSV()], { type: 'text/csv' });
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
      const ok = importDataJSON(event.target?.result as string);
      setImportStatus(ok ? 'Imported successfully' : 'Failed to parse file');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-6">
      <SectionLabel>Account</SectionLabel>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden mx-4 w-[calc(100%-2rem)]">
        <Row
          icon={<User className="h-4 w-4" />}
          label="Google Account"
          value={isConnected ? googleConnection?.googleAccountEmail : 'Not connected'}
          onClick={() => (isConnected ? disconnectGoogle() : connectGoogle())}
        />
      </div>

      <SectionLabel>Sync</SectionLabel>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden mx-4 w-[calc(100%-2rem)]">
        <Row label="Google Tasks" value={isConnected ? 'Connected' : '—'} />
        <Row label="Google Calendar" value={isConnected ? 'Connected' : '—'} />
        <Row label="Last sync" value={timeAgo(googleConnection?.lastSyncAt)} />
        <Row
          label="Sync now"
          trailing={<SyncStatusIndicator compact />}
          onClick={() => !isSyncingGoogle && syncGoogleNow('CEO_OS').catch(() => {})}
        />
        <Row label="Sync history" onClick={() => setSyncLogViewerOpen(true)} />
      </div>

      <SectionLabel>Preferences</SectionLabel>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden mx-4 w-[calc(100%-2rem)]">
        <div className="flex items-center gap-3 px-4 py-3 surface-1">
          <span className="text-[14px] text-foreground flex-1">Timezone</span>
          <select
            value={settings.timezone || 'Asia/Kolkata'}
            onChange={(e) => updateSettings({ timezone: e.target.value })}
            className="bg-transparent text-[13px] text-muted-foreground text-right focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 surface-1">
          <span className="text-[14px] text-foreground flex-1">Daily capacity</span>
          <select
            value={settings.dailyWorkCapacityMinutes || 45}
            onChange={(e) => updateSettings({ dailyWorkCapacityMinutes: Number(e.target.value) })}
            className="bg-transparent text-[13px] text-muted-foreground text-right focus:outline-none"
          >
            {[10, 20, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 surface-1">
          <span className="text-[14px] text-foreground flex-1">Working hours</span>
          <span className="text-[13px] text-muted-foreground">{settings.ceoBlockStart}–{settings.ceoBlockEnd}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 surface-1">
          <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-[14px] text-foreground flex-1">Notifications</span>
          <button
            onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${settings.notificationsEnabled ? 'bg-primary' : 'bg-secondary'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </div>

      <SectionLabel>Data</SectionLabel>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden mx-4 w-[calc(100%-2rem)]">
        <Row icon={<Download className="h-4 w-4" />} label="Export backup (JSON)" onClick={handleDownloadJSON} />
        <Row icon={<Download className="h-4 w-4" />} label="Export tasks (CSV)" onClick={handleDownloadCSV} />
        <label className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] surface-1 active:bg-secondary/60 transition-colors cursor-pointer">
          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-[14px] text-foreground flex-1">Import backup</span>
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>
        <Row label="Activity log" value={`${activityLogs.length} events`} />
        <Row
          icon={<RotateCcw className="h-4 w-4" />}
          label="Trash"
          value={`${deletedTasks.length} items`}
        />
        <Row
          icon={<Trash2 className="h-4 w-4 text-amber-500" />}
          label="Clean Start"
          onClick={() => {
            if (confirm('Clear all tasks, projects, and schedule data? This keeps Goals. Cannot be undone.')) {
              resetToCleanStart();
            }
          }}
        />
      </div>

      {importStatus && (
        <p className="px-4 pt-3 text-[12px] text-primary">{importStatus}</p>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Plus,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BusinessCode, GoogleTaskListMapping } from '@/lib/types';
import { DEFAULT_TASK_LIST_MAPPINGS } from '@/lib/integrations/google/mappings';

export function GoogleConnectionCard() {
  const {
    googleConnection,
    connectGoogle,
    disconnectGoogle,
    syncGoogleNow,
    isSyncingGoogle,
    taskListMappings,
    updateTaskListMapping,
    setSyncLogViewerOpen,
    simulateExternalGoogleTask,
    simulateExternalCalendarEvent,
    businesses,
    projects,
    settings
  } = useStore();

  const [simTaskTitle, setSimTaskTitle] = useState('');
  const [simEventTitle, setSimEventTitle] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => setHasMounted(true), []);

  const isConnected = hasMounted && googleConnection?.status === 'CONNECTED';

  const handleSyncNow = async () => {
    try {
      const stats = await syncGoogleNow('CEO_OS');
      setSyncFeedback(`Sync completed: ${stats.tasksImported} imported, ${stats.eventsImported} calendar events updated.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncFeedback(`Sync failed: ${msg}`);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleSimulateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simTaskTitle.trim()) return;
    simulateExternalGoogleTask(simTaskTitle.trim());
    setSimTaskTitle('');
    setSyncFeedback('Simulated Google Task imported into Inbox!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSimulateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEventTitle.trim()) return;
    simulateExternalCalendarEvent(simEventTitle.trim(), '2026-09-07', '14:00', '15:00');
    setSimEventTitle('');
    setSyncFeedback('Simulated Google Calendar event added to Scheduler!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Account Connection Status Banner */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-primary/20 to-purple-500/20 border border-primary/30 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Google Account</h3>
                {isConnected ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected
                  ? `Connected as ${googleConnection.googleAccountEmail}`
                  : 'Connect your Google account for Google Tasks and Google Calendar sync'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncingGoogle}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all min-h-[44px] disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGoogle ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={disconnectGoogle}
                  className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all min-h-[44px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { window.location.href = '/api/integrations/google/connect?returnTo=/settings'; }}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md min-h-[44px]"
              >
                <span>Connect Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Health Details */}
        {isConnected && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
            <div className="rounded-xl bg-muted/30 p-3 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Google Tasks API</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected & Enabled</span>
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 p-3 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Google Calendar API</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected & Enabled</span>
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 p-3 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Sync Status</span>
              <div className="flex items-center justify-between">
                <span className="text-foreground font-semibold">Healthy</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Last: {googleConnection?.lastSyncAt ? new Date(googleConnection.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </span>
              </div>
            </div>
          </div>
        )}

        {syncFeedback && (
          <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-xs text-primary font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. Google Task Lists Mapping Table */}
      {isConnected && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Google Task List Mappings</h4>
                <p className="text-xs text-muted-foreground">Map Google Task lists directly to CEO OS businesses and projects</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Google Task List</th>
                  <th className="py-2.5 px-3">Mapped CEO OS Business</th>
                  <th className="py-2.5 px-3">Mapped Project</th>
                  <th className="py-2.5 px-3">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {taskListMappings.map((mapping) => (
                  <tr key={mapping.taskListId} className="hover:bg-muted/20">
                    <td className="py-3 px-3 font-semibold text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {mapping.taskListTitle}
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={mapping.businessCode || 'COL'}
                        onChange={(e) =>
                          updateTaskListMapping({
                            ...mapping,
                            businessCode: e.target.value as BusinessCode,
                          })
                        }
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                      >
                        {businesses.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={mapping.projectId || ''}
                        onChange={(e) =>
                          updateTaskListMapping({
                            ...mapping,
                            projectId: e.target.value || undefined,
                          })
                        }
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
                      >
                        <option value="">(All Business Projects)</option>
                        {projects
                          .filter((p) => p.businessCode === mapping.businessCode)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </td>

                    <td className="py-3 px-3 text-muted-foreground">
                      {mapping.isInboxDefault ? (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Inbox Default
                        </span>
                      ) : (
                        <span>Direct Sync</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Bidirectional Testing Sandbox */}
      {isConnected && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Bidirectional Integration Sandbox</h4>
                <p className="text-xs text-muted-foreground">Simulate incoming external events from Google mobile and web</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSyncLogViewerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors min-h-[40px]"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>View Sync Logs</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Simulate Google Task */}
            <form onSubmit={handleSimulateTask} className="rounded-xl border border-border/80 p-3.5 bg-muted/10 space-y-2.5">
              <label className="text-xs font-semibold text-foreground block">
                Simulate Google Task Quick Capture
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={simTaskTitle}
                  onChange={(e) => setSimTaskTitle(e.target.value)}
                  placeholder="e.g. Call supplier about packaging"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!simTaskTitle.trim()}
                  className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 min-h-[44px]"
                >
                  Import
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Simulates creating a task in Google Tasks mobile app; CEO OS will import into Inbox.
              </p>
            </form>

            {/* Simulate Calendar Event */}
            <form onSubmit={handleSimulateEvent} className="rounded-xl border border-border/80 p-3.5 bg-muted/10 space-y-2.5">
              <label className="text-xs font-semibold text-foreground block">
                Simulate External Calendar Appointment
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={simEventTitle}
                  onChange={(e) => setSimEventTitle(e.target.value)}
                  placeholder="e.g. Doctor Consultation"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!simEventTitle.trim()}
                  className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-50 min-h-[44px]"
                >
                  Add
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Simulates creating a fixed appointment in Google Calendar; imported as a fixed commitment.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

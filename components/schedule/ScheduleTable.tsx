'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  CheckCircle2, 
  Clock, 
  Star, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  ChevronDown,
  Check
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType, ScheduleStatus } from '@/lib/types';
import { formatTime12Hour, getCurrentTimeString, parseTimeToMinutes } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleTableProps {
  onEditBlock: (entry: ScheduleEntry) => void;
  onRescheduleBlock: (entry: ScheduleEntry) => void;
}

export function ScheduleTable({ onEditBlock, onRescheduleBlock }: ScheduleTableProps) {
  const { 
    currentDayScheduleEntries,
    selectedScheduleDate,
    settings,
    startScheduleBlock,
    stopScheduleBlock,
    updateScheduleEntry,
    deleteScheduleEntry,
    currentScheduleBlock,
    nextScheduleBlock,
    projects,
    tasks
  } = useStore();

  const [confirmTaskDoneModal, setConfirmTaskDoneModal] = useState<{ entryId: string; taskId: string; taskTitle: string } | null>(null);
  const [inlineEditingRemarksId, setInlineEditingRemarksId] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedScheduleDate === todayStr;
  const currentTimeStr = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');
  const currentMins = parseTimeToMinutes(currentTimeStr);

  const getActivityBadgeColor = (type: ScheduleActivityType) => {
    switch (type) {
      case 'SCHOOL':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'TUITION':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'CLASSES':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'DESIGNOIA':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'COL':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'CLIKIXPRESS':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEETING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ADMIN':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'REST':
      case 'BUFFER':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500">✓ Done</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400 animate-pulse">● Live</span>;
      case 'MISSED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">Missed</span>;
      case 'RESCHEDULED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">Rescheduled</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground line-through">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Planned</span>;
    }
  };

  const calculateVarianceDisplay = (entry: ScheduleEntry) => {
    if (!entry.actualStartTime) return null;
    
    // Variance calculation
    if (entry.actualDurationMinutes !== undefined) {
      const diff = entry.actualDurationMinutes - entry.plannedDurationMinutes;
      if (diff === 0) {
        return <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Exact</span>;
      }
      if (diff > 0) {
        return <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">+{diff}m</span>;
      }
      return <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{diff}m</span>;
    }

    return null;
  };

  const handleStopClick = (entry: ScheduleEntry) => {
    if (entry.taskId) {
      const task = tasks.find(t => t.id === entry.taskId);
      if (task && task.status !== 'DONE') {
        setConfirmTaskDoneModal({
          entryId: entry.id,
          taskId: task.id,
          taskTitle: task.title,
        });
        return;
      }
    }
    stopScheduleBlock(entry.id);
  };

  const handleSaveRemarks = (entryId: string) => {
    updateScheduleEntry(entryId, { remarks: remarksDraft });
    setInlineEditingRemarksId(null);
  };

  return (
    <div className="space-y-4">
      {/* Tabular Schedule Container */}
      <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card/40 shadow-sm backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <th className="py-3.5 px-4 w-44">Time / Duration</th>
              <th className="py-3.5 px-4 min-w-[220px]">Planned</th>
              <th className="py-3.5 px-4 min-w-[200px]">Actual Execution</th>
              <th className="py-3.5 px-4 w-36">Activity / Purpose</th>
              <th className="py-3.5 px-4 min-w-[160px]">Remarks / Context</th>
              <th className="py-3.5 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border/40 text-xs">
            {currentDayScheduleEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-sm text-foreground">No Schedule Entries for this Date</p>
                  <p className="text-xs text-muted-foreground mt-1">Click &quot;Plan Tomorrow&quot; or &quot;+ Add Block&quot; to generate your schedule.</p>
                </td>
              </tr>
            ) : (
              currentDayScheduleEntries.map((entry, index) => {
                const isNow = currentScheduleBlock?.id === entry.id;
                const isUpNext = nextScheduleBlock?.id === entry.id;
                const isLive = entry.status === 'IN_PROGRESS';
                const isDone = entry.status === 'COMPLETED';

                // Check if current time line should be displayed before this row
                const entryStartMins = parseTimeToMinutes(entry.plannedStartTime);
                const showCurrentTimeLine = isToday && index === 0 && currentMins < entryStartMins;

                const taskLinked = entry.taskId ? tasks.find(t => t.id === entry.taskId) : null;
                const projectLinked = entry.projectId ? projects.find(p => p.id === entry.projectId) : null;

                return (
                  <React.Fragment key={entry.id}>
                    {/* Live Time Indicator Line if between slots */}
                    {isToday && index > 0 && (
                      (() => {
                        const prevEntry = currentDayScheduleEntries[index - 1];
                        const prevEndMins = parseTimeToMinutes(prevEntry.plannedEndTime);
                        if (currentMins >= prevEndMins && currentMins < entryStartMins) {
                          return (
                            <tr key={`time-line-${entry.id}`} className="bg-primary/5">
                              <td colSpan={6} className="py-1 px-4">
                                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-primary">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                  <span>─── CURRENT TIME {formatTime12Hour(currentTimeStr)} ───</span>
                                  <div className="flex-1 h-px bg-primary/30" />
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return null;
                      })()
                    )}

                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`group transition-colors ${
                        isNow 
                          ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' 
                          : isUpNext 
                          ? 'bg-primary/5 border-l-4 border-l-primary' 
                          : entry.isMustWin
                          ? 'bg-amber-500/5'
                          : 'hover:bg-accent/40'
                      }`}
                    >
                      {/* 1. TIME / DURATION */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-foreground text-xs flex items-center gap-1.5">
                            <span>{entry.plannedStartTime} – {entry.plannedEndTime}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground font-semibold">
                              {entry.plannedDurationMinutes} min
                            </span>

                            {isNow && (
                              <span className="rounded-full bg-emerald-500 text-emerald-950 font-bold px-2 py-0.2 text-[9px] uppercase tracking-wider animate-pulse">
                                NOW
                              </span>
                            )}

                            {isUpNext && (
                              <span className="rounded-full bg-primary/20 text-primary font-bold px-2 py-0.2 text-[9px] uppercase tracking-wider">
                                UP NEXT
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. PLANNED */}
                      <td className="py-3 px-4 align-top">
                        <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-1.5 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-xs font-bold leading-tight ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {entry.title}
                            </h4>

                            {entry.isMustWin && (
                              <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400" />
                                <span>MUST-WIN</span>
                              </span>
                            )}
                          </div>

                          {entry.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {entry.description}
                            </p>
                          )}

                          {/* Task/Project Reference Pill */}
                          {(taskLinked || projectLinked) && (
                            <div className="pt-1 flex items-center gap-1 text-[10px] text-primary/90 font-medium">
                              <LinkIcon className="h-2.5 w-2.5" />
                              <span className="truncate">
                                {projectLinked?.name} {taskLinked ? `→ ${taskLinked.title}` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. ACTUAL EXECUTION */}
                      <td className="py-3 px-4 align-top">
                        <div className={`rounded-2xl border p-3 space-y-2 transition-all ${
                          isLive 
                            ? 'border-emerald-500/50 bg-emerald-500/15 ring-1 ring-emerald-500/30 shadow-md' 
                            : entry.actualStartTime 
                            ? 'border-border/90 bg-card/90 shadow-sm' 
                            : 'border-dashed border-border/50 bg-muted/20'
                        }`}>
                          {/* Live Running State */}
                          {isLive ? (
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                  ● Live Recording
                                </span>
                                <span className="font-mono font-bold text-foreground text-xs">
                                  {entry.actualStartTime} – now
                                </span>
                              </div>

                              <button
                                onClick={() => handleStopClick(entry)}
                                className="flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600 shadow-sm transition-all"
                              >
                                <Square className="h-3 w-3 fill-current" />
                                <span>STOP</span>
                              </button>
                            </div>
                          ) : entry.actualStartTime ? (
                            /* Recorded Actual State */
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-foreground text-xs">
                                  {entry.actualStartTime} – {entry.actualEndTime || '...'}
                                </span>
                                {calculateVarianceDisplay(entry)}
                              </div>

                              {entry.actualDurationMinutes !== undefined && (
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  Duration: <strong className="text-foreground">{entry.actualDurationMinutes}m</strong> (Planned: {entry.plannedDurationMinutes}m)
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Unrecorded / Planned State */
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-muted-foreground italic">
                                [ Not recorded ]
                              </span>

                              {isToday && (
                                <button
                                  onClick={() => startScheduleBlock(entry.id)}
                                  className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>START</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. ACTIVITY / PURPOSE */}
                      <td className="py-3 px-4 align-top">
                        <span className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-bold ${getActivityBadgeColor(entry.activityType)}`}>
                          {entry.activityType}
                        </span>
                      </td>

                      {/* 5. REMARKS / CONTEXT */}
                      <td className="py-3 px-4 align-top">
                        {inlineEditingRemarksId === entry.id ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={remarksDraft}
                              onChange={(e) => setRemarksDraft(e.target.value)}
                              placeholder="e.g. Delayed 10 min, Meeting extended"
                              className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveRemarks(entry.id)}
                                className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setInlineEditingRemarksId(null)}
                                className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setInlineEditingRemarksId(entry.id);
                              setRemarksDraft(entry.remarks || '');
                            }}
                            className="cursor-pointer group/rem rounded-xl p-2 hover:bg-accent/50 border border-transparent hover:border-border transition-all min-h-[36px]"
                            title="Click to edit remarks"
                          >
                            {entry.remarks ? (
                              <p className="text-xs text-foreground/90 italic leading-relaxed">
                                &quot;{entry.remarks}&quot;
                              </p>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/60 group-hover/rem:text-muted-foreground">
                                + Add remarks...
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 6. ACTIONS */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Status Toggle */}
                          <select
                            value={entry.status}
                            onChange={(e) => updateScheduleEntry(entry.id, { status: e.target.value as ScheduleStatus })}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="MISSED">Missed</option>
                            <option value="RESCHEDULED">Rescheduled</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditBlock(entry)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Edit Block"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {/* Reschedule Button */}
                          <button
                            onClick={() => onRescheduleBlock(entry)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Reschedule Block"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteScheduleEntry(entry.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Block"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* TASK COMPLETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmTaskDoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">Schedule Block Finished</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mark linked task <strong className="text-foreground">&quot;{confirmTaskDoneModal.taskTitle}&quot;</strong> as completed too?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    stopScheduleBlock(confirmTaskDoneModal.entryId, undefined, true);
                    setConfirmTaskDoneModal(null);
                  }}
                  className="rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  Yes, Mark Done
                </button>
                <button
                  onClick={() => {
                    stopScheduleBlock(confirmTaskDoneModal.entryId, undefined, false);
                    setConfirmTaskDoneModal(null);
                  }}
                  className="rounded-xl border border-border bg-muted/60 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  No, Keep Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

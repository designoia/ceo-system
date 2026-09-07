'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Clock, 
  Star, 
  Edit3, 
  Trash2, 
  Calendar, 
  Plus,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType, ScheduleStatus } from '@/lib/types';
import { formatTime12Hour, getCurrentTimeString } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleMobileCardsProps {
  onEditBlock: (entry: ScheduleEntry) => void;
  onRescheduleBlock: (entry: ScheduleEntry) => void;
  onAddNewBlock: () => void;
}

export function ScheduleMobileCards({ onEditBlock, onRescheduleBlock, onAddNewBlock }: ScheduleMobileCardsProps) {
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
    tasks,
    setPlanTomorrowOpen,
    setScheduleReviewOpen
  } = useStore();

  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [confirmTaskDoneModal, setConfirmTaskDoneModal] = useState<{ entryId: string; taskId: string; taskTitle: string } | null>(null);
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedScheduleDate === todayStr;
  const currentTimeStr = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');

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
    setEditingRemarksId(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Live Current Time Header (Mobile) */}
      {isToday && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            <span>NOW: {formatTime12Hour(currentTimeStr)}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Today&apos;s Live Timeline</span>
        </div>
      )}

      {/* Cards List */}
      {currentDayScheduleEntries.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card/60 p-8 text-center text-muted-foreground space-y-3">
          <Clock className="h-8 w-8 mx-auto opacity-30" />
          <p className="font-semibold text-sm text-foreground">No Schedule Entries</p>
          <p className="text-xs text-muted-foreground">Tap the + button below or Plan Tomorrow.</p>
        </div>
      ) : (
        currentDayScheduleEntries.map((entry) => {
          const isNow = currentScheduleBlock?.id === entry.id;
          const isUpNext = nextScheduleBlock?.id === entry.id;
          const isLive = entry.status === 'IN_PROGRESS';
          const isDone = entry.status === 'COMPLETED';
          const taskLinked = entry.taskId ? tasks.find(t => t.id === entry.taskId) : null;
          const projectLinked = entry.projectId ? projects.find(p => p.id === entry.projectId) : null;

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl border p-4 space-y-3.5 transition-all shadow-sm ${
                isNow 
                  ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30' 
                  : isUpNext 
                  ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' 
                  : entry.isMustWin
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-border/80 bg-card/60'
              }`}
            >
              {/* Header: Time, Badges, Status */}
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-xs">
                    {entry.plannedStartTime} – {entry.plannedEndTime}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground font-semibold">
                    {entry.plannedDurationMinutes}m
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

                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${getActivityBadgeColor(entry.activityType)}`}>
                  {entry.activityType}
                </span>
              </div>

              {/* PLANNED CARD */}
              <div className="rounded-2xl border border-border/60 bg-background/50 p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    PLANNED
                  </div>
                  {entry.isMustWin && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-extrabold text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      <span>MUST-WIN</span>
                    </span>
                  )}
                </div>

                <h4 className={`text-xs font-bold ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {entry.title}
                </h4>

                {entry.description && (
                  <p className="text-[11px] text-muted-foreground">
                    {entry.description}
                  </p>
                )}

                {(taskLinked || projectLinked) && (
                  <div className="pt-1 flex items-center gap-1 text-[10px] text-primary font-medium">
                    <LinkIcon className="h-2.5 w-2.5" />
                    <span className="truncate">
                      {projectLinked?.name} {taskLinked ? `→ ${taskLinked.title}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* ACTUAL CARD */}
              <div className={`rounded-2xl border p-3 space-y-2 transition-all ${
                isLive 
                  ? 'border-emerald-500/50 bg-emerald-500/15' 
                  : entry.actualStartTime 
                  ? 'border-border/80 bg-card/90' 
                  : 'border-dashed border-border/50 bg-muted/10'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>ACTUAL EXECUTION</span>
                  {entry.actualDurationMinutes !== undefined && (
                    <span className="font-mono text-[10px] font-bold text-foreground">
                      {entry.actualDurationMinutes}m logged
                    </span>
                  )}
                </div>

                {isLive ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono font-bold text-foreground text-xs">
                      {entry.actualStartTime} – live
                    </div>
                    <button
                      onClick={() => handleStopClick(entry)}
                      className="flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      <Square className="h-3 w-3 fill-current" />
                      <span>STOP</span>
                    </button>
                  </div>
                ) : entry.actualStartTime ? (
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-foreground">
                    <span>{entry.actualStartTime} – {entry.actualEndTime || '...'}</span>
                    {entry.actualDurationMinutes !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        entry.actualDurationMinutes > entry.plannedDurationMinutes
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {entry.actualDurationMinutes > entry.plannedDurationMinutes
                          ? `+${entry.actualDurationMinutes - entry.plannedDurationMinutes}m`
                          : `${entry.actualDurationMinutes - entry.plannedDurationMinutes}m`}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground italic">
                      [ Not recorded ]
                    </span>
                    {isToday && (
                      <button
                        onClick={() => startScheduleBlock(entry.id)}
                        className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>START</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* REMARKS */}
              {editingRemarksId === entry.id ? (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={remarksDraft}
                    onChange={(e) => setRemarksDraft(e.target.value)}
                    placeholder="Remarks / why plan changed..."
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSaveRemarks(entry.id)}
                      className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingRemarksId(null)}
                      className="rounded-md bg-muted px-2.5 py-1 text-[10px] text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setEditingRemarksId(entry.id);
                    setRemarksDraft(entry.remarks || '');
                  }}
                  className="rounded-xl border border-transparent hover:border-border p-2 bg-muted/20 text-xs text-muted-foreground italic cursor-pointer"
                >
                  {entry.remarks ? `"${entry.remarks}"` : '+ Tap to add remarks/context...'}
                </div>
              )}

              {/* Bottom Quick Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
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

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditBlock(entry)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRescheduleBlock(entry)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                    title="Reschedule"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteScheduleEntry(entry.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })
      )}

      {/* FLOATING ACTION BUTTON (FAB) FOR MOBILE */}
      <div className="fixed bottom-20 right-4 z-40 sm:hidden">
        <AnimatePresence>
          {isFabMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              className="absolute bottom-14 right-0 w-48 rounded-2xl border border-border bg-card p-2 shadow-2xl space-y-1 backdrop-blur-md"
            >
              <button
                onClick={() => {
                  setIsFabMenuOpen(false);
                  onAddNewBlock();
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Add Schedule Block</span>
              </button>

              <button
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setPlanTomorrowOpen(true);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Plan Tomorrow</span>
              </button>

              <button
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setScheduleReviewOpen(true);
                }}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Day Review</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
          aria-label="Quick Actions"
        >
          <Plus className={`h-6 w-6 transition-transform duration-200 ${isFabMenuOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* TASK COMPLETION MODAL */}
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
                <h3 className="text-base font-bold text-foreground">Block Completed</h3>
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
                  className="rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm"
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

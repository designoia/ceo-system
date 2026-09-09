'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Star, 
  Check, 
  Link as LinkIcon, 
  Bell, 
  Edit3, 
  FileText 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleEntry, ScheduleActivityType, ScheduleStatus } from '@/lib/types';
import { calculateMinutesBetween, getCurrentTimeString } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { DESIGNOIA_MOTION } from '@/lib/motion';
import { ChevronDown } from 'lucide-react';

export function ScheduleBlockModal() {
  const {
    isAddBlockModalOpen,
    setAddBlockModalOpen,
    editingScheduleEntry,
    selectedScheduleDate,
    tasks,
    projects,
    addScheduleEntry,
    updateScheduleEntry,
    settings
  } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedScheduleDate);
  const [plannedStartTime, setPlannedStartTime] = useState('08:00');
  const [plannedEndTime, setPlannedEndTime] = useState('08:45');
  const [activityType, setActivityType] = useState<ScheduleActivityType>('DESIGNOIA');
  const [taskId, setTaskId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [isMustWin, setIsMustWin] = useState(false);
  const [status, setStatus] = useState<ScheduleStatus>('PLANNED');
  const [remarks, setRemarks] = useState('');
  const [actualStartTime, setActualStartTime] = useState('');
  const [actualEndTime, setActualEndTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(undefined);
  const [showMore, setShowMore] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setShowMore(Boolean(editingScheduleEntry) || !isMobile);
    if (editingScheduleEntry) {
      setTitle(editingScheduleEntry.title);
      setDescription(editingScheduleEntry.description || '');
      setDate(editingScheduleEntry.date);
      setPlannedStartTime(editingScheduleEntry.plannedStartTime);
      setPlannedEndTime(editingScheduleEntry.plannedEndTime);
      setActivityType(editingScheduleEntry.activityType);
      setTaskId(editingScheduleEntry.taskId || '');
      setProjectId(editingScheduleEntry.projectId || '');
      setIsMustWin(editingScheduleEntry.isMustWin || false);
      setStatus(editingScheduleEntry.status);
      setRemarks(editingScheduleEntry.remarks || '');
      setActualStartTime(editingScheduleEntry.actualStartTime || '');
      setActualEndTime(editingScheduleEntry.actualEndTime || '');
      setReminderMinutes(editingScheduleEntry.reminderMinutesBefore);
    } else {
      setTitle('');
      setDescription('');
      setDate(selectedScheduleDate);
      const nowStr = getCurrentTimeString(settings.timezone || 'Asia/Kolkata');
      setPlannedStartTime(nowStr);
      setPlannedEndTime('23:59');
      setActivityType('DESIGNOIA');
      setTaskId('');
      setProjectId('');
      setIsMustWin(false);
      setStatus('PLANNED');
      setRemarks('');
      setActualStartTime('');
      setActualEndTime('');
      setReminderMinutes(undefined);
    }
  }, [editingScheduleEntry, selectedScheduleDate, isAddBlockModalOpen, settings.timezone]);

  if (!isAddBlockModalOpen) return null;

  const duration = calculateMinutesBetween(plannedStartTime, plannedEndTime);

  const handleTaskSelected = (selectedId: string) => {
    setTaskId(selectedId);
    if (!selectedId) return;
    const task = tasks.find(t => t.id === selectedId);
    if (task) {
      if (!title) setTitle(task.title);
      if (task.projectId) setProjectId(task.projectId);
      if (task.businessCode) setActivityType(task.businessCode as ScheduleActivityType);
      if (task.isMustWin) setIsMustWin(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const entryData = {
      date,
      plannedStartTime,
      plannedEndTime,
      plannedDurationMinutes: duration,
      title: title.trim(),
      description: description.trim() || undefined,
      activityType,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      isMustWin,
      status,
      remarks: remarks.trim() || undefined,
      actualStartTime: actualStartTime || undefined,
      actualEndTime: actualEndTime || undefined,
      actualDurationMinutes: actualStartTime && actualEndTime ? calculateMinutesBetween(actualStartTime, actualEndTime) : undefined,
      reminderMinutesBefore: reminderMinutes,
    };

    if (editingScheduleEntry) {
      updateScheduleEntry(editingScheduleEntry.id, entryData);
    } else {
      addScheduleEntry(entryData);
    }

    setAddBlockModalOpen(false);
  };

  const durationOptions = [15, 25, 30, 45, 60, 90, 120];

  return (
    <AnimatePresence>
      {isMobile ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setAddBlockModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/50"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) setAddBlockModalOpen(false);
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={DESIGNOIA_MOTION.bottomSheet}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] surface-1 border-t border-border shadow-2xl flex flex-col rounded-t-2xl"
          >
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="h-1 w-9 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <h3 className="text-base font-semibold text-foreground">
                {editingScheduleEntry ? 'Edit Block' : 'Add Block'}
              </h3>
              <button
                onClick={() => setAddBlockModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-[env(safe-area-inset-bottom,20px)]">
              {formBody()}
            </div>
          </motion.div>
        </>
      ) : (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingScheduleEntry ? 'Edit Schedule Block' : 'Add Schedule Block'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Allocate a dedicated execution window without duplicating tasks.
                </p>
              </div>
            </div>

            <button
              onClick={() => setAddBlockModalOpen(false)}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formBody()}
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );

  function formBody() {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title — primary field 1: What? */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Block Title / What Intended *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Plato International Meeting, Prorido Homepage..."
                required
                autoFocus={isMobile && !editingScheduleEntry}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Time Window & Duration — primary field 2: When? */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Start Time
                </label>
                <input
                  type="time"
                  value={plannedStartTime}
                  onChange={(e) => setPlannedStartTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {isMobile ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => {
                      const mins = Number(e.target.value);
                      const [h, m] = plannedStartTime.split(':').map(Number);
                      const endTotal = h * 60 + m + mins;
                      setPlannedEndTime(`${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {durationOptions.map((m) => (
                      <option key={m} value={m}>{m} min</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={plannedEndTime}
                    onChange={(e) => setPlannedEndTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {isMobile ? 'Ends' : 'Duration'}
                </label>
                <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono font-bold text-foreground flex items-center justify-center">
                  {isMobile ? plannedEndTime : `${duration} min`}
                </div>
              </div>
            </div>

            {/* Primary flow ends here on mobile — everything else is optional */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="w-full flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>More options</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </button>
            )}

            {showMore && (
              <div className="space-y-4">
                {/* Activity Type & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Activity / Purpose
                    </label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as ScheduleActivityType)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="SCHOOL">School</option>
                      <option value="TUITION">Tuition</option>
                      <option value="CLASSES">Classes</option>
                      <option value="DESIGNOIA">Designoia</option>
                      <option value="COL">COL</option>
                      <option value="CLIKIXPRESS">Clikixpress</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="MEETING">Meeting</option>
                      <option value="ADMIN">Administration</option>
                      <option value="DEVELOPMENT">Development</option>
                      <option value="CONTENT">Content</option>
                      <option value="PLANNING">Planning</option>
                      <option value="TRAVEL">Travel</option>
                      <option value="REST">Rest</option>
                      <option value="BUFFER">Buffer</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="MISSED">Missed</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Task Link (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Link Existing Task (Optional)</span>
                  </label>
                  <select
                    value={taskId}
                    onChange={(e) => handleTaskSelected(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="">-- No Task Linked --</option>
                    {tasks.filter(t => !t.isDeleted).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.businessCode}: {t.title} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* MUST-WIN Checkbox */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/60 p-3">
                  <input
                    type="checkbox"
                    id="modal-must-win-checkbox"
                    checked={isMustWin}
                    onChange={(e) => setIsMustWin(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="modal-must-win-checkbox" className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Star className={`h-3.5 w-3.5 ${isMustWin ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                    <span>Mark as MUST-WIN Priority Block</span>
                  </label>
                </div>

                {/* Actual Times (Manual Reconciliation) */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Manual Actual Times (Optional)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Actual Start</span>
                      <input
                        type="time"
                        value={actualStartTime}
                        onChange={(e) => setActualStartTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Actual End</span>
                      <input
                        type="time"
                        value={actualEndTime}
                        onChange={(e) => setActualEndTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Remarks / Why it changed
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Meeting started 10 min late, Worked on website instead..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Footer Buttons — Done */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border pb-2">
              <button
                type="button"
                onClick={() => setAddBlockModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>{editingScheduleEntry ? 'Save Changes' : 'Add Block'}</span>
              </button>
            </div>
      </form>
    );
  }
}

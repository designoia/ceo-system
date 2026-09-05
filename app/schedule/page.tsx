'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Rocket, 
  Briefcase, 
  GraduationCap, 
  Moon, 
  Plus, 
  Sparkles,
  Edit2,
  Check
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduleBlock } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { TodayIsDifferentModal } from '@/components/dashboard/TodayIsDifferentModal';

export default function SchedulePage() {
  const { 
    scheduleBlocks, 
    updateScheduleBlock, 
    settings, 
    updateSettings, 
    tasks, 
    startFocus,
    scheduleOverrides,
    todayCapacityMinutes,
    setTodayDifferentModalOpen
  } = useStore();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const scheduledTasks = tasks.filter((t) => t.status === 'TODAY' || t.isMustWin);

  const getCategoryIcon = (category: ScheduleBlock['category']) => {
    switch (category) {
      case 'SCHOOL': return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'TUITION': return <GraduationCap className="h-4 w-4 text-amber-500" />;
      case 'CLASSES': return <GraduationCap className="h-4 w-4 text-purple-500" />;
      case 'REST': return <Moon className="h-4 w-4 text-muted-foreground" />;
      case 'CEO_BLOCK': return <Rocket className="h-4 w-4 text-emerald-500" />;
    }
  };

  const handleStartEdit = (b: ScheduleBlock) => {
    setEditingBlockId(b.id);
    setEditStartTime(b.startTime);
    setEditEndTime(b.endTime);
  };

  const handleSaveEdit = (b: ScheduleBlock) => {
    updateScheduleBlock(b.id, {
      startTime: editStartTime,
      endTime: editEndTime,
    });
    if (b.isCeoTime) {
      updateSettings({
        ceoBlockStart: editStartTime,
        ceoBlockEnd: editEndTime,
      });
    }
    setEditingBlockId(null);
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            EXECUTION REALITY
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Daily Schedule & Windows
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Default weekly schedule acts as a baseline. Single-day variations adjust today without changing your recurring routine.
          </p>
        </div>

        {/* Realistic Time Summary */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs flex items-center gap-3">
          <div>
            <span className="text-muted-foreground block text-[11px]">Today&apos;s Available Window:</span>
            <span className="font-bold text-foreground">
              {todayCapacityMinutes} min available ({settings.ceoBlockStart} – {settings.ceoBlockEnd})
            </span>
          </div>
          <button
            onClick={() => setTodayDifferentModalOpen(true)}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm transition-all"
          >
            Today is Different
          </button>
        </div>
      </div>

      {/* TODAY'S ACTIVE OVERRIDES (IF ANY) */}
      {scheduleOverrides.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Active Single-Day Overrides (Today Only)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {scheduleOverrides.map(o => (
              <span key={o.id} className="rounded-xl border border-border bg-card px-3 py-1.5 font-medium text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{o.blockType}: {o.isOff ? 'OFF' : 'Modified'} ({o.availableMinutesDelta > 0 ? `+${o.availableMinutesDelta}m free` : ''})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Timeline */}
      <div className="space-y-3">
        {scheduleBlocks.map((block: ScheduleBlock) => {
          const isEditing = editingBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 transition-all ${
                block.isCeoTime
                  ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-md'
                  : 'border-border bg-card/60'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                    block.isCeoTime ? 'bg-emerald-500/20' : 'bg-muted'
                  }`}
                >
                  {getCategoryIcon(block.category)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {block.name}
                    </h3>
                    {block.isCeoTime && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                        Protected CEO Window
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {block.description}
                  </p>
                </div>
              </div>

              {/* Right Timing & Edit Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground font-mono"
                    />
                    <span className="text-xs text-muted-foreground">–</span>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground font-mono"
                    />
                    <button
                      onClick={() => handleSaveEdit(block)}
                      className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-foreground bg-background/80 px-3 py-1.5 rounded-lg border border-border">
                      {block.startTime} – {block.endTime}
                    </span>

                    <button
                      onClick={() => handleStartEdit(block)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      title="Adjust times"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tonight's Scheduled Execution Window */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-foreground">
              Tonight's Work Allocation ({settings.ceoBlockStart} – {settings.ceoBlockEnd})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">45 Minutes Max</span>
        </div>

        <div className="space-y-2">
          {scheduledTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-foreground">{task.title}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({task.estimatedMinutes}m)
                </span>
              </div>

              <button
                onClick={() => startFocus(task, 'NORMAL')}
                className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                Start
              </button>
            </div>
          ))}
        </div>
      </div>

      <TodayIsDifferentModal />
    </PageTransition>
  );
}

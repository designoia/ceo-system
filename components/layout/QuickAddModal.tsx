'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Zap, Target } from 'lucide-react';
import { useStore } from '@/lib/store';
import { BusinessCode, TaskPriority, TaskStatus } from '@/lib/types';

export function QuickAddModal() {
  const { isQuickAddOpen, setQuickAddOpen, addTask, businesses, projects } = useStore();
  const [title, setTitle] = useState('');
  const [businessCode, setBusinessCode] = useState<BusinessCode>('COL');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('P1');
  const [status, setStatus] = useState<TaskStatus>('INBOX');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickAddOpen(!isQuickAddOpen);
      }
      if (e.key === 'Escape' && isQuickAddOpen) {
        setQuickAddOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickAddOpen, setQuickAddOpen]);

  useEffect(() => {
    if (isQuickAddOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle('');
      setShowAdvanced(false);
    }
  }, [isQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = (targetStatus: TaskStatus = status, isMustWin = false) => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      businessCode,
      projectId: projectId || undefined,
      priority,
      status: targetStatus,
      isMustWin,
      estimatedMinutes,
    });

    setTitle('');
    setQuickAddOpen(false);
  };

  const filteredProjects = projects.filter((p) => p.businessCode === businessCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">Quick Capture</h2>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit('INBOX', false);
          }}
          className="space-y-4"
        >
          <div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done? (e.g. Finish 10th Notes)"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick toggle metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-muted-foreground hover:text-foreground font-medium underline underline-offset-4"
            >
              {showAdvanced ? 'Simple view' : '+ Add business / project / time'}
            </button>

            <span className="text-[11px] text-muted-foreground">Press Enter to save to Inbox</span>
          </div>

          {/* Advanced fields (Optional) */}
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs animate-in slide-in-from-top-2 duration-150">
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">Business</label>
                <select
                  value={businessCode}
                  onChange={(e) => {
                    setBusinessCode(e.target.value as BusinessCode);
                    setProjectId('');
                  }}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  {businesses.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted-foreground">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="">No Project</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  <option value="P1">P1 (Critical)</option>
                  <option value="P2">P2 (Important)</option>
                  <option value="P3">P3 (Routine)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted-foreground">Estimated Time</label>
                <select
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none"
                >
                  <option value={10}>10 min (Rescue)</option>
                  <option value={25}>25 min (Short)</option>
                  <option value={45}>45 min (CEO Block)</option>
                  <option value={60}>60 min (Deep Work)</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => handleSubmit('TODAY', true)}
              disabled={!title.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              <Target className="h-3.5 w-3.5" />
              <span>Set as MUST-WIN</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('TODAY', false)}
              disabled={!title.trim()}
              className="rounded-lg border border-border bg-accent px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/80 disabled:opacity-50 transition-colors"
            >
              Do Today
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              <span>Save to Inbox</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

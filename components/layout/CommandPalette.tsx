'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, FolderKanban, CheckCircle2, Circle, Calendar, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { Task, TaskStatus } from '@/lib/types';

const MOVE_TARGETS: { value: TaskStatus; label: string }[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'NEXT', label: 'Next Up' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'INBOX', label: 'Inbox' },
];

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  task?: Task;
};

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setQuickAddOpen,
    tasks,
    projects,
    completeTask,
    undoTaskCompletion,
    updateTaskStatus,
    openScheduleModal,
    addTask,
  } = useStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isCommandPaletteOpen]);

  const close = () => setCommandPaletteOpen(false);

  const items: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: PaletteItem[] = [];

    if (q) {
      result.push({
        id: 'add-task',
        label: `Add task "${query.trim()}"`,
        hint: 'Enter',
        icon: <Plus className="h-4 w-4" />,
        action: () => {
          addTask({ title: query.trim(), businessCode: 'COL', priority: 'P2', status: 'INBOX' });
          close();
        },
      });
    } else {
      result.push({
        id: 'add-task-open',
        label: 'Add task…',
        icon: <Plus className="h-4 w-4" />,
        action: () => {
          close();
          setQuickAddOpen(true);
        },
      });
      result.push({
        id: 'create-project',
        label: 'Create project…',
        icon: <FolderKanban className="h-4 w-4" />,
        action: () => {
          close();
          router.push('/projects?new=1');
        },
      });
    }

    const matchedTasks = tasks
      .filter((t) => !t.isDeleted && !t.parentTaskId)
      .filter((t) => (q ? t.title.toLowerCase().includes(q) : t.status === 'TODAY'))
      .slice(0, 6);

    for (const t of matchedTasks) {
      result.push({
        id: `task-${t.id}`,
        label: t.title,
        hint: t.status === 'DONE' ? 'Done' : t.status,
        icon: t.status === 'DONE' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />,
        action: () => {
          close();
          setDrawerTask(t);
        },
        task: t,
      });
    }

    const matchedProjects = q
      ? projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4)
      : [];

    for (const p of matchedProjects) {
      result.push({
        id: `project-${p.id}`,
        label: p.name,
        hint: 'Open project',
        icon: <FolderKanban className="h-4 w-4" />,
        action: () => {
          close();
          router.push('/projects');
        },
      });
    }

    return result;
  }, [query, tasks, projects, addTask, router, setQuickAddOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selectedIndex]?.action();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={close}
              className="fixed inset-0 z-[60] bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-[18%] z-[60] w-full max-w-lg -translate-x-1/2 rounded-xl border border-border surface-2 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDownInput}
                  placeholder="Search tasks, projects, or type a command…"
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <kbd className="text-[10px] text-muted-foreground/60 font-mono border border-border rounded px-1.5 py-0.5">
                  Esc
                </kbd>
              </div>

              <div className="max-h-[360px] overflow-y-auto py-1.5">
                {items.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">No matches</div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                        idx === selectedIndex ? 'bg-secondary' : ''
                      }`}
                    >
                      {item.task ? (
                        <button
                          onClick={() =>
                            item.task!.status === 'DONE'
                              ? undoTaskCompletion(item.task!.id)
                              : completeTask(item.task!.id, item.task!.estimatedMinutes)
                          }
                          title="Complete"
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        >
                          {item.icon}
                        </button>
                      ) : (
                        <span className="text-muted-foreground shrink-0">{item.icon}</span>
                      )}

                      <button onClick={() => item.action()} className="flex-1 min-w-0 text-left">
                        <span className="text-[13px] text-foreground truncate block">{item.label}</span>
                      </button>

                      {item.task && (
                        <>
                          <button
                            onClick={() => openScheduleModal(item.task!)}
                            title="Schedule"
                            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
                          <select
                            value={item.task.status}
                            onChange={(e) => updateTaskStatus(item.task!.id, e.target.value as TaskStatus)}
                            title="Move"
                            className="bg-transparent text-[10px] text-muted-foreground font-mono focus:outline-none shrink-0 max-w-[72px]"
                          >
                            {MOVE_TARGETS.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                            {!MOVE_TARGETS.some((m) => m.value === item.task!.status) && (
                              <option value={item.task.status}>{item.task.status}</option>
                            )}
                          </select>
                        </>
                      )}

                      {!item.task && item.hint && (
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">{item.hint}</span>
                      )}
                      {idx === selectedIndex && <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TaskDrawer
        task={drawerTask}
        onClose={() => setDrawerTask(null)}
        onSchedule={(t) => openScheduleModal(t)}
      />
    </>
  );
}

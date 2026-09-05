'use client';

import React, { useState } from 'react';
import { 
  FolderKanban, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Pause, 
  Play, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BusinessCode, Project, ProjectStatus, TaskPriority } from '@/lib/types';

export default function ProjectsPage() {
  const { 
    projects, 
    tasks, 
    businesses, 
    addProject, 
    updateProject, 
    deleteProject 
  } = useStore();

  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ACTIVE');
  const [showAddModal, setShowAddModal] = useState(false);

  // New project state
  const [name, setName] = useState('');
  const [businessCode, setBusinessCode] = useState<BusinessCode>('COL');
  const [description, setDescription] = useState('');
  const [successDefinition, setSuccessDefinition] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('P1');

  const activeProjectsCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const isOverloaded = activeProjectsCount > 4;

  const filteredProjects = filterStatus === 'ALL'
    ? projects
    : projects.filter((p) => p.status === filterStatus);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !successDefinition.trim()) return;

    addProject({
      name: name.trim(),
      businessCode,
      description: description.trim(),
      successDefinition: successDefinition.trim(),
      status: 'ACTIVE',
      priority,
    });

    setName('');
    setDescription('');
    setSuccessDefinition('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            EXECUTION VEHICLES
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Projects
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Meaningful business outcomes. Focused execution demands limiting active initiatives.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* OVERLOAD WARNING (if > 4 active projects) */}
      {isOverloaded && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500 animate-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block">
              You are currently running {activeProjectsCount} active projects.
            </span>
            <span>
              To preserve high execution velocity with limited daily CEO time, consider finishing or pausing some before starting another.
            </span>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['ACTIVE', 'PAUSED', 'COMPLETED', 'ALL'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {st === 'ALL' ? 'All Projects' : st}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((proj: Project) => {
          const biz = businesses.find((b) => b.code === proj.businessCode);
          const projTasks = tasks.filter((t) => t.projectId === proj.id);
          const doneTasks = projTasks.filter((t) => t.status === 'DONE').length;
          const totalTasks = projTasks.length;
          const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={proj.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card/60 p-5 space-y-4 hover:border-border/90 transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {proj.code}
                    </span>
                    {biz && (
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${biz.color}18`,
                          color: biz.color,
                        }}
                      >
                        {biz.name}
                      </span>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      proj.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : proj.status === 'PAUSED'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground">
                  {proj.name}
                </h3>

                {proj.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {proj.description}
                  </p>
                )}

                {/* Definition of Success */}
                <div className="mt-3 rounded-xl border border-border/80 bg-background/60 p-3 text-xs">
                  <span className="font-semibold text-primary block mb-0.5">
                    Success Definition:
                  </span>
                  <span className="text-foreground/90 font-medium">
                    {proj.successDefinition}
                  </span>
                </div>
              </div>

              {/* Progress & Controls */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tasks Progress</span>
                  <span className="font-mono font-semibold text-foreground">
                    {doneTasks} / {totalTasks} ({progress}%)
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    {proj.status === 'ACTIVE' ? (
                      <button
                        onClick={() => updateProject(proj.id, { status: 'PAUSED' })}
                        className="flex items-center gap-1 text-muted-foreground hover:text-amber-500"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateProject(proj.id, { status: 'ACTIVE' })}
                        className="flex items-center gap-1 text-muted-foreground hover:text-emerald-500"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Activate</span>
                      </button>
                    )}

                    {proj.status !== 'COMPLETED' && (
                      <button
                        onClick={() => updateProject(proj.id, { status: 'COMPLETED' })}
                        className="flex items-center gap-1 text-muted-foreground hover:text-emerald-500 ml-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    title="Delete Project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create New Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Designoia International Sales Engine"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-muted-foreground">Business</label>
                  <select
                    value={businessCode}
                    onChange={(e) => setBusinessCode(e.target.value as BusinessCode)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none"
                  >
                    {businesses.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none"
                  >
                    <option value="P1">P1 (Critical)</option>
                    <option value="P2">P2 (Important)</option>
                    <option value="P3">P3 (Routine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Success Definition * (When is this project truly done?)
                </label>
                <textarea
                  rows={2}
                  value={successDefinition}
                  onChange={(e) => setSuccessDefinition(e.target.value)}
                  placeholder="e.g. Landing page live, 10 discovery calls scheduled, and 1 client closed."
                  className="w-full rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Brief Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of outcome"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !successDefinition.trim()}
                  className="rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Sparkles,
  ChevronRight,
  Layers,
  ArrowRight,
  X,
  Target
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BusinessCode, Project, ProjectStatus, TaskPriority, Task } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';

export default function ProjectsPage() {
  const { 
    projects, 
    tasks, 
    businesses, 
    addProject, 
    updateProject, 
    deleteProject,
    getProjectProgress,
    getProjectSubprojects,
    getTopLevelProjects,
    activeTopLevelProjectsCount,
    activeSubprojectsCount
  } = useStore();

  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ACTIVE');
  const [filterBusiness, setFilterBusiness] = useState<BusinessCode | 'ALL'>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentForNewSubproject, setParentForNewSubproject] = useState<string | undefined>(undefined);

  // New project state
  const [name, setName] = useState('');
  const [businessCode, setBusinessCode] = useState<BusinessCode>('DESIGNOIA');
  const [parentProjectId, setParentProjectId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [successDefinition, setSuccessDefinition] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('P1');

  const isOverloaded = activeTopLevelProjectsCount > 4;

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !successDefinition.trim()) return;

    addProject({
      name: name.trim(),
      businessCode,
      parentProjectId: parentProjectId || undefined,
      description: description.trim(),
      successDefinition: successDefinition.trim(),
      status: 'ACTIVE',
      priority,
    });

    setName('');
    setDescription('');
    setSuccessDefinition('');
    setParentProjectId('');
    setShowAddModal(false);
  };

  const openAddSubproject = (parentProj: Project) => {
    setBusinessCode(parentProj.businessCode);
    setParentProjectId(parentProj.id);
    setShowAddModal(true);
  };

  const topLevelProjects = getTopLevelProjects().filter((p) => {
    const matchesStatus = filterStatus === 'ALL' ? true : p.status === filterStatus;
    const matchesBiz = filterBusiness === 'ALL' ? true : p.businessCode === filterBusiness;
    return matchesStatus && matchesBiz;
  });

  const businessesWithProjects = businesses.filter((b) => {
    if (filterBusiness !== 'ALL' && b.code !== filterBusiness) return false;
    return true;
  });

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            EXECUTION HIERARCHY
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Projects & Initiatives
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Business → Project → Optional Sub-Project. Progress automatically rolls up to parents.
          </p>
        </div>

        <button
          onClick={() => {
            setParentProjectId('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* OVERLOAD WARNING (if > 4 active top-level projects) */}
      {isOverloaded && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500 animate-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block">
              You currently have {activeTopLevelProjectsCount} active top-level initiatives ({activeSubprojectsCount} sub-projects).
            </span>
            <span>
              To preserve high execution velocity with limited daily CEO time, consider finishing or pausing some initiatives before starting another.
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Business Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <select
          value={filterBusiness}
          onChange={(e) => setFilterBusiness(e.target.value as BusinessCode | 'ALL')}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none self-start md:self-auto"
        >
          <option value="ALL">All Businesses</option>
          {businesses.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
      </div>

      {/* GROUPED HIERARCHY VIEW BY BUSINESS */}
      <div className="space-y-8">
        {businessesWithProjects.map((biz) => {
          const bizProjects = topLevelProjects.filter((p) => p.businessCode === biz.code);
          if (bizProjects.length === 0) return null;

          return (
            <div key={biz.code} className="space-y-4">
              {/* Business Section Header */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/80">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: biz.color }}
                />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                  {biz.name}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  ({bizProjects.length} {bizProjects.length === 1 ? 'initiative' : 'initiatives'})
                </span>
              </div>

              {/* Projects & Nested Sub-projects */}
              <div className="space-y-4">
                {bizProjects.map((parent) => {
                  const subprojects = getProjectSubprojects(parent.id);
                  const parentProgress = getProjectProgress(parent.id);
                  const directTasks = tasks.filter((t) => t.projectId === parent.id && !t.parentTaskId);

                  return (
                    <div
                      key={parent.id}
                      className="rounded-3xl border border-border bg-card/70 p-5 space-y-4 shadow-sm hover:border-border/90 transition-all"
                    >
                      {/* Parent Project Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {parent.code}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                                parent.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : parent.status === 'PAUSED'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {parent.status}
                            </span>
                          </div>

                          <h4 
                            onClick={() => setSelectedProject(parent)}
                            className="text-base font-extrabold text-foreground hover:text-primary cursor-pointer transition-colors"
                          >
                            {parent.name}
                          </h4>

                          {parent.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {parent.description}
                            </p>
                          )}
                        </div>

                        {/* Rollup Progress Bar & Quick Controls */}
                        <div className="flex items-center gap-4 sm:min-w-[200px] justify-between sm:justify-end">
                          <div className="flex-1 sm:max-w-[140px] space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-foreground">
                              <span>Rollup</span>
                              <span>{parentProgress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${parentProgress}%` }}
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => openAddSubproject(parent)}
                            title="Add Sub-Project (Max depth 2)"
                            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary transition-colors shrink-0"
                          >
                            + Sub-Project
                          </button>
                        </div>
                      </div>

                      {/* Success Definition Pill */}
                      <div className="rounded-2xl border border-border/60 bg-background/50 p-3 text-xs">
                        <span className="font-semibold text-primary block mb-0.5">
                          Success Definition:
                        </span>
                        <span className="text-foreground/90 font-medium">
                          {parent.successDefinition}
                        </span>
                      </div>

                      {/* NESTED SUB-PROJECTS (LEVEL 2) */}
                      {subprojects.length > 0 && (
                        <div className="pl-4 sm:pl-6 border-l-2 border-primary/20 space-y-2.5 pt-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Sub-Projects ({subprojects.length}):
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subprojects.map((sub) => {
                              const subProgress = getProjectProgress(sub.id);
                              const subTasks = tasks.filter((t) => t.projectId === sub.id && !t.parentTaskId);

                              return (
                                <div
                                  key={sub.id}
                                  onClick={() => setSelectedProject(sub)}
                                  className="rounded-2xl border border-border/80 bg-background/80 p-3.5 space-y-2 hover:border-primary/50 hover:bg-background cursor-pointer transition-all shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                      {sub.code}
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-foreground">
                                      {subProgress}%
                                    </span>
                                  </div>

                                  <h5 className="text-xs font-bold text-foreground truncate">
                                    {sub.name}
                                  </h5>

                                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all duration-300"
                                      style={{ width: `${subProgress}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                    <span>{subTasks.length} {subTasks.length === 1 ? 'task' : 'tasks'}</span>
                                    <span className="text-primary font-medium flex items-center gap-0.5">
                                      Overview <ChevronRight className="h-3 w-3" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT OVERVIEW / DETAILS MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Header & Breadcrumb */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedProject.businessCode}</span>
                  {selectedProject.parentProjectId && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span>{projects.find((p) => p.id === selectedProject.parentProjectId)?.name}</span>
                    </>
                  )}
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-bold text-primary">{selectedProject.name}</span>
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {selectedProject.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Progress & Target */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border bg-background/60 p-3.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Aggregated Progress</span>
                  <div className="text-xl font-extrabold text-primary mt-1 font-mono">
                    {getProjectProgress(selectedProject.id)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-3.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                  <div className="text-sm font-bold text-foreground mt-1 uppercase">
                    {selectedProject.status}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-3.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Date</span>
                  <div className="text-sm font-bold text-foreground mt-1">
                    {selectedProject.targetDate || 'In Progress'}
                  </div>
                </div>
              </div>

              {/* Success Definition */}
              <div className="rounded-2xl border border-border bg-background/60 p-4 text-xs space-y-1">
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
                  Success Definition
                </span>
                <p className="text-foreground/90 font-medium">
                  {selectedProject.successDefinition}
                </p>
              </div>

              {/* Tasks within this Project */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Tasks in Project:</span>
                  <span className="text-muted-foreground font-mono">
                    {tasks.filter((t) => t.projectId === selectedProject.id && !t.parentTaskId).length} tasks
                  </span>
                </div>

                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.projectId === selectedProject.id && !t.parentTaskId)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${t.status === 'DONE' ? 'bg-emerald-500' : 'bg-primary'}`} />
                          <span className={t.status === 'DONE' ? 'line-through text-muted-foreground' : 'font-medium text-foreground'}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{t.status}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
              <div className="flex items-center gap-2">
                {selectedProject.status === 'ACTIVE' ? (
                  <button
                    onClick={() => {
                      updateProject(selectedProject.id, { status: 'PAUSED' });
                      setSelectedProject({ ...selectedProject, status: 'PAUSED' });
                    }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-amber-500"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause Project</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateProject(selectedProject.id, { status: 'ACTIVE' });
                      setSelectedProject({ ...selectedProject, status: 'ACTIVE' });
                    }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-emerald-500"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Activate Project</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  deleteProject(selectedProject.id);
                  setSelectedProject(null);
                }}
                className="text-destructive hover:underline"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT / SUB-PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {parentProjectId ? 'Create Sub-Project' : 'Create New Project'}
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prorido Website or Designoia Sales Engine"
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
                  <label className="mb-1 block font-semibold text-muted-foreground">Parent Project (Optional, Max 2 Levels)</label>
                  <select
                    value={parentProjectId}
                    onChange={(e) => setParentProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none"
                  >
                    <option value="">None (Top-Level Project)</option>
                    {getTopLevelProjects()
                      .filter((p) => p.businessCode === businessCode)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Success Definition * (When is this outcome achieved?)
                </label>
                <textarea
                  rows={2}
                  value={successDefinition}
                  onChange={(e) => setSuccessDefinition(e.target.value)}
                  placeholder="e.g. Landing page live, Calendly integrated, and 3 test bookings placed."
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
    </PageTransition>
  );
}

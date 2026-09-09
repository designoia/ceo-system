'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Plus,
  Pause,
  Play,
  ChevronRight,
  X,
  Layers,
  ListChecks,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { BusinessCode, Project, ProjectStatus, TaskPriority } from '@/lib/types';
import { PageTransition } from '@/components/motion/PageTransition';
import { MobileProjectCard } from '@/components/projects/MobileProjectCard';

const STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  PAUSED: 'bg-amber-500',
  COMPLETED: 'bg-primary',
  ARCHIVED: 'bg-muted-foreground',
};

function OpenNewProjectFromQuery({ onOpen }: { onOpen: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      onOpen();
      router.replace('/projects');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

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
    activeSubprojectsCount,
  } = useStore();

  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ACTIVE');
  const [filterBusiness, setFilterBusiness] = useState<BusinessCode | 'ALL'>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [businessCode, setBusinessCode] = useState<BusinessCode>('DESIGNOIA');
  const [parentProjectId, setParentProjectId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [successDefinition, setSuccessDefinition] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('P1');

  const isOverloaded = activeTopLevelProjectsCount > 4;

  const nextActionFor = (projectId: string): string | null => {
    const subIds = getProjectSubprojects(projectId).map((s) => s.id);
    const scope = [projectId, ...subIds];
    const candidates = tasks
      .filter((t) => t.projectId && scope.includes(t.projectId) && !t.parentTaskId && t.status !== 'DONE' && !t.isDeleted)
      .sort((a, b) => {
        const order: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      });
    return candidates[0]?.title ?? null;
  };

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
      <Suspense fallback={null}>
        <OpenNewProjectFromQuery
          onOpen={() => {
            setParentProjectId('');
            setShowAddModal(true);
          }}
        />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Execution Hierarchy
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h2>
        </div>

        <button
          onClick={() => {
            setParentProjectId('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {isOverloaded && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-2.5 text-amber-500">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold block">
              {activeTopLevelProjectsCount} active initiatives ({activeSubprojectsCount} sub-projects) — above the recommended 4.
            </span>
            <span className="text-amber-500/80">
              Consider finishing or pausing one before starting another.
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {(['ACTIVE', 'PAUSED', 'COMPLETED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <select
          value={filterBusiness}
          onChange={(e) => setFilterBusiness(e.target.value as BusinessCode | 'ALL')}
          className="rounded-md border border-border bg-transparent px-2.5 py-1 text-[11px] text-muted-foreground focus:outline-none self-start md:self-auto"
        >
          <option value="ALL">All Businesses</option>
          {businesses.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: compact project cards (distinct layout, not shrunk desktop rows) */}
      <div className="md:hidden space-y-6">
        {businessesWithProjects.map((biz) => {
          const bizProjects = topLevelProjects.filter((p) => p.businessCode === biz.code);
          if (bizProjects.length === 0) return null;

          return (
            <div key={biz.code} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: biz.color }} />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {biz.name}
                </h3>
                <span className="text-[11px] text-muted-foreground/60 font-mono">{bizProjects.length}</span>
              </div>

              <div className="space-y-2">
                {bizProjects.map((p) => (
                  <MobileProjectCard
                    key={p.id}
                    project={p}
                    progress={getProjectProgress(p.id)}
                    activeTaskCount={tasks.filter((t) => t.projectId === p.id && !t.parentTaskId && !t.isDeleted && t.status !== 'DONE').length}
                    nextAction={nextActionFor(p.id)}
                    onOpen={(proj) => setSelectedProject(proj)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: compact grouped list */}
      <div className="hidden md:block space-y-6">
        {businessesWithProjects.map((biz) => {
          const bizProjects = topLevelProjects.filter((p) => p.businessCode === biz.code);
          if (bizProjects.length === 0) return null;

          return (
            <div key={biz.code}>
              <div className="flex items-center gap-2 px-1 pb-2">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: biz.color }} />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {biz.name}
                </h3>
                <span className="text-[11px] text-muted-foreground/60 font-mono">{bizProjects.length}</span>
              </div>

              <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                {bizProjects.map((parent) => {
                  const subprojects = getProjectSubprojects(parent.id);
                  const directTasks = tasks.filter((t) => t.projectId === parent.id && !t.parentTaskId && !t.isDeleted);
                  const progress = getProjectProgress(parent.id);
                  const next = nextActionFor(parent.id);

                  return (
                    <div key={parent.id}>
                      <button
                        onClick={() => setSelectedProject(parent)}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-left surface-1 hover:bg-secondary/60 transition-colors group"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[parent.status]}`} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-foreground truncate">
                              {parent.name}
                            </span>
                            {parent.code && (
                              <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">
                                {parent.code}
                              </span>
                            )}
                          </div>
                          {parent.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {parent.description}
                            </p>
                          )}
                        </div>

                        {next && (
                          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 max-w-[220px]">
                            <ArrowUpRight className="h-3 w-3 shrink-0 text-primary/70" />
                            <span className="truncate">{next}</span>
                          </div>
                        )}

                        <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                          {subprojects.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {subprojects.length}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <ListChecks className="h-3 w-3" />
                            {directTasks.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-24 shrink-0">
                          <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
                            {progress}%
                          </span>
                        </div>

                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </button>

                      {subprojects.length > 0 && (
                        <div className="divide-y divide-border/60 border-t border-border/60">
                          {subprojects.map((sub) => {
                            const subProgress = getProjectProgress(sub.id);
                            const subTasks = tasks.filter((t) => t.projectId === sub.id && !t.parentTaskId && !t.isDeleted);
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setSelectedProject(sub)}
                                className="w-full flex items-center gap-3 pl-8 pr-3.5 py-2.5 text-left surface-2 hover:bg-secondary/60 transition-colors group"
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[sub.status]}`} />
                                <span className="text-[12px] text-foreground/90 truncate flex-1 min-w-0">{sub.name}</span>
                                <span className="hidden sm:inline text-[10px] text-muted-foreground shrink-0">
                                  {subTasks.length} task{subTasks.length === 1 ? '' : 's'}
                                </span>
                                <div className="flex items-center gap-2 w-20 shrink-0">
                                  <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
                                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${subProgress}%` }} />
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{subProgress}%</span>
                                </div>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="pl-8 pr-3.5 py-1.5 surface-2 border-t border-border/60">
                        <button
                          onClick={() => openAddSubproject(parent)}
                          className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                          + Sub-project
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROJECT DETAIL DRAWER */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] surface-1 border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{selectedProject.businessCode}</span>
                    {selectedProject.parentProjectId && (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        <span className="truncate">{projects.find((p) => p.id === selectedProject.parentProjectId)?.name}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground truncate">{selectedProject.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-border px-3 py-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Progress</span>
                    <div className="text-lg font-semibold text-foreground mt-0.5 font-mono">
                      {getProjectProgress(selectedProject.id)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-border px-3 py-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</span>
                    <div className="text-[13px] font-medium text-foreground mt-0.5">{selectedProject.status}</div>
                  </div>
                  <div className="rounded-lg border border-border px-3 py-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Target</span>
                    <div className="text-[13px] font-medium text-foreground mt-0.5 truncate">
                      {selectedProject.targetDate || '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Success Definition
                  </span>
                  <p className="text-[13px] text-foreground/90 leading-relaxed">
                    {selectedProject.successDefinition}
                  </p>
                </div>

                {selectedProject.description && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Description
                    </span>
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{selectedProject.description}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Tasks</span>
                    <span className="font-mono normal-case">
                      {tasks.filter((t) => t.projectId === selectedProject.id && !t.parentTaskId && !t.isDeleted).length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {tasks
                      .filter((t) => t.projectId === selectedProject.id && !t.parentTaskId && !t.isDeleted)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-md border border-border/70 px-2.5 py-2 text-[12px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.status === 'DONE' ? 'bg-emerald-500' : 'bg-primary'}`} />
                            <span className={`truncate ${t.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {t.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{t.status}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border text-xs">
                {selectedProject.status === 'ACTIVE' ? (
                  <button
                    onClick={() => {
                      updateProject(selectedProject.id, { status: 'PAUSED' });
                      setSelectedProject({ ...selectedProject, status: 'PAUSED' });
                    }}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-500 transition-colors"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateProject(selectedProject.id, { status: 'ACTIVE' });
                      setSelectedProject({ ...selectedProject, status: 'ACTIVE' });
                    }}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-emerald-500 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Activate</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    deleteProject(selectedProject.id);
                    setSelectedProject(null);
                  }}
                  className="text-destructive/80 hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NEW PROJECT / SUB-PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-xl border border-border surface-2 p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-foreground">
              {parentProjectId ? 'Create Sub-Project' : 'Create New Project'}
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prorido Website"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-muted-foreground">Business</label>
                  <select
                    value={businessCode}
                    onChange={(e) => setBusinessCode(e.target.value as BusinessCode)}
                    className="w-full rounded-md border border-border bg-background p-2 text-foreground focus:outline-none"
                  >
                    {businesses.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-muted-foreground">Parent (optional)</label>
                  <select
                    value={parentProjectId}
                    onChange={(e) => setParentProjectId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background p-2 text-foreground focus:outline-none"
                  >
                    <option value="">None</option>
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
                <label className="mb-1 block font-medium text-muted-foreground">
                  Success Definition
                </label>
                <textarea
                  rows={2}
                  value={successDefinition}
                  onChange={(e) => setSuccessDefinition(e.target.value)}
                  placeholder="When is this outcome achieved?"
                  className="w-full rounded-md border border-border bg-background p-2.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of outcome"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !successDefinition.trim()}
                  className="rounded-md bg-primary px-4 py-1.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PageTransition>
  );
}

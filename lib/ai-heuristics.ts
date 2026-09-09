/**
 * Quiet, rule-based "AI" heuristics — no external LLM call, no chat UI.
 * Runs entirely client-side against data already in the store. Exists to
 * satisfy the spec's "AI works quietly in the background" requirement
 * without depending on an API key nobody has configured yet. Swap the
 * internals for a real model call later without touching call sites.
 */
import { Task, Project, BusinessCode } from './types';

export interface OverloadResult {
  isOverloaded: boolean;
  workloadMinutes: number;
  capacityMinutes: number;
  overageMinutes: number;
}

export function detectOverload(todayTasks: Task[], capacityMinutes: number): OverloadResult {
  const workloadMinutes = todayTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 45), 0);
  return {
    isOverloaded: workloadMinutes > capacityMinutes,
    workloadMinutes,
    capacityMinutes,
    overageMinutes: Math.max(0, workloadMinutes - capacityMinutes),
  };
}

const BUSINESS_KEYWORDS: Record<BusinessCode, string[]> = {
  COL: ['note', 'test', 'student', 'curriculum', 'class', 'institute', 'exam'],
  DESIGNOIA: ['design', 'client', 'website', 'portfolio', 'proposal', 'brand', 'prorido'],
  CLIKIXPRESS: ['order', 'shipment', 'inventory', 'supplier', 'warehouse', 'ecommerce', 'gst'],
  PERSONAL: ['family', 'health', 'home', 'car', 'personal', 'appointment', 'school'],
};

/** Suggests a business classification from a task title using keyword matching. */
export function classifyTask(title: string): BusinessCode | null {
  const lower = title.toLowerCase();
  for (const [code, keywords] of Object.entries(BUSINESS_KEYWORDS) as [BusinessCode, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) return code;
  }
  return null;
}

/** Suggests who should own a task based on simple signal words in the title/notes. */
export function suggestDelegation(task: Pick<Task, 'title' | 'notes' | 'estimatedMinutes'>): 'YOU' | 'TEAM' | 'AUTOMATION' {
  const text = `${task.title} ${task.notes || ''}`.toLowerCase();
  if (/\b(automate|workflow|n8n|script|sync|webhook)\b/.test(text)) return 'AUTOMATION';
  if (/\b(assign|delegate|ask|coordinate|team|hire|brief)\b/.test(text)) return 'TEAM';
  return 'YOU';
}

export interface StalledProject {
  project: Project;
  reason: string;
}

/** A project is "stalled" if it has 0% task-completion progress or hasn't moved in 14+ days. */
export function detectStalledProjects(projects: Project[], tasks: Task[], progressOf: (id: string) => number): StalledProject[] {
  const now = Date.now();
  const stalled: StalledProject[] = [];

  for (const p of projects) {
    if (p.status !== 'ACTIVE' || p.parentProjectId) continue;
    const progress = progressOf(p.id);
    const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.isDeleted);
    const daysSinceUpdate = p.updatedAt ? (now - new Date(p.updatedAt).getTime()) / 86400000 : Infinity;

    if (progress === 0 && projectTasks.length > 0) {
      stalled.push({ project: p, reason: 'No tasks completed yet' });
    } else if (daysSinceUpdate > 14) {
      stalled.push({ project: p, reason: `No activity in ${Math.floor(daysSinceUpdate)} days` });
    }
  }

  return stalled;
}

/** Templated, deterministic weekly summary — a starting draft, not a final answer. */
export function summarizeWeek(stats: {
  tasksPlanned: number;
  tasksCompleted: number;
  mustWinsCompleted: number;
  overdueCount: number;
}): string {
  const completionRate = stats.tasksPlanned > 0 ? Math.round((stats.tasksCompleted / stats.tasksPlanned) * 100) : 0;
  const parts: string[] = [];
  parts.push(`Completed ${stats.tasksCompleted}/${stats.tasksPlanned} planned tasks (${completionRate}%)`);
  if (stats.mustWinsCompleted > 0) parts.push(`${stats.mustWinsCompleted} must-win${stats.mustWinsCompleted > 1 ? 's' : ''} landed`);
  if (stats.overdueCount > 0) parts.push(`${stats.overdueCount} carried over as overdue`);
  return parts.join('. ') + '.';
}

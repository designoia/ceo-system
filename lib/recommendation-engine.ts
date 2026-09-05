import { Task, Project, Business, StrategicMonth, RecommendationResult } from './types';
import { getTodayDateString } from './utils';

/**
 * Builds a hierarchical breadcrumb string for a task.
 * e.g., "Designoia / Prorido / Prorido Website"
 */
export function getTaskBreadcrumb(
  task: Task,
  projects: Project[],
  businesses: Business[]
): string {
  const business = businesses.find(b => b.code === task.businessCode);
  const businessName = business?.name || task.businessCode;

  if (!task.projectId) {
    return businessName;
  }

  const project = projects.find(p => p.id === task.projectId);
  if (!project) {
    return businessName;
  }

  if (project.parentProjectId) {
    const parent = projects.find(p => p.id === project.parentProjectId);
    if (parent) {
      return `${businessName} / ${parent.name} / ${project.name}`;
    }
  }

  return `${businessName} / ${project.name}`;
}

/**
 * Generates a deterministic, transparent reason why a task was scored/recommended.
 */
export function getRecommendationReason(
  task: Task,
  project?: Project,
  currentMonth?: StrategicMonth | null,
  localTodayStr?: string
): string {
  if (task.isMustWin) {
    return 'Active MUST-WIN Priority';
  }
  if (task.status === 'OVERDUE') {
    return 'Overdue task from previous day';
  }
  if (task.dueDate && localTodayStr && task.dueDate <= localTodayStr) {
    return 'Due Today';
  }
  if (task.priority === 'P1') {
    if (currentMonth && project && project.monthYear === currentMonth.yearMonth) {
      return `P1 Priority in Current Strategic Focus (${currentMonth.focusTitle})`;
    }
    return 'P1 Strategic Priority';
  }
  if (task.status === 'THIS_WEEK') {
    return 'Scheduled for This Week';
  }
  if (currentMonth && project && project.monthYear === currentMonth.yearMonth) {
    return `Aligned with Monthly Focus (${currentMonth.focusTitle})`;
  }
  if (project?.priority === 'P1') {
    return `High-Priority Project (${project.name})`;
  }
  if (task.status === 'NEXT') {
    return 'Next in Execution Queue';
  }
  return 'Available Action';
}

/**
 * Scores a candidate task based on 10 deterministic criteria.
 */
export function scoreTask(
  task: Task,
  projects: Project[],
  currentMonth: StrategicMonth | null,
  localTodayStr: string
): number {
  let score = 0;

  // 1. MUST-WIN priority (+1000)
  if (task.isMustWin) {
    score += 1000;
  }

  // 2. Overdue tasks (+450, older gets slightly higher urgency)
  if (task.status === 'OVERDUE') {
    score += 450;
    if (task.overdueAt) {
      const days = Math.min(5, Math.floor((Date.now() - new Date(task.overdueAt).getTime()) / (1000 * 3600 * 24)));
      score += days * 20;
    }
  }

  // 3. Priority tier (+500 for P1, +200 for P2, +50 for P3)
  if (task.priority === 'P1') score += 500;
  else if (task.priority === 'P2') score += 200;
  else score += 50;

  // 4. Due Date matches or is before today (+400)
  if (task.dueDate) {
    if (task.dueDate <= localTodayStr) {
      score += 400;
    } else {
      // Near-term due date
      score += 100;
    }
  }

  // 5. Explicitly scheduled for TODAY (+350) or THIS_WEEK (+250)
  if (task.status === 'TODAY') score += 350;
  else if (task.status === 'THIS_WEEK') score += 250;
  else if (task.status === 'NEXT') score += 120;

  // 6. Project health & alignment
  if (task.projectId) {
    const proj = projects.find(p => p.id === task.projectId);
    if (proj) {
      if (proj.priority === 'P1') score += 150;
      else if (proj.priority === 'P2') score += 75;

      // Aligned with current monthly strategic focus
      if (currentMonth && (proj.monthYear === currentMonth.yearMonth || currentMonth.focusTitle.toLowerCase().includes(proj.name.toLowerCase()))) {
        score += 250;
      }
    }
  }

  // 7. Efficiency bonus: tasks <= 45 min fit realistic CEO focus blocks well (+30)
  if (task.estimatedMinutes > 0 && task.estimatedMinutes <= 45) {
    score += 30;
  }

  return score;
}

/**
 * Deterministic Daily Plan Recommendation Engine.
 * Generates strictly 1 MUST-WIN + packed NEXT/OPTIONAL tasks fitting within capacity.
 */
export function generateDailyRecommendation(
  tasks: Task[],
  projects: Project[],
  businesses: Business[],
  currentMonth: StrategicMonth | null,
  availableCapacityMinutes: number,
  timezone: string = 'Asia/Kolkata',
  forceLowEnergy: boolean = false
): RecommendationResult {
  const localTodayStr = getTodayDateString(timezone);

  // Active projects map
  const projectMap = new Map<string, Project>();
  projects.forEach(p => projectMap.set(p.id, p));

  // 1. Filter eligible candidate tasks
  const eligibleTasks = tasks.filter(t => {
    // Exclude completed or blocked tasks
    if (t.status === 'DONE' || t.status === 'BLOCKED') return false;

    // Exclude tasks belonging to paused or archived projects
    if (t.projectId) {
      const proj = projectMap.get(t.projectId);
      if (proj && (proj.status === 'PAUSED' || proj.status === 'ARCHIVED' || proj.isArchived)) {
        return false;
      }
    }

    return true;
  });

  // Build breadcrumb & reason maps
  const projectBreadcrumbs: Record<string, string> = {};
  const taskReasons: Record<string, string> = {};

  eligibleTasks.forEach(t => {
    projectBreadcrumbs[t.id] = getTaskBreadcrumb(t, projects, businesses);
    const proj = t.projectId ? projectMap.get(t.projectId) : undefined;
    taskReasons[t.id] = getRecommendationReason(t, proj, currentMonth, localTodayStr);
  });

  // 2. Score and sort candidates
  const scored = eligibleTasks.map(task => ({
    task,
    score: scoreTask(task, projects, currentMonth, localTodayStr)
  })).sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      mustWinTask: null,
      mustWinReason: 'No pending tasks found',
      nextTasks: [],
      optionalTasks: [],
      totalPlannedMinutes: 0,
      capacityMinutes: availableCapacityMinutes,
      bufferMinutes: availableCapacityMinutes,
      isOverloaded: false,
      projectBreadcrumbs,
      taskReasons,
    };
  }

  // 3. Select STRICTLY ONE MUST-WIN
  let mustWinEntry = scored.find(s => s.task.isMustWin);
  if (!mustWinEntry) {
    if (forceLowEnergy) {
      // In low-energy mode, pick the highest strategic value task that takes <= 20 min (or has rescue action)
      mustWinEntry = scored.find(s => (s.task.estimatedMinutes <= 20 || !!s.task.rescueAction)) || scored[0];
    } else {
      mustWinEntry = scored[0];
    }
  }

  const mustWinTask = mustWinEntry.task;
  const mustWinReason = taskReasons[mustWinTask.id] || 'Primary Daily Priority';

  // 4. Pack additional tasks according to available capacity
  const remainingCandidates = scored.filter(s => s.task.id !== mustWinTask.id);
  const nextTasks: Task[] = [];
  const optionalTasks: Task[] = [];

  let accumulatedMinutes = forceLowEnergy 
    ? Math.min(mustWinTask.estimatedMinutes || 20, 20) 
    : (mustWinTask.estimatedMinutes || 45);

  // Reserve a 15-minute healthy buffer if capacity >= 90 min
  const effectiveCapacity = availableCapacityMinutes >= 120 
    ? Math.floor(availableCapacityMinutes * 0.8) 
    : availableCapacityMinutes;

  for (const entry of remainingCandidates) {
    const duration = entry.task.estimatedMinutes || 30;
    if (accumulatedMinutes + duration <= effectiveCapacity) {
      accumulatedMinutes += duration;
      nextTasks.push(entry.task);
    } else if (optionalTasks.length < 2) {
      // Keep up to 2 optional backlog items for quick reference
      optionalTasks.push(entry.task);
    }
  }

  const isOverloaded = accumulatedMinutes > availableCapacityMinutes;
  const bufferMinutes = Math.max(0, availableCapacityMinutes - accumulatedMinutes);

  return {
    mustWinTask,
    mustWinReason,
    nextTasks,
    optionalTasks,
    totalPlannedMinutes: accumulatedMinutes,
    capacityMinutes: availableCapacityMinutes,
    bufferMinutes,
    isOverloaded,
    projectBreadcrumbs,
    taskReasons,
  };
}

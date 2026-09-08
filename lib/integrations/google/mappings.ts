import { BusinessCode, GoogleTaskListMapping, Task } from '@/lib/types';

export const DEFAULT_TASK_LIST_MAPPINGS: GoogleTaskListMapping[] = [
  { taskListId: 'default-inbox', taskListTitle: 'My Tasks', isInboxDefault: true },
  { taskListId: 'list-col', taskListTitle: 'COL', businessCode: 'COL' },
  { taskListId: 'list-designoia', taskListTitle: 'Designoia', businessCode: 'DESIGNOIA' },
  { taskListId: 'list-prorido', taskListTitle: 'Prorido', businessCode: 'DESIGNOIA' },
  { taskListId: 'list-clikixpress', taskListTitle: 'Clikixpress', businessCode: 'CLIKIXPRESS' },
  { taskListId: 'list-personal', taskListTitle: 'Personal', businessCode: 'PERSONAL' },
  { taskListId: 'list-school', taskListTitle: 'School', businessCode: 'PERSONAL' },
];

/**
 * Determine BusinessCode from Google Task List ID or Title
 */
export function resolveBusinessAndProjectFromList(
  listId: string,
  listTitle: string,
  configuredMappings: GoogleTaskListMapping[]
): { businessCode: BusinessCode; projectId?: string } {
  // 1. Check user configured mappings first
  const match = configuredMappings.find(
    (m) => m.taskListId === listId || m.taskListTitle.toLowerCase() === listTitle.toLowerCase()
  );

  if (match && match.businessCode) {
    return {
      businessCode: match.businessCode,
      projectId: match.projectId,
    };
  }

  // 2. Fallback heuristic based on common names
  const normalized = listTitle.trim().toUpperCase();
  if (normalized.includes('DESIGNOIA') || normalized.includes('PRORIDO')) {
    return { businessCode: 'DESIGNOIA' };
  }
  if (normalized.includes('COL') || normalized.includes('CIRCLE OF LEARNING') || normalized.includes('STUDY')) {
    return { businessCode: 'COL' };
  }
  if (normalized.includes('CLIKIXPRESS') || normalized.includes('ECOMMERCE') || normalized.includes('ORDERS')) {
    return { businessCode: 'CLIKIXPRESS' };
  }
  if (normalized.includes('PERSONAL') || normalized.includes('HOME') || normalized.includes('SCHOOL') || normalized.includes('HEALTH')) {
    return { businessCode: 'PERSONAL' };
  }

  // Default to COL or PERSONAL
  return { businessCode: 'COL' };
}

/**
 * Format Google Calendar event description with CEO OS and Project context
 */
export function buildCalendarEventDescription(task: Task, businessName?: string, projectName?: string): string {
  const lines: string[] = [
    `🎯 CEO OS Task: ${task.title}`,
    `🏢 Business: ${businessName || task.businessCode}`,
  ];

  if (projectName) {
    lines.push(`📁 Project: ${projectName}`);
  }

  if (task.priority) {
    lines.push(`⚡ Priority: ${task.priority}${task.isMustWin ? ' (★ MUST-WIN)' : ''}`);
  }

  if (task.notes) {
    lines.push(`📝 Notes: ${task.notes}`);
  }

  lines.push('');
  lines.push(`ID: ${task.id}`);
  if (task.externalTaskId) {
    lines.push(`Google Task: ${task.externalTaskId}`);
  }

  return lines.join('\n');
}

/**
 * Deterministic idempotency key for Google Calendar Event ID
 * Google Calendar accepts base32hex encoded 5-1024 char strings for event IDs
 */
export function generateDeterministicCalendarEventId(ceoTaskId: string, scheduledDate: string): string {
  const raw = `ceoos_${ceoTaskId.replace(/[^a-zA-Z0-9]/g, '')}_${scheduledDate.replace(/[^0-9]/g, '')}`;
  return raw.toLowerCase().substring(0, 64);
}

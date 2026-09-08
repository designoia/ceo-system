import { 
  Task, 
  ScheduleEntry, 
  GoogleConnection, 
  GoogleTaskListMapping, 
  GoogleTaskMapping, 
  GoogleCalendarMapping, 
  GoogleSyncLog, 
  SyncConflict 
} from '@/lib/types';
import { GoogleTasksClient } from './tasks';
import { GoogleCalendarClient } from './calendar';
import { resolveBusinessAndProjectFromList, buildCalendarEventDescription, generateDeterministicCalendarEventId } from './mappings';
import { detectTaskConflict } from './conflict';
import { GoogleSyncResult, SyncOrigin, GoogleTaskApiItem, GoogleCalendarApiEvent } from './types';

export interface SyncEngineContext {
  tasks: Task[];
  scheduleEntries: ScheduleEntry[];
  connection: GoogleConnection;
  taskListMappings: GoogleTaskListMapping[];
  taskMappings: GoogleTaskMapping[];
  calendarMappings: GoogleCalendarMapping[];
  accessToken?: string;
}

export interface SyncEngineOutput {
  updatedTasks: Task[];
  updatedScheduleEntries: ScheduleEntry[];
  updatedTaskMappings: GoogleTaskMapping[];
  updatedCalendarMappings: GoogleCalendarMapping[];
  newLogs: GoogleSyncLog[];
  conflicts: SyncConflict[];
  stats: GoogleSyncResult;
}

export class GoogleBidirectionalSyncEngine {
  /**
   * Execute full bidirectional synchronization between CEO OS, Google Tasks, and Google Calendar
   */
  static async runSync(
    ctx: SyncEngineContext,
    origin: SyncOrigin = 'CEO_OS'
  ): Promise<SyncEngineOutput> {
    const startTime = new Date().toISOString();
    const newLogs: GoogleSyncLog[] = [];
    const conflicts: SyncConflict[] = [];

    const updatedTasks: Task[] = [...ctx.tasks];
    const updatedScheduleEntries: ScheduleEntry[] = [...ctx.scheduleEntries];
    const updatedTaskMappings: GoogleTaskMapping[] = [...ctx.taskMappings];
    const updatedCalendarMappings: GoogleCalendarMapping[] = [...ctx.calendarMappings];

    let tasksImported = 0;
    let tasksExported = 0;
    let tasksUpdated = 0;
    let tasksCompleted = 0;
    let eventsImported = 0;
    let eventsExported = 0;
    let eventsUpdated = 0;
    const errors: string[] = [];

    newLogs.push({
      id: `log-${Date.now()}-start`,
      eventType: 'SYNC_STARTED',
      details: `Bidirectional synchronization started (Origin: ${origin})`,
      createdAt: startTime,
    });

    try {
      // 1. GOOGLE TASKS BIDIRECTIONAL SYNC
      if (ctx.connection.isTasksEnabled && ctx.accessToken) {
        const tasksClient = new GoogleTasksClient(ctx.accessToken);

        // A. List task lists
        let taskLists = await tasksClient.listTaskLists();
        if (taskLists.length === 0) {
          taskLists = [{ id: '@default', title: 'My Tasks' }];
        }

        // Fetch all remote tasks across lists
        const remoteTasksByList: Record<string, GoogleTaskApiItem[]> = {};
        for (const list of taskLists) {
          try {
            const listTasks = await tasksClient.listTasks(list.id, {
              showCompleted: true,
              showHidden: true,
            });
            remoteTasksByList[list.id] = listTasks;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Failed to fetch tasks for list ${list.title}: ${msg}`);
          }
        }

        // B. Reconcile Google Tasks -> CEO OS
        for (const [listId, remoteTasks] of Object.entries(remoteTasksByList)) {
          const listTitle = taskLists.find((l) => l.id === listId)?.title || 'My Tasks';
          const { businessCode, projectId } = resolveBusinessAndProjectFromList(
            listId,
            listTitle,
            ctx.taskListMappings
          );

          for (const gTask of remoteTasks) {
            const existingMapping = updatedTaskMappings.find(
              (m) => m.googleTaskId === gTask.id
            );

            if (existingMapping) {
              // Known task - Check for updates/completion/conflict
              const ceoTaskIndex = updatedTasks.findIndex(
                (t) => t.id === existingMapping.ceoTaskId
              );

              if (ceoTaskIndex !== -1) {
                const ceoTask = updatedTasks[ceoTaskIndex];

                // Detect conflict
                const conflict = detectTaskConflict(ceoTask, gTask, existingMapping.lastGoogleUpdatedAt);
                if (conflict) {
                  conflicts.push(conflict);
                  newLogs.push({
                    id: `log-${Date.now()}-conflict-${ceoTask.id}`,
                    eventType: 'SYNC_CONFLICT',
                    details: `Conflict detected for task "${ceoTask.title}"`,
                    entityId: ceoTask.id,
                    entityTitle: ceoTask.title,
                    createdAt: new Date().toISOString(),
                  });
                } else if (origin !== 'CEO_OS') {
                  // Apply remote changes to CEO OS
                  let hasChanges = false;
                  const updates: Partial<Task> = {};

                  if (gTask.title && gTask.title !== ceoTask.title) {
                    updates.title = gTask.title;
                    hasChanges = true;
                  }
                  if (gTask.notes !== undefined && gTask.notes !== ceoTask.notes) {
                    updates.notes = gTask.notes;
                    hasChanges = true;
                  }
                  if (gTask.due) {
                    const dueStr = gTask.due.split('T')[0];
                    if (dueStr !== ceoTask.dueDate) {
                      updates.dueDate = dueStr;
                      hasChanges = true;
                    }
                  }

                  // Handle completion
                  const isRemoteDone = gTask.status === 'completed';
                  if (isRemoteDone && ceoTask.status !== 'DONE') {
                    updates.status = 'DONE';
                    updates.previousStatus = ceoTask.status;
                    updates.completedAt = gTask.completed || new Date().toISOString();
                    hasChanges = true;
                    tasksCompleted++;
                    newLogs.push({
                      id: `log-${Date.now()}-done-${ceoTask.id}`,
                      eventType: 'GOOGLE_TASK_COMPLETED',
                      details: `Completed in Google Tasks: "${ceoTask.title}"`,
                      entityId: ceoTask.id,
                      entityTitle: ceoTask.title,
                      createdAt: new Date().toISOString(),
                    });
                  } else if (!isRemoteDone && ceoTask.status === 'DONE') {
                    updates.status = ceoTask.previousStatus || 'TODAY';
                    updates.completedAt = undefined;
                    hasChanges = true;
                    newLogs.push({
                      id: `log-${Date.now()}-reopen-${ceoTask.id}`,
                      eventType: 'GOOGLE_TASK_REOPENED',
                      details: `Reopened in Google Tasks: "${ceoTask.title}"`,
                      entityId: ceoTask.id,
                      entityTitle: ceoTask.title,
                      createdAt: new Date().toISOString(),
                    });
                  }

                  if (hasChanges) {
                    updatedTasks[ceoTaskIndex] = {
                      ...ceoTask,
                      ...updates,
                      googleEtag: gTask.etag,
                      syncStatus: 'SYNCED',
                      lastSyncedAt: new Date().toISOString(),
                    };
                    tasksUpdated++;
                  }
                }
              }
            } else if (!gTask.deleted && !gTask.hidden) {
              // Brand NEW task in Google Tasks -> Import into CEO OS!
              const newCeoTaskId = `task-gt-${gTask.id}`;
              const isDone = gTask.status === 'completed';

              const importedTask: Task = {
                id: newCeoTaskId,
                code: `T-GT-${gTask.id.substring(0, 4).toUpperCase()}`,
                title: gTask.title || 'Untitled Google Task',
                businessCode,
                projectId,
                status: isDone ? 'DONE' : 'INBOX',
                priority: 'P2',
                estimatedMinutes: 45,
                dueDate: gTask.due ? gTask.due.split('T')[0] : undefined,
                notes: gTask.notes,
                source: 'GOOGLE_TASKS',
                externalTaskId: gTask.id,
                externalTaskListId: listId,
                googleEtag: gTask.etag,
                syncStatus: 'SYNCED',
                lastSyncedAt: new Date().toISOString(),
                createdAt: gTask.updated || new Date().toISOString(),
                completedAt: isDone ? gTask.completed || new Date().toISOString() : undefined,
              };

              updatedTasks.unshift(importedTask);
              updatedTaskMappings.push({
                id: `map-${Date.now()}-${gTask.id}`,
                userId: ctx.connection.userId,
                ceoTaskId: newCeoTaskId,
                googleTaskId: gTask.id,
                googleTaskListId: listId,
                googleEtag: gTask.etag,
                lastGoogleUpdatedAt: gTask.updated,
                lastCeoUpdatedAt: importedTask.createdAt,
                syncStatus: 'SYNCED',
              });

              tasksImported++;
              newLogs.push({
                id: `log-${Date.now()}-import-${gTask.id}`,
                eventType: 'GOOGLE_TASK_IMPORTED',
                details: `Imported Google Task into Inbox: "${importedTask.title}"`,
                entityId: newCeoTaskId,
                entityTitle: importedTask.title,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        // C. Reconcile CEO OS -> Google Tasks (Push newly created or updated CEO OS tasks)
        if (origin !== 'GOOGLE_TASKS') {
          const defaultListId = ctx.connection.defaultTaskListId || taskLists[0]?.id || '@default';

          for (let i = 0; i < updatedTasks.length; i++) {
            const task = updatedTasks[i];
            if (task.isDeleted) continue;

            const mapping = updatedTaskMappings.find((m) => m.ceoTaskId === task.id);

            if (!mapping && task.source !== 'GOOGLE_TASKS') {
              // Task created in CEO OS that does not yet exist in Google Tasks -> Push to Google Tasks!
              try {
                const targetListId = task.externalTaskListId || defaultListId;
                const createdGTask = await tasksClient.insertTask(targetListId, {
                  title: task.title,
                  notes: task.notes,
                  due: task.dueDate,
                  status: task.status === 'DONE' ? 'completed' : 'needsAction',
                });

                updatedTasks[i] = {
                  ...task,
                  externalTaskId: createdGTask.id,
                  externalTaskListId: targetListId,
                  googleEtag: createdGTask.etag,
                  syncStatus: 'SYNCED',
                  lastSyncedAt: new Date().toISOString(),
                };

                updatedTaskMappings.push({
                  id: `map-${Date.now()}-${createdGTask.id}`,
                  userId: ctx.connection.userId,
                  ceoTaskId: task.id,
                  googleTaskId: createdGTask.id,
                  googleTaskListId: targetListId,
                  googleEtag: createdGTask.etag,
                  lastGoogleUpdatedAt: createdGTask.updated,
                  lastCeoUpdatedAt: task.updatedAt || task.createdAt,
                  syncStatus: 'SYNCED',
                });

                tasksExported++;
                newLogs.push({
                  id: `log-${Date.now()}-exp-${task.id}`,
                  eventType: 'GOOGLE_TASK_UPDATED',
                  details: `Exported CEO OS task to Google Tasks: "${task.title}"`,
                  entityId: task.id,
                  entityTitle: task.title,
                  createdAt: new Date().toISOString(),
                });
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`Failed to export task "${task.title}" to Google: ${msg}`);
              }
            }
          }
        }
      }

      // 2. GOOGLE CALENDAR BIDIRECTIONAL SYNC
      if (ctx.connection.isCalendarEnabled && ctx.accessToken) {
        const calClient = new GoogleCalendarClient(ctx.accessToken);
        const primaryCalendarId = ctx.connection.primaryCalendarId || 'primary';

        // Fetch events for active window (e.g. current 30 days)
        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21).toISOString();

        const { items: remoteEvents } = await calClient.listEvents(primaryCalendarId, {
          timeMin,
          timeMax,
          singleEvents: true,
        });

        // A. Process remote Calendar events -> CEO OS Scheduler
        for (const gEvent of remoteEvents) {
          if (gEvent.status === 'cancelled') {
            // Event deleted in Calendar
            const entryIndex = updatedScheduleEntries.findIndex(
              (e) => e.googleCalendarEventId === gEvent.id
            );
            if (entryIndex !== -1) {
              const entry = updatedScheduleEntries[entryIndex];
              if (entry.taskId) {
                // Keep task, just remove calendar link & mark unscheduled
                const taskIdx = updatedTasks.findIndex((t) => t.id === entry.taskId);
                if (taskIdx !== -1) {
                  updatedTasks[taskIdx] = {
                    ...updatedTasks[taskIdx],
                    scheduledDate: undefined,
                    scheduledTime: undefined,
                    googleCalendarEventId: undefined,
                  };
                }
              }
              updatedScheduleEntries[entryIndex] = {
                ...entry,
                status: 'CANCELLED',
                remarks: 'Deleted in Google Calendar',
              };
              eventsUpdated++;
            }
            continue;
          }

          const ceoTaskId = gEvent.extendedProperties?.private?.ceo_os_task_id;
          const startDateTime = gEvent.start.dateTime;
          const endDateTime = gEvent.end.dateTime;

          if (!startDateTime || !endDateTime) continue; // Skip all-day events without exact times

          const eventStartDate = startDateTime.split('T')[0];
          const eventStartTime = startDateTime.substring(11, 16);
          const eventEndTime = endDateTime.substring(11, 16);

          const existingEntryIndex = updatedScheduleEntries.findIndex(
            (e) => e.googleCalendarEventId === gEvent.id || (ceoTaskId && e.taskId === ceoTaskId && e.date === eventStartDate)
          );

          if (existingEntryIndex !== -1) {
            // Existing schedule entry - check if user rescheduled in Google Calendar
            const currentEntry = updatedScheduleEntries[existingEntryIndex];
            if (
              currentEntry.date !== eventStartDate ||
              currentEntry.plannedStartTime !== eventStartTime ||
              currentEntry.plannedEndTime !== eventEndTime ||
              currentEntry.title !== gEvent.summary
            ) {
              updatedScheduleEntries[existingEntryIndex] = {
                ...currentEntry,
                date: eventStartDate,
                plannedStartTime: eventStartTime,
                plannedEndTime: eventEndTime,
                title: gEvent.summary || currentEntry.title,
                googleEtag: gEvent.etag,
                syncStatus: 'SYNCED',
              };

              // Also update task scheduled time if linked
              if (currentEntry.taskId) {
                const tIdx = updatedTasks.findIndex((t) => t.id === currentEntry.taskId);
                if (tIdx !== -1) {
                  updatedTasks[tIdx] = {
                    ...updatedTasks[tIdx],
                    scheduledDate: eventStartDate,
                    scheduledTime: eventStartTime,
                  };
                }
              }

              eventsUpdated++;
              newLogs.push({
                id: `log-${Date.now()}-cal-upd-${gEvent.id}`,
                eventType: 'GOOGLE_EVENT_UPDATED',
                details: `Updated schedule from Google Calendar: "${gEvent.summary}" (${eventStartTime}–${eventEndTime})`,
                entityTitle: gEvent.summary,
                createdAt: new Date().toISOString(),
              });
            }
          } else if (!ceoTaskId) {
            // EXTERNAL Calendar Event (School, Tuition, Personal Meeting) -> Import as FIXED COMMITMENT!
            const newScheduleId = `sched-gcal-${gEvent.id}`;
            const sMin = parseInt(eventStartTime.split(':')[0], 10) * 60 + parseInt(eventStartTime.split(':')[1], 10);
            const eMin = parseInt(eventEndTime.split(':')[0], 10) * 60 + parseInt(eventEndTime.split(':')[1], 10);
            const duration = eMin >= sMin ? eMin - sMin : (eMin + 1440) - sMin;

            let activityType: ScheduleEntry['activityType'] = 'MEETING';
            const titleUpper = (gEvent.summary || '').toUpperCase();
            if (titleUpper.includes('SCHOOL')) activityType = 'SCHOOL';
            else if (titleUpper.includes('TUITION')) activityType = 'TUITION';
            else if (titleUpper.includes('CLASS')) activityType = 'CLASSES';
            else if (titleUpper.includes('REST') || titleUpper.includes('SLEEP')) activityType = 'REST';
            else if (titleUpper.includes('TRAVEL')) activityType = 'TRAVEL';

            const newCommitment: ScheduleEntry = {
              id: newScheduleId,
              date: eventStartDate,
              plannedStartTime: eventStartTime,
              plannedEndTime: eventEndTime,
              plannedDurationMinutes: duration,
              title: gEvent.summary || 'Google Calendar Event',
              description: gEvent.description,
              activityType,
              status: 'PLANNED',
              sourceType: 'FIXED_COMMITMENT',
              googleCalendarEventId: gEvent.id,
              googleCalendarId: primaryCalendarId,
              googleEtag: gEvent.etag,
              isExternalCommitment: true,
              syncStatus: 'SYNCED',
              createdAt: gEvent.updated || new Date().toISOString(),
            };

            updatedScheduleEntries.push(newCommitment);
            eventsImported++;

            newLogs.push({
              id: `log-${Date.now()}-cal-imp-${gEvent.id}`,
              eventType: 'GOOGLE_EVENT_CREATED',
              details: `Imported fixed calendar commitment: "${newCommitment.title}" (${eventStartTime}–${eventEndTime})`,
              entityId: newScheduleId,
              entityTitle: newCommitment.title,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      newLogs.push({
        id: `log-${Date.now()}-end`,
        eventType: 'SYNC_COMPLETED',
        details: `Sync completed: ${tasksImported} imported, ${tasksExported} exported, ${eventsImported} calendar events synced`,
        createdAt: new Date().toISOString(),
      });

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(msg);
      newLogs.push({
        id: `log-${Date.now()}-err`,
        eventType: 'SYNC_FAILED',
        details: `Sync failed: ${msg}`,
        isError: true,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      updatedTasks,
      updatedScheduleEntries,
      updatedTaskMappings,
      updatedCalendarMappings,
      newLogs,
      conflicts,
      stats: {
        tasksImported,
        tasksExported,
        tasksUpdated,
        tasksCompleted,
        eventsImported,
        eventsExported,
        eventsUpdated,
        conflictsDetected: conflicts.length,
        errors,
        lastSyncAt: new Date().toISOString(),
      },
    };
  }
}

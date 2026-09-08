import { GoogleTaskApiItem, GoogleTaskListApiItem } from './types';

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

export class GoogleTasksClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${TASKS_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Google Tasks API Error [${response.status}]: ${errorText}`) as Error & { status: number; body: string };
      error.status = response.status;
      error.body = errorText;
      throw error;
    }

    return response.json();
  }

  /**
   * List all Google Task Lists
   */
  async listTaskLists(): Promise<GoogleTaskListApiItem[]> {
    const data = await this.request<{ items?: GoogleTaskListApiItem[] }>('/users/@me/lists');
    return data.items || [];
  }

  /**
   * Get primary or specified Task List
   */
  async getTaskList(taskListId: string): Promise<GoogleTaskListApiItem> {
    return this.request<GoogleTaskListApiItem>(`/users/@me/lists/${taskListId}`);
  }

  /**
   * List tasks inside a task list with optional incremental sync filter (updatedMin)
   */
  async listTasks(taskListId: string, options: {
    updatedMin?: string;
    showCompleted?: boolean;
    showHidden?: boolean;
    showDeleted?: boolean;
    maxResults?: number;
  } = {}): Promise<GoogleTaskApiItem[]> {
    const params = new URLSearchParams();
    if (options.updatedMin) params.append('updatedMin', options.updatedMin);
    params.append('showCompleted', options.showCompleted !== false ? 'true' : 'false');
    params.append('showHidden', options.showHidden !== false ? 'true' : 'false');
    if (options.showDeleted) params.append('showDeleted', 'true');
    if (options.maxResults) params.append('maxResults', options.maxResults.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request<{ items?: GoogleTaskApiItem[] }>(`/lists/${taskListId}/tasks${query}`);
    return data.items || [];
  }

  /**
   * Get specific task by ID
   */
  async getTask(taskListId: string, taskId: string): Promise<GoogleTaskApiItem> {
    return this.request<GoogleTaskApiItem>(`/lists/${taskListId}/tasks/${taskId}`);
  }

  /**
   * Insert a new task into a Google Task list
   * CRITICAL: Google Tasks API only stores Date for `due`. Format: RFC 3339 timestamp (YYYY-MM-DDT00:00:00.000Z)
   */
  async insertTask(
    taskListId: string,
    task: {
      title: string;
      notes?: string;
      due?: string; // e.g. "2026-09-08" or "2026-09-08T00:00:00.000Z"
      status?: 'needsAction' | 'completed';
    }
  ): Promise<GoogleTaskApiItem> {
    let formattedDue: string | undefined = undefined;
    if (task.due) {
      formattedDue = task.due.includes('T') ? task.due : `${task.due}T00:00:00.000Z`;
    }

    return this.request<GoogleTaskApiItem>(`/lists/${taskListId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        notes: task.notes,
        due: formattedDue,
        status: task.status || 'needsAction',
      }),
    });
  }

  /**
   * Update an existing task in Google Tasks
   */
  async updateTask(
    taskListId: string,
    taskId: string,
    task: {
      title?: string;
      notes?: string;
      due?: string | null;
      status?: 'needsAction' | 'completed';
      completed?: string | null;
    },
    etag?: string
  ): Promise<GoogleTaskApiItem> {
    let formattedDue: string | undefined | null = task.due;
    if (task.due && !task.due.includes('T')) {
      formattedDue = `${task.due}T00:00:00.000Z`;
    }

    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-Match'] = etag;
    }

    return this.request<GoogleTaskApiItem>(`/lists/${taskListId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ...(task.title !== undefined ? { title: task.title } : {}),
        ...(task.notes !== undefined ? { notes: task.notes } : {}),
        ...(formattedDue !== undefined ? { due: formattedDue } : {}),
        ...(task.status !== undefined ? { status: task.status } : {}),
        ...(task.completed !== undefined ? { completed: task.completed } : {}),
      }),
    });
  }

  /**
   * Mark Google Task as completed
   */
  async completeTask(taskListId: string, taskId: string, completedAt?: string): Promise<GoogleTaskApiItem> {
    return this.updateTask(taskListId, taskId, {
      status: 'completed',
      completed: completedAt || new Date().toISOString(),
    });
  }

  /**
   * Reopen Google Task (needsAction)
   */
  async reopenTask(taskListId: string, taskId: string): Promise<GoogleTaskApiItem> {
    return this.updateTask(taskListId, taskId, {
      status: 'needsAction',
      completed: null,
    });
  }

  /**
   * Delete task in Google Tasks
   */
  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.request<void>(`/lists/${taskListId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }
}

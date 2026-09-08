import { GoogleCalendarApiEvent } from './types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${CALENDAR_API_BASE}${endpoint}`;
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
      const error = new Error(`Google Calendar API Error [${response.status}]: ${errorText}`) as Error & { status: number; body: string };
      error.status = response.status;
      error.body = errorText;
      throw error;
    }

    return response.json();
  }

  /**
   * List all user's Google Calendars
   */
  async listCalendars(): Promise<Array<{ id: string; summary: string; primary?: boolean; backgroundColor?: string }>> {
    const data = await this.request<{ items?: Array<{ id: string; summary: string; primary?: boolean; backgroundColor?: string }> }>('/users/me/calendarList');
    return data.items || [];
  }

  /**
   * List events in a calendar using sync token (incremental) or time window
   */
  async listEvents(
    calendarId: string = 'primary',
    options: {
      syncToken?: string;
      timeMin?: string;
      timeMax?: string;
      singleEvents?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<{ items: GoogleCalendarApiEvent[]; nextSyncToken?: string; nextPageToken?: string }> {
    const params = new URLSearchParams();
    if (options.syncToken) {
      params.append('syncToken', options.syncToken);
    } else {
      if (options.timeMin) params.append('timeMin', options.timeMin);
      if (options.timeMax) params.append('timeMax', options.timeMax);
      params.append('singleEvents', options.singleEvents !== false ? 'true' : 'false');
      params.append('orderBy', 'startTime');
    }
    if (options.maxResults) params.append('maxResults', options.maxResults.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request<{ items?: GoogleCalendarApiEvent[]; nextSyncToken?: string; nextPageToken?: string }>(
      `/calendars/${encodeURIComponent(calendarId)}/events${query}`
    );

    return {
      items: data.items || [],
      nextSyncToken: data.nextSyncToken,
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Get a single Google Calendar event by ID
   */
  async getEvent(calendarId: string = 'primary', eventId: string): Promise<GoogleCalendarApiEvent> {
    return this.request<GoogleCalendarApiEvent>(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`);
  }

  /**
   * Create a Google Calendar event for a scheduled task
   */
  async createEvent(
    calendarId: string = 'primary',
    eventData: {
      summary: string;
      description?: string;
      startDateTime: string; // ISO string e.g. "2026-09-08T23:15:00+05:30"
      endDateTime: string;   // ISO string e.g. "2026-09-09T00:00:00+05:30"
      timeZone?: string;
      ceoTaskId?: string;
      ceoScheduleId?: string;
      googleTaskId?: string;
    }
  ): Promise<GoogleCalendarApiEvent> {
    const body: Record<string, unknown> = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'Asia/Kolkata',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'Asia/Kolkata',
      },
      extendedProperties: {
        private: {
          ceo_os_task_id: eventData.ceoTaskId || '',
          ceo_os_schedule_id: eventData.ceoScheduleId || '',
          google_task_id: eventData.googleTaskId || '',
          integration_version: '2.0',
        },
      },
    };

    return this.request<GoogleCalendarApiEvent>(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Update an existing Google Calendar event (e.g. Rescheduled time, title change)
   */
  async updateEvent(
    calendarId: string = 'primary',
    eventId: string,
    eventData: {
      summary?: string;
      description?: string;
      startDateTime?: string;
      endDateTime?: string;
      timeZone?: string;
      ceoTaskId?: string;
      googleTaskId?: string;
    },
    etag?: string
  ): Promise<GoogleCalendarApiEvent> {
    const body: Record<string, unknown> = {};
    if (eventData.summary !== undefined) body.summary = eventData.summary;
    if (eventData.description !== undefined) body.description = eventData.description;

    if (eventData.startDateTime) {
      body.start = {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'Asia/Kolkata',
      };
    }
    if (eventData.endDateTime) {
      body.end = {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'Asia/Kolkata',
      };
    }

    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-Match'] = etag;
    }

    return this.request<GoogleCalendarApiEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    await this.request<void>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Register a webhook watch channel for real-time calendar push notifications
   */
  async watchCalendar(
    calendarId: string = 'primary',
    channelData: {
      id: string; // unique channel UUID
      webhookUrl: string;
      token?: string;
    }
  ): Promise<{ kind: string; id: string; resourceId: string; expiration: string }> {
    return this.request<{ kind: string; id: string; resourceId: string; expiration: string }>(
      `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      {
        method: 'POST',
        body: JSON.stringify({
          id: channelData.id,
          type: 'web_hook',
          address: channelData.webhookUrl,
          token: channelData.token,
        }),
      }
    );
  }

  /**
   * Stop watching a calendar
   */
  async stopWatchChannel(channelId: string, resourceId: string): Promise<void> {
    await this.request<void>('/channels/stop', {
      method: 'POST',
      body: JSON.stringify({
        id: channelId,
        resourceId: resourceId,
      }),
    });
  }
}

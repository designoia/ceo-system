import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getAppUserId } from '@/lib/supabase/admin';
import { rowToTask, taskToRow } from '@/lib/supabase/task-mapper';
import { refreshAccessToken } from '@/lib/integrations/google/auth';
import { GoogleBidirectionalSyncEngine } from '@/lib/integrations/google/sync';
import { GoogleConnection, GoogleTaskListMapping, GoogleTaskMapping } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) return unauthorized();
  }

  const admin = getSupabaseAdmin();
  const userId = await getAppUserId();
  if (!admin || !userId) {
    return NextResponse.json({ skipped: true, reason: 'Supabase not configured' });
  }

  const { data: connRow, error: connErr } = await admin
    .from('google_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (connErr || !connRow || connRow.status !== 'CONNECTED' || !connRow.refresh_token_encrypted) {
    return NextResponse.json({ skipped: true, reason: 'Not connected' });
  }

  // Refresh the access token — a cron run has no browser cookies to reuse,
  // so it always mints a fresh short-lived token via the stored refresh token.
  let accessToken: string;
  try {
    const refreshed = await refreshAccessToken(connRow.refresh_token_encrypted);
    accessToken = refreshed.access_token;

    await admin
      .from('google_connections')
      .update({
        access_token_encrypted: accessToken,
        token_expires_at: refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          : null,
      })
      .eq('user_id', userId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin
      .from('google_connections')
      .update({ status: 'REAUTH_REQUIRED' })
      .eq('user_id', userId);
    return NextResponse.json({ error: `Token refresh failed: ${msg}` }, { status: 500 });
  }

  const { data: taskRows } = await admin
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  const { data: mappingRows } = await admin
    .from('google_task_mappings')
    .select('*')
    .eq('user_id', userId);

  const tasks = (taskRows || []).map(rowToTask);
  const taskMappings: GoogleTaskMapping[] = (mappingRows || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    ceoTaskId: m.ceo_task_id,
    googleTaskId: m.google_task_id,
    googleTaskListId: m.google_task_list_id,
    googleEtag: m.google_etag ?? undefined,
    lastGoogleUpdatedAt: m.last_google_updated_at ?? undefined,
    lastCeoUpdatedAt: m.last_ceo_updated_at ?? undefined,
    syncStatus: m.sync_status,
  }));

  const taskListMappings: GoogleTaskListMapping[] = Array.isArray(connRow.task_list_mappings)
    ? connRow.task_list_mappings
    : [];

  const connection: GoogleConnection = {
    id: connRow.id,
    userId: connRow.user_id,
    googleAccountEmail: connRow.google_account_email,
    googleUserId: connRow.google_user_id,
    scopes: connRow.scopes || [],
    status: 'CONNECTED',
    isTasksEnabled: Boolean(connRow.is_tasks_enabled),
    isCalendarEnabled: false, // Calendar background sync is not yet wired for cron
    primaryCalendarId: connRow.primary_calendar_id,
    selectedCalendarIds: connRow.selected_calendar_ids || ['primary'],
    defaultTaskListId: connRow.default_task_list_id || '@default',
    lastSyncAt: connRow.last_sync_at,
    createdAt: connRow.created_at,
    updatedAt: connRow.updated_at,
  };

  try {
    const result = await GoogleBidirectionalSyncEngine.runSync(
      {
        tasks,
        scheduleEntries: [],
        connection,
        taskListMappings,
        taskMappings,
        calendarMappings: [],
        accessToken,
      },
      'CEO_OS'
    );

    // Persist updated/new tasks back to Supabase
    for (const task of result.updatedTasks) {
      await admin
        .from('tasks')
        .upsert(taskToRow(task, userId), { onConflict: 'user_id,local_id' });
    }

    // Persist task mappings (new imports/exports create new mapping rows)
    for (const mapping of result.updatedTaskMappings) {
      await admin.from('google_task_mappings').upsert(
        {
          user_id: userId,
          ceo_task_id: mapping.ceoTaskId,
          google_task_id: mapping.googleTaskId,
          google_task_list_id: mapping.googleTaskListId,
          google_etag: mapping.googleEtag ?? null,
          last_google_updated_at: mapping.lastGoogleUpdatedAt ?? null,
          last_ceo_updated_at: mapping.lastCeoUpdatedAt ?? null,
          sync_status: mapping.syncStatus,
        },
        { onConflict: 'user_id,google_task_id' }
      );
    }

    if (result.newLogs.length > 0) {
      await admin.from('google_sync_logs').insert(
        result.newLogs.map((log) => ({
          user_id: userId,
          event_type: log.eventType,
          details: log.details,
          entity_id: log.entityId ?? null,
          entity_title: log.entityTitle ?? null,
          is_error: Boolean(log.isError),
        }))
      );
    }

    await admin
      .from('google_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    return NextResponse.json({ ok: true, stats: result.stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.from('google_sync_logs').insert({
      user_id: userId,
      event_type: 'SYNC_FAILED',
      details: `Cron sync error: ${msg}`,
      is_error: true,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

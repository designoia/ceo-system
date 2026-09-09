import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getAppUserId } from '@/lib/supabase/admin';
import { rowToTask, taskToRow } from '@/lib/supabase/task-mapper';
import { Task } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = getSupabaseAdmin();
  const userId = await getAppUserId();
  if (!admin || !userId) {
    return NextResponse.json({ configured: false, tasks: [] });
  }

  const { data, error } = await admin
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, tasks: (data || []).map(rowToTask) });
}

export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin();
  const userId = await getAppUserId();
  if (!admin || !userId) {
    return NextResponse.json({ configured: false, synced: 0 });
  }

  const body = await request.json();
  const tasks: Task[] = Array.isArray(body.tasks) ? body.tasks : [];

  if (tasks.length === 0) {
    return NextResponse.json({ configured: true, synced: 0 });
  }

  const rows = tasks.map((t) => taskToRow(t, userId));
  const { error } = await admin
    .from('tasks')
    .upsert(rows, { onConflict: 'user_id,local_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, synced: rows.length });
}

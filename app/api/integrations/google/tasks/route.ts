import { NextRequest, NextResponse } from 'next/server';
import { GoogleTasksClient } from '@/lib/integrations/google/tasks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ceo_google_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized or not connected' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const client = new GoogleTasksClient(accessToken);

    if (listId) {
      const tasks = await client.listTasks(listId, { showCompleted: true });
      return NextResponse.json({ tasks });
    } else {
      const lists = await client.listTaskLists();
      return NextResponse.json({ lists });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ceo_google_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized or not connected' }, { status: 401 });
    }

    const body = await request.json();
    const { listId = '@default', title, notes, due, status } = body;
    const client = new GoogleTasksClient(accessToken);

    const task = await client.insertTask(listId, { title, notes, due, status });
    return NextResponse.json({ task });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

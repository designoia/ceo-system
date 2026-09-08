import { NextRequest, NextResponse } from 'next/server';
import { GoogleBidirectionalSyncEngine, SyncEngineContext } from '@/lib/integrations/google/sync';
import { SyncOrigin } from '@/lib/integrations/google/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = (body.origin || 'CEO_OS') as SyncOrigin;
    const ctx: SyncEngineContext = {
      tasks: body.tasks || [],
      scheduleEntries: body.scheduleEntries || [],
      connection: body.connection,
      taskListMappings: body.taskListMappings || [],
      taskMappings: body.taskMappings || [],
      calendarMappings: body.calendarMappings || [],
      accessToken: request.cookies.get('ceo_google_access_token')?.value || body.accessToken,
    };

    if (!ctx.connection) {
      return NextResponse.json({ error: 'Missing connection context' }, { status: 400 });
    }

    const result = await GoogleBidirectionalSyncEngine.runSync(ctx, origin);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

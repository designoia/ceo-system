import { NextRequest, NextResponse } from 'next/server';
import { GoogleBidirectionalSyncEngine, SyncEngineContext } from '@/lib/integrations/google/sync';
import { SyncOrigin } from '@/lib/integrations/google/types';
import { refreshAccessToken } from '@/lib/integrations/google/auth';

export const dynamic = 'force-dynamic';

function isAuthError(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  if (status === 401) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('[401]') || msg.includes('invalid_grant') || msg.includes('invalid authentication');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = (body.origin || 'CEO_OS') as SyncOrigin;

    const accessToken = request.cookies.get('ceo_google_access_token')?.value;
    const refreshToken = request.cookies.get('ceo_google_refresh_token')?.value;

    if (!body.connection) {
      return NextResponse.json({ error: 'Missing connection context' }, { status: 400 });
    }

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: 'Not connected to Google. Please reconnect in Settings.' },
        { status: 401 }
      );
    }

    const ctx: SyncEngineContext = {
      tasks: body.tasks || [],
      scheduleEntries: body.scheduleEntries || [],
      connection: body.connection,
      taskListMappings: body.taskListMappings || [],
      taskMappings: body.taskMappings || [],
      calendarMappings: body.calendarMappings || [],
      accessToken,
    };

    let newAccessToken: string | undefined;
    let newAccessTokenExpiresIn: number | undefined;

    let result;
    try {
      if (!ctx.accessToken) throw Object.assign(new Error('No access token'), { status: 401 });
      result = await GoogleBidirectionalSyncEngine.runSync(ctx, origin);
    } catch (err: unknown) {
      if (!isAuthError(err) || !refreshToken) {
        throw err;
      }

      // Access token expired or missing — refresh and retry once
      const refreshed = await refreshAccessToken(refreshToken);
      newAccessToken = refreshed.access_token;
      newAccessTokenExpiresIn = refreshed.expires_in;

      result = await GoogleBidirectionalSyncEngine.runSync(
        { ...ctx, accessToken: newAccessToken },
        origin
      );
    }

    const response = NextResponse.json(result);

    if (newAccessToken) {
      response.cookies.set('ceo_google_access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: newAccessTokenExpiresIn || 3600,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = isAuthError(err) ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/integrations/google/calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ceo_google_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized or not connected' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    const client = new GoogleCalendarClient(accessToken);

    const now = new Date();
    const timeMin = searchParams.get('timeMin') || new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21).toISOString();

    const result = await client.listEvents(calendarId, { timeMin, timeMax });
    return NextResponse.json(result);
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
    const { calendarId = 'primary', summary, description, startDateTime, endDateTime, timeZone, ceoTaskId, googleTaskId } = body;
    const client = new GoogleCalendarClient(accessToken);

    const event = await client.createEvent(calendarId, {
      summary,
      description,
      startDateTime,
      endDateTime,
      timeZone,
      ceoTaskId,
      googleTaskId,
    });

    return NextResponse.json({ event });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

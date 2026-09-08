import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthUrl, getGoogleClientId } from '@/lib/integrations/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'GOOGLE_CLIENT_ID is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local',
          isConfigured: false 
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/settings';
    const authUrl = generateGoogleAuthUrl(returnTo);

    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

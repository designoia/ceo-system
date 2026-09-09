import { NextRequest, NextResponse } from 'next/server';
import { revokeGoogleToken } from '@/lib/integrations/google/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ceo_google_access_token')?.value;
    if (accessToken) {
      await revokeGoogleToken(accessToken);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Google integration disconnected safely. CEO OS data preserved.',
    });

    response.cookies.delete('ceo_google_access_token');
    response.cookies.delete('ceo_google_refresh_token');
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { revokeGoogleToken } from '@/lib/integrations/google/auth';
import { getSupabaseAdmin, getAppUserId } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ceo_google_access_token')?.value;
    if (accessToken) {
      await revokeGoogleToken(accessToken);
    }

    try {
      const admin = getSupabaseAdmin();
      const userId = await getAppUserId();
      if (admin && userId) {
        await admin
          .from('google_connections')
          .update({ status: 'DISCONNECTED', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    } catch (dbErr) {
      console.error('Failed to update Supabase connection status:', dbErr);
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

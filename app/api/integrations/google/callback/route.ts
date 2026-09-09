import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, fetchGoogleUserProfile } from '@/lib/integrations/google/auth';
import { getSupabaseAdmin, getAppUserId } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') || '/settings';

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=No+code+provided', request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleUserProfile(tokens.access_token);

    // Persist tokens server-side so background sync (Vercel Cron) can run
    // without a browser session. Best-effort: if Supabase isn't configured,
    // the cookie-based flow below still works for in-app sync.
    try {
      const admin = getSupabaseAdmin();
      const userId = await getAppUserId();
      if (admin && userId) {
        const tokenExpiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null;

        const upsertData: Record<string, unknown> = {
          user_id: userId,
          google_account_email: profile.email,
          google_user_id: profile.id,
          access_token_encrypted: tokens.access_token,
          token_expires_at: tokenExpiresAt,
          status: 'CONNECTED',
          updated_at: new Date().toISOString(),
        };
        // Google only returns refresh_token on first consent — don't
        // overwrite a previously stored one with null on reconnect.
        if (tokens.refresh_token) {
          upsertData.refresh_token_encrypted = tokens.refresh_token;
        }

        await admin
          .from('google_connections')
          .upsert(upsertData, { onConflict: 'user_id' });
      }
    } catch (dbErr) {
      console.error('Failed to persist Google connection to Supabase:', dbErr);
    }

    // Redirect back with success parameters for the client-side store
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('google_connected', 'true');
    redirectUrl.searchParams.set('google_email', profile.email);
    if (tokens.access_token) {
      redirectUrl.searchParams.set('has_token', 'true');
    }

    const response = NextResponse.redirect(redirectUrl);
    // Set secure HTTP-only cookies for session
    if (tokens.access_token) {
      response.cookies.set('ceo_google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expires_in || 3600,
      });
    }
    if (tokens.refresh_token) {
      // Refresh tokens don't expire on a fixed schedule; keep for a long time (~180 days)
      response.cookies.set('ceo_google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 180,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(msg)}`, request.url));
  }
}

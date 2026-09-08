import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, fetchGoogleUserProfile } from '@/lib/integrations/google/auth';

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

    // In a full multi-tenant DB setup, save tokens to public.google_connections
    // For seamless client initialization, redirect back with success parameters
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('google_connected', 'true');
    redirectUrl.searchParams.set('google_email', profile.email);
    if (tokens.access_token) {
      redirectUrl.searchParams.set('has_token', 'true');
    }

    const response = NextResponse.redirect(redirectUrl);
    // Set secure HTTP-only cookies if needed for session
    if (tokens.access_token) {
      response.cookies.set('ceo_google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expires_in || 3600,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(msg)}`, request.url));
  }
}

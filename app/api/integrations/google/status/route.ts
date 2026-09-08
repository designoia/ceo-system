import { NextRequest, NextResponse } from 'next/server';
import { getGoogleClientId } from '@/lib/integrations/google/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = getGoogleClientId();
  const hasToken = Boolean(request.cookies.get('ceo_google_access_token')?.value);

  return NextResponse.json({
    isConfigured: Boolean(clientId),
    isConnected: hasToken,
    clientIdPresent: Boolean(clientId),
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback',
  });
}

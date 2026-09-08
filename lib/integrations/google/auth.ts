import { GoogleOAuthTokens } from './types';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
}

export function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || '';
}

export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/integrations/google/callback`;
  }
  return process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    : 'http://localhost:3000/api/integrations/google/callback';
}

/**
 * Generate Google OAuth 2.0 Consent URL with offline access and prompt=consent
 * ensuring refresh token is generated for server-side persistence.
 */
export function generateGoogleAuthUrl(state?: string): string {
  const clientId = getGoogleClientId();
  const redirectUri = getGoogleRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: REQUIRED_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: state || 'ceo_os_auth_state',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access and Refresh Tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const redirectUri = getGoogleRedirectUri();

  const bodyParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Refresh expired access token using securely stored refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Revoke token on disconnect
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ token });
    const response = await fetch(`${GOOGLE_REVOKE_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.ok;
  } catch (err) {
    console.warn('Revoke token warning:', err);
    return false;
  }
}

/**
 * Fetch connected Google user profile info
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<{ email: string; id: string; name?: string }> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  const data = await response.json();
  return {
    email: data.email,
    id: data.id,
    name: data.name,
  };
}

/**
 * Token string obfuscation/masking for safe non-secret UI logging
 */
export function maskToken(token?: string): string {
  if (!token) return 'None';
  if (token.length <= 8) return '****';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

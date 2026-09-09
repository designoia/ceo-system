import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;
let cachedUserId: string | null = null;

/**
 * Server-only Supabase client using the service role key. Bypasses RLS —
 * never expose this client or its key to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || url.includes('your-project-id')) {
    return null;
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cachedAdminClient;
}

/**
 * CEO OS is single-user. Returns the fixed auth.users UUID for the app
 * owner, creating that user (via Admin API) on first run if it doesn't
 * exist yet. All Supabase-backed tables key off this UUID.
 */
export async function getAppUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;

  const explicit = process.env.SUPABASE_USER_ID;
  if (explicit) {
    cachedUserId = explicit;
    return explicit;
  }

  const admin = getSupabaseAdmin();
  const email = process.env.SUPABASE_USER_EMAIL;
  if (!admin || !email) return null;

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) {
    cachedUserId = found.id;
    return found.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !created?.user) {
    console.error('Failed to create app user:', error?.message);
    return null;
  }

  cachedUserId = created.user.id;
  return created.user.id;
}

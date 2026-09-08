-- ==============================================================================
-- CEO OS — GOOGLE TASKS & GOOGLE CALENDAR BIDIRECTIONAL SYNC SCHEMA
-- ==============================================================================

-- 1. GOOGLE CONNECTIONS
create table if not exists public.google_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  google_account_email text not null,
  google_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes jsonb default '["https://www.googleapis.com/auth/tasks", "https://www.googleapis.com/auth/calendar.events"]'::jsonb,
  status text default 'CONNECTED', -- 'CONNECTED', 'DISCONNECTED', 'REAUTH_REQUIRED', 'ERROR'
  is_tasks_enabled boolean default true,
  is_calendar_enabled boolean default true,
  primary_calendar_id text default 'primary',
  selected_calendar_ids jsonb default '["primary"]'::jsonb,
  default_task_list_id text,
  task_list_mappings jsonb default '[]'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_google_connection unique (user_id)
);

-- 2. GOOGLE TASK MAPPINGS
create table if not exists public.google_task_mappings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ceo_task_id uuid references public.tasks on delete cascade not null,
  google_task_id text not null,
  google_task_list_id text not null,
  google_etag text,
  last_google_updated_at timestamptz,
  last_ceo_updated_at timestamptz,
  sync_status text default 'SYNCED', -- 'SYNCED', 'SYNCING', 'PENDING_SYNC', 'CONFLICT', 'DISCONNECTED', 'ERROR'
  sync_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_google_task unique (user_id, google_task_id),
  constraint unique_user_ceo_task unique (user_id, ceo_task_id)
);

-- 3. GOOGLE CALENDAR MAPPINGS
create table if not exists public.google_calendar_mappings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ceo_task_id uuid references public.tasks on delete set null,
  schedule_entry_id text,
  calendar_id text not null default 'primary',
  google_event_id text not null,
  google_event_etag text,
  last_google_updated_at timestamptz,
  last_ceo_updated_at timestamptz,
  sync_status text default 'SYNCED',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_google_event unique (user_id, google_event_id)
);

-- 4. GOOGLE CALENDAR SYNC STATES (Sync Tokens for incremental sync)
create table if not exists public.google_calendar_sync_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  calendar_id text not null,
  sync_token text,
  channel_id text,
  resource_id text,
  channel_expiration timestamptz,
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_calendar_state unique (user_id, calendar_id)
);

-- 5. GOOGLE SYNC AUDIT LOGS
create table if not exists public.google_sync_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null, -- 'GOOGLE_TASK_IMPORTED', 'GOOGLE_EVENT_CREATED', etc.
  details text not null,
  entity_id text,
  entity_title text,
  is_error boolean default false,
  created_at timestamptz default now()
);

-- 6. ALTER TASKS TABLE FOR GOOGLE EXTENSION
alter table public.tasks 
  add column if not exists source text default 'CEO_OS',
  add column if not exists external_task_id text,
  add column if not exists external_task_list_id text,
  add column if not exists google_etag text,
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_id text,
  add column if not exists sync_status text default 'SYNCED',
  add column if not exists sync_error text,
  add column if not exists last_synced_at timestamptz;

-- 7. RLS POLICIES
alter table public.google_connections enable row level security;
drop policy if exists "Users manage own google_connections" on public.google_connections;
create policy "Users manage own google_connections" on public.google_connections for all using (auth.uid() = user_id);

alter table public.google_task_mappings enable row level security;
drop policy if exists "Users manage own google_task_mappings" on public.google_task_mappings;
create policy "Users manage own google_task_mappings" on public.google_task_mappings for all using (auth.uid() = user_id);

alter table public.google_calendar_mappings enable row level security;
drop policy if exists "Users manage own google_calendar_mappings" on public.google_calendar_mappings;
create policy "Users manage own google_calendar_mappings" on public.google_calendar_mappings for all using (auth.uid() = user_id);

alter table public.google_calendar_sync_states enable row level security;
drop policy if exists "Users manage own google_calendar_sync_states" on public.google_calendar_sync_states;
create policy "Users manage own google_calendar_sync_states" on public.google_calendar_sync_states for all using (auth.uid() = user_id);

alter table public.google_sync_logs enable row level security;
drop policy if exists "Users manage own google_sync_logs" on public.google_sync_logs;
create policy "Users manage own google_sync_logs" on public.google_sync_logs for all using (auth.uid() = user_id);

-- 8. INDEXES
create index if not exists idx_google_task_mappings_lookup on public.google_task_mappings (user_id, google_task_id);
create index if not exists idx_google_calendar_mappings_lookup on public.google_calendar_mappings (user_id, google_event_id);
create index if not exists idx_google_sync_logs_user_date on public.google_sync_logs (user_id, created_at desc);

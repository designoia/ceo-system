-- CEO OS cloud sync (phone <-> laptop)
-- One row per synced record (task, goal, project, calendar, schedule block).
-- Each signed-in user can only ever see and change their own rows (Row Level Security).
-- Safe to run more than once.

create table if not exists public.sync_records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null,
  id         text        not null,
  data       jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

create index if not exists sync_records_user_updated_idx on public.sync_records (user_id, updated_at);

alter table public.sync_records enable row level security;

drop policy if exists "sync_records_owner_all" on public.sync_records;
create policy "sync_records_owner_all"
  on public.sync_records
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Live updates: lets the other device refresh within a second or two.
do $$
begin
  alter publication supabase_realtime add table public.sync_records;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

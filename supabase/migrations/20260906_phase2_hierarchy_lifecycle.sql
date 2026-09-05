-- ==============================================================================
-- CEO OS — PHASE 2 MIGRATION: HIERARCHY, LIFECYCLE & ACTIVITY LOGS
-- ==============================================================================

-- 1. Update Projects: Add parent_project_id for 2-level hierarchy & is_archived
alter table if exists public.projects
  add column if not exists parent_project_id uuid references public.projects(id) on delete cascade,
  add column if not exists is_archived boolean default false;

-- 2. Update Tasks: Add parent_task_id, due_date, overdue_at, last_status_change_at
alter table if exists public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete cascade,
  add column if not exists due_date date,
  add column if not exists overdue_at timestamptz,
  add column if not exists last_status_change_at timestamptz default now();

-- 3. Update Settings: Add timezone and daily_work_capacity_minutes
alter table if exists public.settings
  add column if not exists timezone text default 'Asia/Kolkata',
  add column if not exists daily_work_capacity_minutes int default 45;

-- 4. Create Activity Logs Table
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entity_type text not null, -- 'TASK', 'PROJECT', 'SYSTEM'
  entity_id text not null,
  title text not null,
  action text not null, -- 'STARTED', 'COMPLETED', 'ROLLED_OVER', 'STATUS_CHANGED', 'MUST_WIN_SET'
  details text,
  created_at timestamptz default now()
);

-- RLS for activity logs
alter table public.activity_logs enable row level security;
create policy "Users manage own activity logs" on public.activity_logs for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_projects_parent on public.projects (user_id, parent_project_id);
create index if not exists idx_tasks_parent on public.tasks (user_id, parent_task_id);
create index if not exists idx_tasks_overdue on public.tasks (user_id, status);
create index if not exists idx_activity_logs_user on public.activity_logs (user_id, created_at desc);

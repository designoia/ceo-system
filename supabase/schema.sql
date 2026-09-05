-- ==============================================================================
-- CEO OS — COMPLETE DATABASE SCHEMA (PHASE 1 + PHASE 2)
-- "5-Year Plan → Today's Action"
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. USER SETTINGS
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  theme text default 'dark',
  timezone text default 'Asia/Kolkata',
  daily_work_capacity_minutes int default 45,
  morning_notification_time text default '07:30',
  ceo_block_start text default '23:15',
  ceo_block_end text default '00:00',
  default_work_duration int default 45,
  rescue_mode_duration int default 10,
  notifications_enabled boolean default true,
  audio_chime_enabled boolean default true,
  last_active_date date default current_date,
  last_must_win_id text,
  updated_at timestamptz default now(),
  constraint unique_user_settings unique (user_id)
);

-- 3. BUSINESSES
create table if not exists public.businesses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null, -- 'COL', 'DESIGNOIA', 'CLIKIXPRESS', 'PERSONAL'
  name text not null,
  tagline text,
  description text,
  color text default '#3b82f6',
  icon_name text default 'Briefcase',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. 5-YEAR GOALS
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  business_code text not null,
  title text not null,
  category text default 'system', -- 'personal', 'revenue', 'infrastructure', 'scale', 'audience', 'system'
  target_year int not null,
  target_metric text,
  current_metric text,
  is_completed boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- 5. 60-MONTH STRATEGIC ROADMAP
create table if not exists public.months (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  year_month text not null, -- '2026-09'
  focus_title text not null,
  target_outcome text,
  kpis jsonb default '[]'::jsonb,
  definition_of_done text,
  is_current boolean default false,
  created_at timestamptz default now()
);

-- 6. PROJECTS (Hierarchical 2-Level)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  parent_project_id uuid references public.projects(id) on delete cascade,
  code text, -- 'P-001'
  name text not null,
  business_code text not null,
  month_year text,
  description text,
  success_definition text not null,
  status text default 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'
  priority text default 'P1', -- 'P1', 'P2', 'P3'
  start_date date,
  target_date date,
  related_goal_id text,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. TASKS (Lifecycle & Subtasks)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references public.projects on delete set null,
  parent_task_id uuid references public.tasks on delete cascade,
  code text, -- 'T-001'
  title text not null,
  business_code text not null,
  status text default 'TODAY', -- 'INBOX', 'BACKLOG', 'NEXT', 'THIS_WEEK', 'TODAY', 'OVERDUE', 'DONE', 'BLOCKED'
  priority text default 'P1', -- 'P1', 'P2', 'P3'
  is_must_win boolean default false,
  estimated_minutes int default 45,
  scheduled_date date default current_date,
  scheduled_time text default '23:15',
  due_date date,
  notes text,
  block_reason text,
  rescue_action text,
  overdue_at timestamptz,
  last_status_change_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. TASK LOGS
create table if not exists public.task_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete cascade not null,
  task_title text not null,
  business_code text not null,
  duration_minutes int not null,
  mode text default 'NORMAL', -- 'NORMAL', 'RESCUE_10MIN', 'DEEP_WORK'
  notes text,
  completed_at timestamptz default now()
);

-- 9. ACTIVITY LOGS
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entity_type text not null,
  entity_id text not null,
  title text not null,
  action text not null,
  details text,
  created_at timestamptz default now()
);

-- 10. SCHEDULE BLOCKS
create table if not exists public.schedule_blocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  start_time text not null,
  end_time text not null,
  category text not null,
  days_of_week jsonb default '[1,2,3,4,5,6]'::jsonb,
  is_ceo_time boolean default false,
  description text
);

-- 11. DAILY CHECK-INS
create table if not exists public.daily_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date,
  must_win_completed boolean default false,
  energy_rating text,
  missed_reason text,
  accomplishments text,
  created_at timestamptz default now()
);

-- 12. WEEKLY REVIEWS
create table if not exists public.weekly_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_start date not null,
  tasks_planned int default 0,
  tasks_completed int default 0,
  must_wins_completed int default 0,
  key_learning text,
  next_week_one_outcome text not null,
  created_at timestamptz default now()
);

-- 13. MONTHLY REVIEWS
create table if not exists public.monthly_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  year_month text not null,
  major_wins text,
  major_blockers text,
  what_to_continue text,
  what_to_stop text,
  what_to_change text,
  revenue_numeric numeric(12, 2) default 0,
  created_at timestamptz default now()
);

-- 14. DAILY CAPACITY (Date-Specific Capacity Engine)
create table if not exists public.daily_capacity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  capacity_minutes int not null default 45,
  source text not null default 'DEFAULT', -- 'DEFAULT', 'MANUAL', 'SCHEDULE_CALCULATED', 'EXTRA_TIME', 'REDUCED_TIME', 'LOW_ENERGY'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_daily_capacity unique (user_id, date)
);

-- 15. SCHEDULE OVERRIDES (Date-Specific Variances)
create table if not exists public.schedule_overrides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  block_type text not null, -- 'SCHOOL', 'TUITION', 'CLASSES', 'CEO_WORK', 'CUSTOM'
  is_off boolean default false,
  start_time text,
  end_time text,
  available_minutes_delta int default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. DAILY PLANS (Deterministic Daily Execution Plans)
create table if not exists public.daily_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  capacity_minutes int not null default 45,
  planned_minutes int not null default 0,
  must_win_task_id text,
  recommended_task_ids jsonb default '[]'::jsonb,
  status text not null default 'GENERATED', -- 'GENERATED', 'ACCEPTED', 'COMPLETED', 'DISMISSED'
  energy_level text default 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH'
  generated_at timestamptz default now(),
  accepted_at timestamptz,
  evening_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_daily_plan unique (user_id, date)
);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.businesses enable row level security;
alter table public.goals enable row level security;
alter table public.months enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.monthly_reviews enable row level security;
alter table public.daily_capacity enable row level security;
alter table public.schedule_overrides enable row level security;
alter table public.daily_plans enable row level security;

create policy "Users manage own profiles" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own settings" on public.settings for all using (auth.uid() = user_id);
create policy "Users manage own businesses" on public.businesses for all using (auth.uid() = user_id);
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);
create policy "Users manage own months" on public.months for all using (auth.uid() = user_id);
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users manage own task_logs" on public.task_logs for all using (auth.uid() = user_id);
create policy "Users manage own activity_logs" on public.activity_logs for all using (auth.uid() = user_id);
create policy "Users manage own schedule_blocks" on public.schedule_blocks for all using (auth.uid() = user_id);
create policy "Users manage own daily_checkins" on public.daily_checkins for all using (auth.uid() = user_id);
create policy "Users manage own weekly_reviews" on public.weekly_reviews for all using (auth.uid() = user_id);
create policy "Users manage own monthly_reviews" on public.monthly_reviews for all using (auth.uid() = user_id);
create policy "Users manage own daily_capacity" on public.daily_capacity for all using (auth.uid() = user_id);
create policy "Users manage own schedule_overrides" on public.schedule_overrides for all using (auth.uid() = user_id);
create policy "Users manage own daily_plans" on public.daily_plans for all using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_tasks_user_status on public.tasks (user_id, status);
create index if not exists idx_tasks_scheduled_date on public.tasks (user_id, scheduled_date);
create index if not exists idx_projects_parent on public.projects (user_id, parent_project_id);
create index if not exists idx_tasks_parent on public.tasks (user_id, parent_task_id);
create index if not exists idx_activity_logs_user on public.activity_logs (user_id, created_at desc);
create index if not exists idx_daily_capacity_date on public.daily_capacity (user_id, date);
create index if not exists idx_schedule_overrides_date on public.schedule_overrides (user_id, date);
create index if not exists idx_daily_plans_date on public.daily_plans (user_id, date);


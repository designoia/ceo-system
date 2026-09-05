-- ==============================================================================
-- CEO OS — PHASE 3 MIGRATION: DAILY PLANNING & CAPACITY ENGINE
-- ==============================================================================

-- 1. Daily Capacity Table (Date-specific capacity in minutes)
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

-- RLS for daily_capacity
alter table public.daily_capacity enable row level security;
create policy "Users manage own daily capacity" on public.daily_capacity for all using (auth.uid() = user_id);

-- 2. Schedule Overrides Table (Date-specific variances that do not touch recurring schedule)
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

-- RLS for schedule_overrides
alter table public.schedule_overrides enable row level security;
create policy "Users manage own schedule overrides" on public.schedule_overrides for all using (auth.uid() = user_id);

-- 3. Daily Plans Table (Deterministic daily execution plans)
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

-- RLS for daily_plans
alter table public.daily_plans enable row level security;
create policy "Users manage own daily plans" on public.daily_plans for all using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_daily_capacity_date on public.daily_capacity (user_id, date);
create index if not exists idx_schedule_overrides_date on public.schedule_overrides (user_id, date);
create index if not exists idx_daily_plans_date on public.daily_plans (user_id, date);

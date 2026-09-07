-- ==============================================================================
-- CEO OS — PHASE 5 MIGRATION: DAILY SCHEDULER (PLANNED VS ACTUAL TIME SYSTEM)
-- ==============================================================================

-- 1. Schedule Entries Table
create table if not exists public.schedule_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  schedule_date date not null,
  
  -- Planned Window
  planned_start_time text not null, -- '08:00'
  planned_end_time text not null,   -- '08:50'
  planned_duration_minutes int not null default 0,
  
  -- Actual Execution Window
  actual_start_time text,           -- '08:15'
  actual_end_time text,             -- '08:52'
  actual_duration_minutes int,
  
  -- Content & Categorization
  title text not null,
  description text,
  activity_type text not null default 'BUSINESS', -- 'SCHOOL', 'TUITION', 'CLASSES', 'BUSINESS', 'PERSONAL', 'REST', 'BUFFER', 'MEETING', 'ADMIN', 'DEVELOPMENT', 'CONTENT', 'PLANNING', 'TRAVEL'
  
  -- Relational Links (References existing hierarchy without duplication)
  business_code text,               -- 'DESIGNOIA', 'COL', 'CLIKIXPRESS', 'PERSONAL'
  project_id text,
  sub_project_id text,
  task_id text,
  
  -- Execution Lifecycle
  status text not null default 'PLANNED', -- 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED', 'RESCHEDULED'
  is_must_win boolean default false,
  
  -- Context & Deviations
  remarks text,
  reminder_minutes_before int,      -- e.g. 5, 10, 15, 30
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for schedule_entries
alter table public.schedule_entries enable row level security;
create policy "Users manage own schedule entries" on public.schedule_entries for all using (auth.uid() = user_id);

-- 2. Daily Schedule Reviews Table (Nightly Planned vs Actual Reflection)
create table if not exists public.schedule_day_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  review_date date not null,
  planned_total_minutes int not null default 0,
  actual_total_minutes int not null default 0,
  variance_minutes int not null default 0,
  planning_accuracy_percent int not null default 100,
  completed_blocks_count int not null default 0,
  missed_blocks_count int not null default 0,
  rescheduled_blocks_count int not null default 0,
  must_win_completed boolean default false,
  primary_difference_reason text, -- 'UNEXPECTED_WORK', 'MEETING_DELAY', 'LOW_ENERGY', 'SCHOOL_ISSUE', 'PERSONAL', 'OTHER'
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_day_review unique (user_id, review_date)
);

-- RLS for schedule_day_reviews
alter table public.schedule_day_reviews enable row level security;
create policy "Users manage own schedule day reviews" on public.schedule_day_reviews for all using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_schedule_entries_user_date on public.schedule_entries (user_id, schedule_date);
create index if not exists idx_schedule_entries_task on public.schedule_entries (user_id, task_id);
create index if not exists idx_schedule_entries_project on public.schedule_entries (user_id, project_id);
create index if not exists idx_schedule_day_reviews_date on public.schedule_day_reviews (user_id, review_date);

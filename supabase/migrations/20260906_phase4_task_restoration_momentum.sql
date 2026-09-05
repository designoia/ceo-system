-- ==============================================================================
-- CEO OS — PHASE 4 MIGRATION: TASK RESTORATION, SOFT DELETE & MOMENTUM
-- ==============================================================================

-- 1. Update Tasks Table: Add previous_status, is_deleted, deleted_at
alter table if exists public.tasks
  add column if not exists previous_status text default 'TODAY',
  add column if not exists is_deleted boolean default false,
  add column if not exists deleted_at timestamptz;

-- 2. Performance Indexes for Task Lifecycle & Momentum Queries
create index if not exists idx_tasks_active on public.tasks (user_id, is_deleted, status);
create index if not exists idx_tasks_completed_dates on public.tasks (user_id, completed_at desc) where status = 'DONE' and is_deleted = false;
create index if not exists idx_tasks_trash on public.tasks (user_id, is_deleted) where is_deleted = true;

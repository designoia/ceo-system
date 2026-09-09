-- ==============================================================================
-- CEO OS — BRIDGE LOCAL (CLIENT-GENERATED) TASK IDS TO THE UUID PRIMARY KEY
-- ==============================================================================
-- The client app generates its own string task ids (e.g. "task-prorido-home",
-- "task-gt-<googleTaskId>"), while public.tasks.id is a uuid. This column lets
-- server-side sync code reconcile the two without changing the primary key.

alter table public.tasks
  add column if not exists local_id text;

create unique index if not exists idx_tasks_user_local_id
  on public.tasks (user_id, local_id)
  where local_id is not null;

-- ==============================================================================
-- CEO OS — AI COMMAND CENTER & BOT CONFIGURATION SCHEMA
-- ==============================================================================

-- 17. AI BOTS CONFIGURATION
create table if not exists public.ai_bots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  slug text not null,
  description text not null,
  icon text not null default 'Bot',
  category text not null, -- 'strategy', 'research', 'marketing', 'sales', 'operations', 'finance', 'automation'
  system_prompt text not null,
  welcome_message text not null,
  conversation_starters jsonb default '[]'::jsonb,
  model_provider text default 'openrouter',
  model_name text default 'anthropic/claude-3.5-sonnet',
  temperature numeric(3, 2) default 0.7,
  knowledge_base_enabled boolean default false,
  web_search_enabled boolean default false,
  tools_enabled jsonb default '[]'::jsonb,
  output_actions jsonb default '[]'::jsonb,
  capabilities jsonb default '[]'::jsonb,
  example_use_cases jsonb default '[]'::jsonb,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_bot_slug unique (slug)
);

-- 18. AI BOT FAVORITES
create table if not exists public.ai_bot_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  bot_slug text not null,
  created_at timestamptz default now(),
  constraint unique_user_bot_favorite unique (user_id, bot_slug)
);

-- RLS Policies
alter table public.ai_bots enable row level security;
drop policy if exists "Users view and manage ai_bots" on public.ai_bots;
create policy "Users view and manage ai_bots" on public.ai_bots for all using (
  user_id is null or auth.uid() = user_id
);

alter table public.ai_bot_favorites enable row level security;
drop policy if exists "Users manage own ai_bot_favorites" on public.ai_bot_favorites;
create policy "Users manage own ai_bot_favorites" on public.ai_bot_favorites for all using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_ai_bots_category on public.ai_bots (category);
create index if not exists idx_ai_bots_slug on public.ai_bots (slug);
create index if not exists idx_ai_bots_sort_order on public.ai_bots (sort_order);
create index if not exists idx_ai_bot_favorites_user on public.ai_bot_favorites (user_id);

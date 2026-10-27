-- ============================================
-- 今天吃什么 · Supabase 数据库结构
-- 用法：Supabase 控制台 → SQL Editor → 粘贴本文件 → Run
-- ============================================

-- 1. 用户偏好：自定义忌口食材 + 自定义疾病（每个用户一行，upsert 覆盖）
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  custom_diets jsonb not null default '[]'::jsonb,      -- string[]
  custom_diseases jsonb not null default '[]'::jsonb,   -- { name: string, avoid: string[] }[]
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. 历史记录：每次成功生成菜谱的完整快照
create table if not exists public.recipe_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredients jsonb not null default '[]'::jsonb,  -- { name, category }[]
  plans jsonb not null default '[]'::jsonb,        -- RecipePlan[]
  preferences jsonb not null default '{}'::jsonb,  -- { tastes, diets, diseases, customDiets, customDiseases }
  created_at timestamptz not null default now()
);

alter table public.recipe_history enable row level security;

create policy "read own history"
  on public.recipe_history for select
  using (auth.uid() = user_id);

create policy "insert own history"
  on public.recipe_history for insert
  with check (auth.uid() = user_id);

create index if not exists recipe_history_user_created_idx
  on public.recipe_history (user_id, created_at desc);

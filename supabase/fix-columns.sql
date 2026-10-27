-- ============================================
-- 修复脚本：为已存在的表补齐缺失列 + 确保 RLS 策略就位
-- 用法：Supabase 控制台 → SQL Editor → 粘贴本文件 → Run
-- ============================================

-- 1. 补齐 user_preferences 缺失列
alter table public.user_preferences
  add column if not exists custom_diets jsonb not null default '[]'::jsonb,
  add column if not exists custom_diseases jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- 2. 补齐 recipe_history 缺失列
alter table public.recipe_history
  add column if not exists ingredients jsonb not null default '[]'::jsonb,
  add column if not exists plans jsonb not null default '[]'::jsonb,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- 3. 确保 RLS 开启（已开启则无副作用）
alter table public.user_preferences enable row level security;
alter table public.recipe_history enable row level security;

-- 4. 重建策略（先删后建，幂等）
drop policy if exists "read own preferences" on public.user_preferences;
drop policy if exists "insert own preferences" on public.user_preferences;
drop policy if exists "update own preferences" on public.user_preferences;

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

drop policy if exists "read own history" on public.recipe_history;
drop policy if exists "insert own history" on public.recipe_history;

create policy "read own history"
  on public.recipe_history for select
  using (auth.uid() = user_id);
create policy "insert own history"
  on public.recipe_history for insert
  with check (auth.uid() = user_id);

-- 5. 索引
create index if not exists recipe_history_user_created_idx
  on public.recipe_history (user_id, created_at desc);

-- 6. 刷新 PostgREST schema 缓存
notify pgrst, 'reload schema';

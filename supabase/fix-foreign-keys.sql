-- ============================================
-- 修复脚本 2：把 user_id 外键重新指向 Supabase Auth 的 auth.users
-- 用法：Supabase 控制台 → SQL Editor → 粘贴本文件 → Run
-- ============================================

-- 1. user_preferences：删除旧外键（指向其他用户表），改为 auth.users
alter table public.user_preferences
  drop constraint if exists user_preferences_user_id_fkey;

alter table public.user_preferences
  add constraint user_preferences_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 2. recipe_history：同样处理
alter table public.recipe_history
  drop constraint if exists recipe_history_user_id_fkey;

alter table public.recipe_history
  add constraint recipe_history_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 3. 刷新缓存
notify pgrst, 'reload schema';

-- 如果执行报错「insert or update ... violates foreign key」且提到已存在的行，
-- 说明旧表里有历史脏数据指向旧用户表，清空后再跑本脚本即可：
--   truncate public.user_preferences;
--   truncate public.recipe_history;

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 是否已正确配置 Supabase 环境变量 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && url.startsWith('https://') && !url.includes('你的项目ID')
);

export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

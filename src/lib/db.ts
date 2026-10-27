// Supabase 数据访问层：用户偏好 + 历史记录
import { supabase } from './supabase';
import type { IngredientTag, RecipePlan } from '@/types/types';

export interface CustomDisease {
  name: string;
  avoid: string[];
}

export interface PreferencesSnapshot {
  tastes: string[];
  diets: string[];
  diseases: string[];
  customDiets: string[];
  customDiseases: CustomDisease[];
}

export interface HistoryRecord {
  id: string;
  created_at: string;
  ingredients: IngredientTag[];
  plans: RecipePlan[];
  preferences: PreferencesSnapshot;
}

/** 读取登录用户的自定义忌口与自定义疾病；无记录时返回 null */
export async function loadPreferences(
  userId: string
): Promise<{ customDiets: string[]; customDiseases: CustomDisease[] } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('custom_diets, custom_diseases')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('加载偏好失败:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    customDiets: (data.custom_diets as string[]) ?? [],
    customDiseases: (data.custom_diseases as CustomDisease[]) ?? [],
  };
}

/** 覆盖保存登录用户的自定义忌口与自定义疾病 */
export async function savePreferences(
  userId: string,
  customDiets: string[],
  customDiseases: CustomDisease[]
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    custom_diets: customDiets,
    custom_diseases: customDiseases,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn('保存偏好失败:', error.message);
}

/** 生成成功后写入一条历史记录 */
export async function saveHistory(
  userId: string,
  payload: { ingredients: IngredientTag[]; plans: RecipePlan[]; preferences: PreferencesSnapshot }
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('recipe_history').insert({
    user_id: userId,
    ingredients: payload.ingredients,
    plans: payload.plans,
    preferences: payload.preferences,
  });
  if (error) console.warn('保存历史记录失败:', error.message);
}

/** 按时间倒序拉取当前用户的历史记录 */
export async function listHistory(userId: string): Promise<{ records: HistoryRecord[]; error: string | null }> {
  if (!supabase) return { records: [], error: '未配置 Supabase' };
  const { data, error } = await supabase
    .from('recipe_history')
    .select('id, created_at, ingredients, plans, preferences')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { records: [], error: error.message };
  return { records: (data as HistoryRecord[]) ?? [], error: null };
}

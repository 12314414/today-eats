import type { RecipePlan } from '../types/types';
import { apiUrl } from './api';

export interface GeneratePayload {
  ingredients: string[];
  tastes: string[];
  excludes: string[];
  diseases: string[];
}

/** 调用后端接口，用大模型生成三套「三菜一汤」方案 */
export async function generateRecipes(payload: GeneratePayload): Promise<RecipePlan[]> {
  const resp = await fetch(apiUrl('/api/generate-recipes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error ?? `识别服务异常（HTTP ${resp.status}）`);
  }
  return data.plans as RecipePlan[];
}

/** API 地址：本地开发走 Vite 代理（/api/*）；部署到 GitHub Pages 时指向 Supabase Edge Functions */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

export function apiUrl(path: '/api/recognize' | '/api/generate-recipes'): string {
  if (!API_BASE) return path;
  // Supabase Functions 路径无 /api 前缀：/functions/v1/recognize
  return API_BASE + path.replace(/^\/api/, '');
}

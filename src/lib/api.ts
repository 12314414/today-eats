/** API 地址：本地开发走 Vite 代理（/api/*）；部署到 GitHub Pages 时指向 Supabase Edge Functions */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export function apiUrl(path: '/api/recognize' | '/api/generate-recipes'): string {
  if (!API_BASE) return path;
  // Supabase Functions 路径无 /api 前缀：/functions/v1/recognize
  return API_BASE + path.replace(/^\/api/, '');
}

/** Edge Functions 默认要求 Authorization 头；anon key 本是公开密钥，直接带上 */
export function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_BASE && ANON_KEY) {
    headers['Authorization'] = `Bearer ${ANON_KEY}`;
    headers['apikey'] = ANON_KEY;
  }
  return headers;
}

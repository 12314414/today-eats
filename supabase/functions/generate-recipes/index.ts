// Supabase Edge Function: generate-recipes（qwen-plus 生成三套三菜一汤方案）
// 部署后在 Supabase Secrets 配置 DASHSCOPE_API_KEY
// 创建函数时请关闭 "Enforce JWT Verification"（前端直接调用）

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const API_KEY = Deno.env.get('DASHSCOPE_API_KEY') ?? '';
const TEXT_MODEL = Deno.env.get('DASHSCOPE_TEXT_MODEL') ?? 'qwen-plus';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DIFFICULTIES = ['简单', '中等', '困难'];

interface RawDish {
  name?: unknown; description?: unknown; difficulty?: unknown; duration?: unknown;
  ingredients?: unknown; steps?: unknown; isSoup?: unknown;
}
interface RawPlan {
  name?: unknown; tagline?: unknown; nutritionTip?: unknown; dishes?: unknown;
}

function extractJsonArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function normalizePlans(raw: unknown) {
  if (!Array.isArray(raw)) return null;
  const plans = (raw as RawPlan[]).slice(0, 3).map((p, i) => ({
    id: i + 1,
    name: String(p?.name ?? `方案${i + 1}`),
    tagline: String(p?.tagline ?? ''),
    nutritionTip: String(p?.nutritionTip ?? ''),
    dishes: (Array.isArray(p?.dishes) ? (p.dishes as RawDish[]) : []).slice(0, 4).map((d) => ({
      name: String(d?.name ?? '未命名'),
      description: String(d?.description ?? ''),
      difficulty: DIFFICULTIES.includes(d?.difficulty as string) ? d.difficulty : '中等',
      duration: String(d?.duration ?? '20分钟'),
      ingredients: Array.isArray(d?.ingredients) ? d.ingredients.map(String) : [],
      steps: Array.isArray(d?.steps) ? d.steps.map(String) : [],
      isSoup: !!d?.isSoup,
    })),
  })).filter((p) => p.dishes.length > 0);
  return plans.length > 0 ? plans : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: CORS });
  }
  if (!API_KEY || API_KEY.includes('xxxx')) {
    return Response.json({ error: '服务端未配置 DASHSCOPE_API_KEY' }, { status: 500, headers: CORS });
  }

  let body: { ingredients?: string[]; tastes?: string[]; excludes?: string[]; diseases?: string[] } = {};
  try {
    body = await req.json();
  } catch { /* ignore */ }
  const { ingredients, tastes = [], excludes = [], diseases = [] } = body;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return Response.json({ error: '缺少食材列表' }, { status: 400, headers: CORS });
  }

  const prompt =
    '你是一位中餐营养师和厨师。请根据以下条件设计 3 套差异化的「三菜一汤」方案（每套恰好 3 道菜 + 1 道汤）。\n' +
    `可用食材：${ingredients.join('、')}（可使用常见调味品，如油盐酱醋）\n` +
    (tastes.length ? `口味偏好：${tastes.join('、')}\n` : '') +
    (excludes.length ? `严格排除的食材（任何菜品都不得含有）：${excludes.join('、')}\n` : '') +
    (diseases.length ? `需要考虑的疾病/体质：${diseases.join('、')}（菜品需适合，并在 nutritionTip 中说明友好点）\n` : '') +
    '要求：\n' +
    '1. 三套方案风格差异化（如快手家常 / 营养进阶 / 宴客水准）；\n' +
    '2. 若某道菜的理想食材被排除，请用可用食材替代，并在 description 里说明替代建议；涉及疾病需限量的食材，在 steps 中标注建议用量；\n' +
    '3. 每道菜给出：name（菜名）、description（一句话描述，含替代/限量建议）、difficulty（简单/中等/困难）、duration（如"15分钟"）、ingredients（所需食材调料清单，字符串数组）、steps（分步骤做法，字符串数组，每步一句话）、isSoup（汤为 true，其余 false）；\n' +
    '4. 每套方案给出：name（方案名）、tagline（一句话卖点）、nutritionTip（针对所选疾病/体质的营养提示，无疾病则给普通健康提示）；\n' +
    '5. 只输出一个 JSON 数组（3 个方案对象），不要输出任何其他文字。\n' +
    '输出格式示例：[{"name":"方案一·快手家常","tagline":"...","nutritionTip":"...","dishes":[{"name":"番茄炒蛋","description":"...","difficulty":"简单","duration":"10分钟","ingredients":["番茄 2个","鸡蛋 3个"],"steps":["鸡蛋打散..."],"isSoup":false}]}]';

  try {
    const resp = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEXT_MODEL,
        max_tokens: 8000,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });
    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => '');
      console.error('DashScope 错误:', resp.status, bodyText.slice(0, 300));
      const msg = resp.status === 401 ? 'API Key 无效'
        : resp.status === 403 ? '该模型未开通权限'
        : resp.status === 429 ? '调用额度不足或触发限流，请稍后再试'
        : `AI 服务返回错误（HTTP ${resp.status}）`;
      return Response.json({ error: msg }, { status: 502, headers: CORS });
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const plans = normalizePlans(extractJsonArray(text));
    if (!plans) {
      return Response.json({ error: 'AI 返回格式异常，请重试' }, { status: 502, headers: CORS });
    }
    return Response.json({ plans }, { headers: CORS });
  } catch (err) {
    console.error('生成菜谱异常:', err);
    return Response.json({ error: '无法连接 AI 服务，请检查网络' }, { status: 502, headers: CORS });
  }
});

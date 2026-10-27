// Supabase Edge Function: recognize（通义千问 VL 图片识别食材）
// 部署后在 Supabase Secrets 配置 DASHSCOPE_API_KEY
// 创建函数时请关闭 "Enforce JWT Verification"（前端直接调用）

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const API_KEY = Deno.env.get('DASHSCOPE_API_KEY') ?? '';
const VL_MODEL = Deno.env.get('DASHSCOPE_MODEL') ?? 'qwen3-vl-plus';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PROMPT =
  '请识别这张冰箱/食材照片中的所有食材。' +
  '只输出 JSON 数组，不要输出其他内容。' +
  '格式：[{"name":"食材中文名","category":"分类"}]，分类只能是：蔬菜、肉类、水果、蛋奶、豆制品、调味品、主食、其他。' +
  '只列出明确可见的食材，不要猜测。';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: CORS });
  }
  if (!API_KEY || API_KEY.includes('xxxx')) {
    return Response.json({ error: '服务端未配置 DASHSCOPE_API_KEY' }, { status: 500, headers: CORS });
  }

  let image: string | undefined;
  try {
    image = (await req.json())?.image;
  } catch { /* ignore */ }
  if (!image || typeof image !== 'string') {
    return Response.json({ error: '缺少图片数据' }, { status: 400, headers: CORS });
  }

  try {
    const resp = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VL_MODEL,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('DashScope 错误:', resp.status, body.slice(0, 300));
      const msg = resp.status === 401 ? 'API Key 无效'
        : resp.status === 403 ? '该模型未开通权限'
        : resp.status === 429 ? '调用额度不足或触发限流，请稍后再试'
        : `AI 服务返回错误（HTTP ${resp.status}）`;
      return Response.json({ error: msg }, { status: 502, headers: CORS });
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const ingredients = extractJsonArray(text);
    if (!ingredients) {
      return Response.json({ error: 'AI 返回格式异常，请重试' }, { status: 502, headers: CORS });
    }
    return Response.json({ ingredients }, { headers: CORS });
  } catch (err) {
    console.error('识别异常:', err);
    return Response.json({ error: '无法连接 AI 服务，请检查网络' }, { status: 502, headers: CORS });
  }
});

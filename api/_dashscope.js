// Vercel Serverless 共享模块：DashScope 调用 + 结果解析
// 环境变量由 Vercel 注入（DASHSCOPE_API_KEY / DASHSCOPE_MODEL / DASHSCOPE_TEXT_MODEL）

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const API_KEY = process.env.DASHSCOPE_API_KEY || '';
const VL_MODEL = process.env.DASHSCOPE_MODEL || 'qwen3-vl-plus';
const TEXT_MODEL = process.env.DASHSCOPE_TEXT_MODEL || 'qwen-plus';

const KEY_READY = !!API_KEY && !API_KEY.includes('xxxx');

async function callDashscope({ model, messages, maxTokens }) {
  const resp = await fetch(DASHSCOPE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    const err = new Error(`DashScope HTTP ${resp.status}`);
    err.status = resp.status;
    err.body = body.slice(0, 300);
    throw err;
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

const DIFFICULTIES = ['简单', '中等', '困难'];

function normalizePlans(raw) {
  if (!Array.isArray(raw)) return null;
  const plans = raw.slice(0, 3).map((p, i) => ({
    id: i + 1,
    name: String(p?.name ?? `方案${i + 1}`),
    tagline: String(p?.tagline ?? ''),
    nutritionTip: String(p?.nutritionTip ?? ''),
    dishes: (Array.isArray(p?.dishes) ? p.dishes : []).slice(0, 4).map((d) => ({
      name: String(d?.name ?? '未命名'),
      description: String(d?.description ?? ''),
      difficulty: DIFFICULTIES.includes(d?.difficulty) ? d.difficulty : '中等',
      duration: String(d?.duration ?? '20分钟'),
      ingredients: Array.isArray(d?.ingredients) ? d.ingredients.map(String) : [],
      steps: Array.isArray(d?.steps) ? d.steps.map(String) : [],
      isSoup: !!d?.isSoup,
    })),
  })).filter((p) => p.dishes.length > 0);
  return plans.length > 0 ? plans : null;
}

function handleDashscopeError(res, err, logPrefix) {
  console.error(logPrefix, err.status, err.body || err.message);
  if (err.status === 401) return res.status(502).json({ error: 'API Key 无效' });
  if (err.status === 403) return res.status(502).json({ error: '该模型未开通权限，请到阿里云百炼控制台开通' });
  if (err.status === 429) return res.status(502).json({ error: '调用额度不足或触发限流，请稍后再试' });
  return res.status(502).json({ error: `AI 服务返回错误（HTTP ${err.status || '网络'}）` });
}

module.exports = { KEY_READY, VL_MODEL, TEXT_MODEL, callDashscope, extractJsonArray, normalizePlans, handleDashscopeError };

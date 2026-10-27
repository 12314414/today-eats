// ============================================
// 今天吃什么 · 后端服务
// 职责：代理调用阿里云通义千问 VL，API KEY 只存在于服务端环境变量
// 启动：node server/index.js（或 npm run server）
// ============================================
import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json({ limit: '12mb' })); // base64 图片较大

const API_KEY = process.env.DASHSCOPE_API_KEY;
const KEY_READY = !!API_KEY && !API_KEY.includes('xxxx');
const MODEL = process.env.DASHSCOPE_MODEL || 'qwen3-vl-plus';
const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const CATEGORIES = ['蔬菜', '肉类', '海鲜', '蛋奶', '水果', '豆制品', '菌菇', '主食', '调味品', '其他'];

/** 从模型输出中稳健提取食材 JSON 数组 */
function extractIngredients(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return null;
    return arr
      .filter((x) => x && typeof x.name === 'string' && x.name.trim())
      .map((x) => ({
        name: x.name.trim(),
        category: CATEGORIES.includes(x.category) ? x.category : '其他',
      }))
      .slice(0, 30);
  } catch {
    return null;
  }
}

app.post('/api/recognize', async (req, res) => {
  if (!KEY_READY) {
    return res.status(500).json({ error: '服务端未配置 DASHSCOPE_API_KEY，请在 .env 中填写后重启 server' });
  }

  const { image } = req.body ?? {};
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: '请求体需要 image 字段（data:image/...;base64,... 格式）' });
  }

  try {
    const resp = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image } },
              {
                type: 'text',
                text:
                  '识别这张冰箱/食材照片中的所有食材。只输出一个 JSON 数组，不要输出任何其他文字。' +
                  '数组每项格式为 {"name": "食材中文名", "category": "分类"}，' +
                  `category 只能从以下取值中选择：${CATEGORIES.join('、')}。` +
                  '只识别可以吃的东西，忽略容器、包装、餐具等。',
              },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('DashScope 错误:', resp.status, body.slice(0, 300));
      if (resp.status === 401) return res.status(502).json({ error: 'API Key 无效，请检查 DASHSCOPE_API_KEY' });
      if (resp.status === 429) return res.status(502).json({ error: '调用额度不足或触发限流，请稍后再试' });
      return res.status(502).json({ error: `AI 服务返回错误（HTTP ${resp.status}）` });
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const ingredients = extractIngredients(text);

    if (!ingredients) {
      console.error('模型输出无法解析:', text.slice(0, 300));
      return res.status(502).json({ error: 'AI 返回格式异常，请重试' });
    }
    return res.json({ ingredients });
  } catch (err) {
    console.error('识别请求异常:', err);
    return res.status(502).json({ error: '无法连接 AI 服务，请检查网络' });
  }
});

const TEXT_MODEL = process.env.DASHSCOPE_TEXT_MODEL || 'qwen-plus';

/** 从模型输出中提取 JSON 数组（兼容 ```json 代码块包裹） */
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

/** 规范化一套方案，字段缺失时填默认值，保证前端不炸 */
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

app.post('/api/generate-recipes', async (req, res) => {
  if (!KEY_READY) {
    return res.status(500).json({ error: '服务端未配置 DASHSCOPE_API_KEY' });
  }

  const { ingredients, tastes = [], excludes = [], diseases = [] } = req.body ?? {};
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: '缺少食材列表' });
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
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        max_tokens: 8000,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error('DashScope 错误:', resp.status, body.slice(0, 300));
      if (resp.status === 401) return res.status(502).json({ error: 'API Key 无效' });
      if (resp.status === 429) return res.status(502).json({ error: '调用额度不足或触发限流，请稍后再试' });
      return res.status(502).json({ error: `AI 服务返回错误（HTTP ${resp.status}）` });
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const plans = normalizePlans(extractJsonArray(text));
    if (!plans) {
      console.error('菜谱输出无法解析:', text.slice(0, 300));
      return res.status(502).json({ error: 'AI 返回格式异常，请重试' });
    }
    return res.json({ plans });
  } catch (err) {
    console.error('生成菜谱异常:', err);
    return res.status(502).json({ error: '无法连接 AI 服务，请检查网络' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, keyConfigured: KEY_READY, model: MODEL, textModel: TEXT_MODEL });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ API server: http://localhost:${PORT}`);
  console.log(`  DASHSCOPE_API_KEY: ${KEY_READY ? '已配置' : '⚠ 未配置（.env 中填写 DASHSCOPE_API_KEY）'}`);
  console.log(`  模型: ${MODEL}`);
});

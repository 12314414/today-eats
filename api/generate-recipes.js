// Vercel Serverless Function: POST /api/generate-recipes
const { KEY_READY, TEXT_MODEL, callDashscope, extractJsonArray, normalizePlans, handleDashscopeError } = require('./_dashscope');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!KEY_READY) return res.status(500).json({ error: '服务端未配置 DASHSCOPE_API_KEY' });

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
    const text = await callDashscope({ model: TEXT_MODEL, maxTokens: 8000, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }] });
    const plans = normalizePlans(extractJsonArray(text));
    if (!plans) {
      return res.status(502).json({ error: 'AI 返回格式异常，请重试' });
    }
    return res.json({ plans });
  } catch (err) {
    return handleDashscopeError(res, err, '生成菜谱异常:');
  }
};

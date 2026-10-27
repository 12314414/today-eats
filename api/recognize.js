// Vercel Serverless Function: POST /api/recognize
const { KEY_READY, VL_MODEL, callDashscope, extractJsonArray, handleDashscopeError } = require('./_dashscope');

const PROMPT =
  '请识别这张冰箱/食材照片中的所有食材。' +
  '只输出 JSON 数组，不要输出其他内容。' +
  '格式：[{"name":"食材中文名","category":"分类"}]，分类只能是：蔬菜、肉类、水果、蛋奶、豆制品、调味品、主食、其他。' +
  '只列出明确可见的食材，不要猜测。';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!KEY_READY) return res.status(500).json({ error: '服务端未配置 DASHSCOPE_API_KEY' });

  const { image } = req.body ?? {};
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: '缺少图片数据' });
  }

  try {
    const text = await callDashscope({
      model: VL_MODEL,
      maxTokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image } },
          { type: 'text', text: PROMPT },
        ],
      }],
    });
    const ingredients = extractJsonArray(text);
    if (!ingredients) {
      return res.status(502).json({ error: 'AI 返回格式异常，请重试' });
    }
    return res.json({ ingredients });
  } catch (err) {
    return handleDashscopeError(res, err, '识别异常:');
  }
};

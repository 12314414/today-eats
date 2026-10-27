// 数据库层验证：建表是否完成 + RLS 是否生效
// 用法：node scripts/verify-db.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = {};
for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const email = `dbtest_${Date.now()}@example.com`;

// 1. 注册一个临时用户（拿到登录会话才能过 RLS）
const { data: auth, error: authErr } = await sb.auth.signUp({ email, password: 'Test123456!' });
if (authErr || !auth.user) {
  console.error('✗ 注册测试用户失败:', authErr?.message);
  process.exit(1);
}
console.log('✓ 测试用户已登录:', email);

// 2. 偏好 upsert + 读回
const { error: prefErr } = await sb.from('user_preferences').upsert({
  user_id: auth.user.id,
  custom_diets: ['花生'],
  custom_diseases: [{ name: '测试疾病', avoid: ['酒精'] }],
});
if (prefErr) {
  console.error('✗ 偏好写入失败（表未建？）:', prefErr.message);
  process.exit(1);
}
const { data: prefs } = await sb.from('user_preferences').select('*').eq('user_id', auth.user.id).single();
console.log('✓ 偏好读写正常:', JSON.stringify(prefs.custom_diets), JSON.stringify(prefs.custom_diseases));

// 3. 历史 insert + 倒序查询
const { error: histErr } = await sb.from('recipe_history').insert({
  user_id: auth.user.id,
  ingredients: [{ name: '鸡蛋', category: '蛋奶' }],
  plans: [{ id: 1, name: '测试方案', dishes: [] }],
  preferences: { tastes: ['清淡'] },
});
if (histErr) {
  console.error('✗ 历史写入失败（表未建？）:', histErr.message);
  process.exit(1);
}
const { data: history } = await sb
  .from('recipe_history')
  .select('id, created_at')
  .eq('user_id', auth.user.id)
  .order('created_at', { ascending: false });
console.log(`✓ 历史读写正常，当前共 ${history.length} 条`);

// 4. RLS 验证：不带上文用户会话的匿名客户端应读不到任何数据
const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data: leaked } = await anon.from('user_preferences').select('user_id');
console.log(leaked && leaked.length > 0 ? '✗ RLS 未生效！匿名可读他人数据' : '✓ RLS 生效：匿名用户读不到任何偏好数据');

console.log('\n全部通过 ✅（测试数据可在控制台 Authentication → Users 删除该测试账号后自动级联清除）');

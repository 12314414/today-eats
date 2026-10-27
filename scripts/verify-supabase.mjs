// Supabase 连通性验证脚本
// 用法：node scripts/verify-supabase.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

// 手动解析 .env（避免引入 dotenv）
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const fail = (msg) => {
  console.error('✗ ' + msg);
  process.exit(1);
};

if (!url || url.includes('xxxxxxxxxxxx')) fail('VITE_SUPABASE_URL 还是占位符，请先在 .env 填入真实 Project URL');
if (!key || key.includes('xxxxxxxx')) fail('VITE_SUPABASE_ANON_KEY 还是占位符，请先在 .env 填入真实 anon key');
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) fail(`URL 格式可疑: ${url}`);

console.log(`→ 正在连接 ${url} ...`);

// 调用 GoTrue 设置接口：能返回 JSON 即说明 URL + anon key 都有效
const res = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});

if (!res.ok) {
  const body = await res.text().catch(() => '');
  fail(`HTTP ${res.status} ${res.statusText}\n${body}\n可能原因：anon key 不正确，或项目已暂停（免费项目 7 天无活动会暂停，去控制台恢复）`);
}

const settings = await res.json();
console.log('✓ 连接成功！Supabase Auth 服务正常');
console.log(`  - 邮箱注册: ${settings.external?.email ? '启用' : '关闭'}`);
console.log(`  - 邮箱确认: ${settings.mailer_autoconfirm ? '关闭（注册即登录）' : '开启（需验证邮件）'}`);

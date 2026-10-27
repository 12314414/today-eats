import { useState } from 'react';
import { History, LogIn, LogOut, Loader2 } from 'lucide-react';
import { ThemePicker } from '@/components/ThemePicker';
import { HistoryDialog } from '@/components/HistoryDialog';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function Header() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openLogin = () => {
    setMode('login');
    setError('');
    setNotice('');
    setLoginOpen(true);
  };

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setError('请输入合法的邮箱地址和密码');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) {
        setError('账号或密码错误，请重新输入');
      } else {
        setLoginOpen(false);
      }
    } else {
      const err = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        // 若 Supabase 开启邮箱验证，需要提示用户查收邮件；关闭则直接登录
        setNotice('注册成功！如未自动登录，请查收验证邮件后再登录。');
        setMode('login');
        setPassword('');
      }
    }
    setSubmitting(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/55 backdrop-blur-md">
      <div className="container max-w-3xl flex h-16 items-center justify-end gap-7">
        <ThemePicker />

        {user ? (
          <>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-sm text-[#4B433C] transition hover:text-primary"
            >
              <History className="h-4 w-4" />
              历史
            </button>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
              title={user.email}
            >
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 text-sm text-[#4B433C] transition hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              退出
            </button>
          </>
        ) : (
          <button
            onClick={openLogin}
            className="flex items-center gap-1.5 text-sm text-[#4B433C] transition hover:text-primary"
          >
            <LogIn className="h-4 w-4" />
            登录
          </button>
        )}
      </div>

      {/* 登录 / 注册弹窗 */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen} maxWidth="max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{mode === 'login' ? '登录' : '注册'}</h2>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setNotice('');
            }}
            className="text-xs text-primary hover:underline"
          >
            {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
            尚未配置 Supabase 环境变量，请先在项目根目录的 .env 中填写 VITE_SUPABASE_URL 和
            VITE_SUPABASE_ANON_KEY，然后重启 dev server。
          </p>
        )}

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱地址"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            placeholder="密码"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {notice && <p className="text-xs text-emerald-700">{notice}</p>}

          <button
            onClick={() => void submit()}
            disabled={submitting || !isSupabaseConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? '登录' : '注册'}
          </button>
          <p className="text-center text-xs text-muted-foreground">登录后可保存历史菜谱与自定义设置</p>
        </div>
      </Dialog>

      {/* 历史记录弹窗 */}
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </header>
  );
}

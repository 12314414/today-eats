import { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEME_OPTIONS } from '@/data/mock';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);

  // 点击外部 / 按 Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition',
          open ? 'bg-[#F6C453] text-[#4B433C] shadow-sm' : 'text-[#4B433C] hover:text-primary'
        )}
      >
        <Palette className="h-4 w-4" />
        主题
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-xl animate-fade-in-up">
          <div className="px-1 pb-2 text-sm font-semibold text-foreground">选择背景配色</div>
          <div className="space-y-1.5">
            {THEME_OPTIONS.map((t) => {
              const active = theme === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setTheme(t.key);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition hover:bg-secondary/70',
                    active ? 'border-primary bg-primary/5' : 'border-black/5 bg-secondary/40'
                  )}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 55%, ${t.colors[2]} 100%)`,
                    }}
                  />
                  <span className="flex-1 text-sm text-foreground">{t.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

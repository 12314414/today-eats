import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Dialog({ open, onOpenChange, children, maxWidth = 'max-w-md' }: DialogProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  // 用 Portal 渲染到 body：避免祖先的 backdrop-filter/transform 把 fixed 定位
  // 限制在局部容器内，确保弹窗始终相对整个屏幕居中
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className={`relative z-10 w-full ${maxWidth} rounded-xl bg-card p-6 shadow-2xl animate-fade-in-up max-h-[90dvh] overflow-y-auto`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 space-y-1.5 ${className}`}>{children}</div>;
}
export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h2>;
}
export function DialogDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

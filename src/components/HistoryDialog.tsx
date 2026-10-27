import { useEffect, useState } from 'react';
import { ArrowLeft, History, Loader2, Soup as SoupIcon } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { listHistory, type HistoryRecord } from '@/lib/db';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 从一条历史记录中提取概要：方案一的前几道菜名 */
function summarize(record: HistoryRecord): string {
  const dishes = record.plans?.[0]?.dishes?.map((d) => d.name) ?? [];
  return dishes.length > 0 ? dishes.join('、') : '菜谱方案';
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [detail, setDetail] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setDetail(null);
    setLoading(true);
    setError(null);
    listHistory(user.id).then(({ records, error }) => {
      setRecords(records);
      setError(error);
      setLoading(false);
    });
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-lg">
      {detail ? (
        /* ======== 详情视图 ======== */
        <div>
          <button
            onClick={() => setDetail(null)}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </button>
          <h2 className="text-lg font-semibold">{formatTime(detail.created_at)} 的菜谱</h2>

          {/* 偏好摘要 */}
          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            {detail.preferences?.tastes?.length > 0 && <div>口味：{detail.preferences.tastes.join('、')}</div>}
            {(detail.preferences?.diets?.length > 0 || detail.preferences?.customDiets?.length > 0) && (
              <div>忌口：{[...detail.preferences.diets, ...detail.preferences.customDiets].join('、')}</div>
            )}
            {(detail.preferences?.diseases?.length > 0 || detail.preferences?.customDiseases?.length > 0) && (
              <div>
                疾病：{[...detail.preferences.diseases, ...detail.preferences.customDiseases.map((d) => d.name)].join('、')}
              </div>
            )}
          </div>

          {/* 食材 */}
          {detail.ingredients?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium">识别食材</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.ingredients.map((ing, i) => (
                  <span key={i} className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700">
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 方案与菜品 */}
          <div className="mt-4 space-y-3">
            {detail.plans?.map((plan) => (
              <div key={plan.id} className="rounded-lg border border-border p-3">
                <div className="text-sm font-semibold">{plan.name}</div>
                <div className="mt-2 space-y-1">
                  {plan.dishes.map((dish) => (
                    <div key={dish.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {dish.isSoup ? (
                        <SoupIcon className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      )}
                      <span className="text-foreground">{dish.name}</span>
                      <span className="text-xs">· {dish.difficulty} · {dish.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ======== 列表视图 ======== */
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-primary" />
            历史菜谱
          </h2>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : error ? (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                加载失败：{error}
                <br />
                请确认已在 Supabase SQL Editor 执行 supabase/schema.sql 建表。
              </p>
            ) : records.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">暂无历史菜谱</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {records.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setDetail(r)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{summarize(r)}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{formatTime(r.created_at)}</div>
                      </div>
                      <span className="shrink-0 text-xs text-primary">查看详情</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

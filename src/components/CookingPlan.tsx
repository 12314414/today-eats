import { useState, useMemo } from 'react';
import { ChefHat, X, Sparkles, ListOrdered } from 'lucide-react';
import type { RecipePlan, Dish } from '@/types/types';
import { cn } from '@/lib/utils';

interface CookingPlanProps {
  plans: RecipePlan[];
  checkedDishes: Record<string, boolean>;
  onClearAll: () => void;
  onUncheck: (planId: number, dishName: string) => void;
}

export function CookingPlan({ plans, checkedDishes, onClearAll, onUncheck }: CookingPlanProps) {
  const [showPlan, setShowPlan] = useState(false);

  const checkedList = useMemo(() => {
    const result: { dish: Dish; planId: number; planName: string }[] = [];
    for (const plan of plans) {
      for (const dish of plan.dishes) {
        const key = `${plan.id}-${dish.name}`;
        if (checkedDishes[key]) {
          result.push({ dish, planId: plan.id, planName: plan.name });
        }
      }
    }
    return result;
  }, [plans, checkedDishes]);

  const count = checkedList.length;

  // 协同烹饪排序：汤类最前，然后简单菜，最后中等/困难菜
  const sortedPlan = useMemo(() => {
    return [...checkedList].sort((a, b) => {
      if (a.dish.isSoup && !b.dish.isSoup) return -1;
      if (!a.dish.isSoup && b.dish.isSoup) return 1;
      const diffMap: Record<string, number> = { 简单: 1, 中等: 2, 困难: 3 };
      return (diffMap[a.dish.difficulty] ?? 2) - (diffMap[b.dish.difficulty] ?? 2);
    });
  }, [checkedList]);

  const reasonFor = (item: { dish: Dish; planName: string }): string => {
    const d = item.dish;
    if (d.isSoup) return `先煮汤，利用等待时间处理其他菜品的备料；汤煮好后保持温热，随后完成其他菜并趁热食用。（来自「${item.planName}」）`;
    if (d.difficulty === '简单') return `安排在中后段，可利用煮汤/焖煮时间提前备好食材，最后快速炒制，保证成品热乎且不影响其他菜口味。（来自「${item.planName}」）`;
    return `作为主菜压轴出场，前面的菜品可以在它烹饪间隙提前备好。（来自「${item.planName}」）`;
  };

  if (count === 0) return null;

  return (
    <section className="rounded-2xl bg-white/85 p-6 shadow-sm backdrop-blur-md animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-lg">
          <ChefHat className="h-5 w-5 text-primary" />
          我的备选清单
        </h3>
        <span className="text-sm text-muted-foreground">已选 {count} 道</span>
      </div>

      {/* 已选菜品标签 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {checkedList.map((c) => (
          <span
            key={`${c.planId}-${c.dish.name}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-sm text-primary"
          >
            {c.dish.name}
            <button
              onClick={() => onUncheck(c.planId, c.dish.name)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setShowPlan(true)}
          disabled={count < 2}
          className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="h-5 w-5" />
          生成协同烹饪顺序
        </button>
        <button
          onClick={onClearAll}
          className="rounded-lg border border-input px-4 py-3 text-sm hover:bg-muted"
        >
          清空选择
        </button>
      </div>

      {count < 2 && (
        <p className="mt-2 text-xs text-muted-foreground text-center">至少勾选 2 道菜品才能生成协同烹饪建议</p>
      )}

      {/* 协同烹饪结果 */}
      {showPlan && count >= 2 && (
        <div className="mt-5 rounded-xl bg-secondary/60 p-4 animate-fade-in-up">
          <h4 className="flex items-center gap-1.5 font-bold text-sm">
            <ListOrdered className="h-4 w-4 text-primary" />
            建议烹饪顺序
          </h4>
          <ol className="mt-3 space-y-4">
            {sortedPlan.map((item, i) => (
              <li key={`${item.planId}-${item.dish.name}`} className="flex gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'
                  )}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium">{item.dish.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{reasonFor(item)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

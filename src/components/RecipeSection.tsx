import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import type { RecipePlan, Dish } from '@/types/types';
import { DishCard } from '@/components/DishCard';
import { DishDetailDialog } from '@/components/DishDetailDialog';
import { cn } from '@/lib/utils';

interface RecipeSectionProps {
  plans: RecipePlan[];
  selectedPlanId: number;
  setSelectedPlanId: (id: number) => void;
  checkedDishes: Record<string, boolean>;
  toggleChecked: (planId: number, dishName: string) => void;
  onCheckChange: () => void;
}

export function RecipeSection({
  plans,
  selectedPlanId,
  setSelectedPlanId,
  checkedDishes,
  toggleChecked,
  onCheckChange,
}: RecipeSectionProps) {
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [detailIsSoup, setDetailIsSoup] = useState(false);

  const current = plans.find((p) => p.id === selectedPlanId) ?? plans[0];

  const openDetail = (d: Dish) => {
    setDetailDish(d);
    setDetailIsSoup(!!d.isSoup);
  };

  const totalChecked = Object.values(checkedDishes).filter(Boolean).length;

  return (
    <section className="rounded-2xl bg-white/85 p-6 shadow-sm backdrop-blur-md animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-lg">
          <ChefHat className="h-5 w-5 text-primary" />
          今日盲盒菜单
        </h3>
        <span className="text-sm text-muted-foreground">共 {plans.length} 套方案 · 点击菜品查看做法</span>
      </div>

      {/* 方案切换 Tab */}
      <div className="mt-4 flex gap-1 rounded-xl bg-secondary/80 p-1">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlanId(p.id)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
              selectedPlanId === p.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 方案描述 */}
      <p className="mt-4 text-sm text-muted-foreground">{current.tagline}</p>

      {/* 营养提示 */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm">
        <span className="text-rose-500">💝</span>
        <span className="text-rose-800">{current.nutritionTip}</span>
      </div>

      {/* 菜品卡片网格 */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {current.dishes.map((dish, i) => {
          const key = `${current.id}-${dish.name}`;
          return (
            <DishCard
              key={key}
              dish={dish}
              index={i + 1}
              checked={!!checkedDishes[key]}
              onToggleCheck={() => {
                toggleChecked(current.id, dish.name);
                onCheckChange();
              }}
              onClickDetail={() => openDetail(dish)}
            />
          );
        })}
      </div>

      {/* 已选计数提示 */}
      {totalChecked > 0 && (
        <div className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary font-medium">
          已选 {totalChecked} 道菜品，继续勾选或查看底部协同烹饪建议
        </div>
      )}

      {/* 详情弹窗 */}
      <DishDetailDialog
        dish={detailDish}
        isSoup={detailIsSoup}
        open={!!detailDish}
        onOpenChange={(o) => !o && setDetailDish(null)}
      />
    </section>
  );
}

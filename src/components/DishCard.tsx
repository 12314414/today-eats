import { Check } from 'lucide-react';
import type { Dish } from '@/types/types';
import { difficultyColorClass } from '@/lib/ingredient';
import { cn } from '@/lib/utils';

interface DishCardProps {
  dish: Dish;
  index: number;
  checked: boolean;
  onToggleCheck: () => void;
  onClickDetail: () => void;
}

export function DishCard({ dish, index, checked, onToggleCheck, onClickDetail }: DishCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-white/90 p-4 transition hover:shadow-md cursor-pointer',
        checked && 'ring-2 ring-primary border-primary'
      )}
      onClick={onClickDetail}
    >
      <div className="flex items-start gap-3">
        {/* 勾选框 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition',
            checked ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white hover:border-primary'
          )}
        >
          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>

        {/* 菜名 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              {index}
            </span>
            <h4 className="font-bold text-foreground truncate flex items-center gap-1">
              {dish.name}
              {dish.isSoup && <span className="text-base">🥣</span>}
            </h4>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{dish.description}</p>

          {/* 标签 */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={cn('rounded-full px-2 py-0.5 text-xs text-white', difficultyColorClass(dish.difficulty))}>
              {dish.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              ⏱ {dish.duration}
            </span>
          </div>

          <div className="mt-2 text-sm font-medium text-primary flex items-center gap-1">
            查看食材与做法 →
          </div>
        </div>
      </div>
    </div>
  );
}

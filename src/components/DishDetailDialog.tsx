import { Soup as SoupIcon, Carrot, ListChecks, Clock, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { difficultyColorClass } from '@/lib/ingredient';
import type { Dish } from '@/types/types';
import { Dialog } from '@/components/ui/dialog';

interface DishDetailDialogProps {
  dish: Dish | null;
  isSoup: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DishDetailDialog({ dish, isSoup, open, onOpenChange }: DishDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="max-w-lg">
      {dish && (
        <>
          <div className="mb-4 flex items-center gap-2">
            {isSoup && <SoupIcon className="h-5 w-5 text-accent" />}
            <h3 className="text-xl font-bold">{dish.name}</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{dish.description}</p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" />
              {dish.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {dish.duration}
            </span>
          </div>

          {/* 所需食材调料 */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div className="mt-5 space-y-2">
              <h4 className="flex items-center gap-1.5 font-bold text-sm">
                <Carrot className="h-4 w-4 text-accent" />
                所需食材调料
              </h4>
              <div className="flex flex-wrap gap-2">
                {dish.ingredients.map((ing, i) => (
                  <span
                    key={`${ing}-${i}`}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs',
                      i === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'
                    )}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 具体做法 */}
          {dish.steps && dish.steps.length > 0 && (
            <div className="mt-5 space-y-2">
              <h4 className="flex items-center gap-1.5 font-bold text-sm">
                <ListChecks className="h-4 w-4 text-accent" />
                具体做法
              </h4>
              <ol className="space-y-3">
                {dish.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white',
                        difficultyColorClass(dish.difficulty)
                      )}
                    >
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/85">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}

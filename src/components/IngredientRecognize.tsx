import { useState } from 'react';
import { Sparkles, X, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import type { IngredientTag } from '@/types/types';
import { cn } from '@/lib/utils';

interface IngredientRecognizeProps {
  ingredients: IngredientTag[];
  onRemove: (name: string) => void;
  onAdd: (name: string, category: string) => void;
  onRegenerate: () => void;
}

const CATEGORIES = ['蔬菜', '水果', '肉类', '蛋奶', '豆制品', '主食', '调味', '其他'];

export function IngredientRecognize({ ingredients, onRemove, onAdd, onRegenerate }: IngredientRecognizeProps) {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('蔬菜');

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!ingredients.find((i) => i.name === v)) {
      onAdd(v, category);
    }
    setInput('');
  };

  const congratulation = ingredients.length >= 20 ? '今天是大厨体验日！' : '考验厨艺的时刻到了！';

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* 鼓励寄语 */}
      <div className="flex items-center gap-4 rounded-2xl bg-white/85 p-5 shadow-sm backdrop-blur-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs font-medium text-primary">食材丰富</div>
          <div className="text-xl font-bold text-foreground">{congratulation}</div>
        </div>
      </div>

      {/* 识别结果 */}
      <div className="rounded-2xl bg-white/85 p-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-bold">
            <span className="text-lg">🥕</span> 识别结果
          </h3>
          <span className="text-sm text-muted-foreground">共 {ingredients.length} 种食材 · 可编辑</span>
        </div>

        {/* 标签 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {ingredients.map((ing) => (
            <span
              key={ing.name}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm',
                ing.conflict
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-secondary text-foreground'
              )}
            >
              {ing.name}
              <span className="text-xs text-muted-foreground"> {ing.category}</span>
              <button
                onClick={() => onRemove(ing.name)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        {/* 异常说明 */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            冰箱内部分罐装食品、瓶装调味料及冷藏室后排包装无法清晰辨认品牌和具体内容；中下部分盒装食材疑似奶酪、鸡蛋或腌制品，但仅按可确认食材与常见家庭调料列出。
          </span>
        </div>

        {/* 手动添加 */}
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="输入食材名称，如西红柿"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={add}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
      </div>

      {/* 重新生成 */}
      <button
        onClick={onRegenerate}
        className="w-full rounded-xl bg-primary py-3 text-base font-medium text-primary-foreground shadow-md hover:opacity-90 flex items-center justify-center gap-2"
      >
        <RefreshCw className="h-5 w-5" />
        基于最新食材重新生成菜单
      </button>
    </div>
  );
}

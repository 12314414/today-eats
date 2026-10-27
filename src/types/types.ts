export interface Dish {
  name: string;
  description: string;
  difficulty: '简单' | '中等' | '困难';
  duration: string;
  ingredients?: string[];
  steps?: string[];
  isSoup?: boolean;
}

export interface RecipePlan {
  id: number;
  name: string;
  tagline: string;
  nutritionTip: string;
  dishes: Dish[];
}

export interface IngredientTag {
  name: string;
  category: string;
  conflict?: boolean;
}

export type ThemeKey = 'beige' | 'ocean' | 'sunset' | 'mint' | 'indigo' | 'dream';

export interface ThemeOption {
  key: ThemeKey;
  label: string;
  /** 三色色值，用于主题选择器内的预览 */
  gradient: string;
  /** 三个色值，用于渲染预览小圆点/色条 */
  colors: [string, string, string];
  hatColor: string;
}

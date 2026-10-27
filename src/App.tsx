import { useState, useCallback, useEffect, useRef } from 'react';
import { ChefHat, Loader2, ScanSearch, RefreshCw } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { UploadZone } from '@/components/UploadZone';
import { PreferencePanel } from '@/components/PreferencePanel';
import { IngredientRecognize } from '@/components/IngredientRecognize';
import { RecipeSection } from '@/components/RecipeSection';
import { CookingPlan } from '@/components/CookingPlan';
import type { IngredientTag, RecipePlan } from '@/types/types';
import { MOCK_PLANS, THEME_OPTIONS } from '@/data/mock';
import { loadPreferences, savePreferences, saveHistory } from '@/lib/db';
import { fileToCompressedDataUrl, recognizeIngredients } from '@/lib/recognize';
import { generateRecipes } from '@/lib/generate';

function Hero() {
  const { theme } = useTheme();
  const current = THEME_OPTIONS.find((t) => t.key === theme) ?? THEME_OPTIONS[0];

  return (
    <section className="border-b border-black/5 bg-white/45 backdrop-blur-[3px]">
      <div className="container max-w-3xl py-12 text-center">
        {/* 小厨师帽子图标：主题色联动 */}
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] shadow-sm"
          style={{ backgroundColor: current.hatColor }}
        >
          <ChefHat className="h-7 w-7 text-white" strokeWidth={2} />
        </div>

        <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-[0.02em] text-[#2A2521]">
          今天吃什么
        </h1>

        <p className="mx-auto mt-4 max-w-[620px] text-sm leading-7 text-[#6C635A]">
          拍一张冰箱里的照片，让 AI 识别食材并搭配多套菜单；选好口味偏好与疾病忌口，
          <br className="hidden sm:block" />
          点击菜品看做法，勾选想做的菜即可生成协同烹饪顺序
        </p>
      </div>
    </section>
  );
}

function AppInner() {
  // ========= 上传状态 =========
  const [uploaded, setUploaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // ========= 偏好设置状态 =========
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [customDiets, setCustomDiets] = useState<string[]>([]);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [customDiseases, setCustomDiseases] = useState<{ name: string; avoid: string[] }[]>([]);
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const userId = user?.id ?? null;

  // ========= 云端偏好同步 =========
  // 登录后从云端加载自定义忌口/疾病；加载完成后，本地变更防抖写回云端
  const prefsLoadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      prefsLoadedFor.current = null;
      return;
    }
    let cancelled = false;
    loadPreferences(userId).then((prefs) => {
      if (cancelled) return;
      if (prefs) {
        setCustomDiets(prefs.customDiets);
        setCustomDiseases(prefs.customDiseases);
      }
      // 无论是否有历史记录，加载完成后才允许回写，避免用空数组覆盖云端
      prefsLoadedFor.current = userId;
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || prefsLoadedFor.current !== userId) return;
    const timer = setTimeout(() => {
      void savePreferences(userId, customDiets, customDiseases);
    }, 800);
    return () => clearTimeout(timer);
  }, [userId, customDiets, customDiseases]);

  // ========= 食材状态（真实识别结果，初始为空） =========
  const [ingredients, setIngredients] = useState<IngredientTag[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizeError, setRecognizeError] = useState<string | null>(null);

  // ========= 菜谱状态 =========
  const [selectedPlanId, setSelectedPlanId] = useState(1);
  const [checkedDishes, setCheckedDishes] = useState<Record<string, boolean>>({});
  // 生成前展示 mock 示例；首次真实生成后替换为 AI 结果
  const [plans, setPlans] = useState<RecipePlan[]>(MOCK_PLANS);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // 上传图片：压缩 → 预览 → 调后端识别接口
  const runRecognize = async (dataUrl: string) => {
    setRecognizing(true);
    setRecognizeError(null);
    try {
      const list = await recognizeIngredients(dataUrl);
      setIngredients(list);
      if (list.length === 0) {
        setRecognizeError('未检测到食材，可更换照片，或点击生成后手动添加食材标签');
      }
    } catch (e) {
      setIngredients([]);
      setRecognizeError(e instanceof Error ? e.message : '识别失败，请重试');
    } finally {
      setRecognizing(false);
    }
  };

  const handleUpload = (file: File) => {
    setUploaded(true);
    setGenerated(false);
    void fileToCompressedDataUrl(file).then((dataUrl) => {
      setPreviewUrl(dataUrl);
      setImageDataUrl(dataUrl);
      void runRecognize(dataUrl);
    });
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setGenerated(true);
      setGenerateError('当前没有可用食材，请先在下方添加食材标签后重新生成');
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateRecipes({
        ingredients: ingredients.map((i) => i.name),
        tastes: selectedTastes,
        excludes: [...selectedDiets, ...customDiets, ...customDiseases.flatMap((d) => d.avoid)],
        diseases: [...selectedDiseases, ...customDiseases.map((d) => d.name)],
      });
      setPlans(result);
      setSelectedPlanId(result[0]?.id ?? 1);
      setGenerated(true);
      // 已登录用户：每次成功生成自动保存一条云端历史记录
      if (userId) {
        void saveHistory(userId, {
          ingredients,
          plans: result,
          preferences: {
            tastes: selectedTastes,
            diets: selectedDiets,
            diseases: selectedDiseases,
            customDiets,
            customDiseases,
          },
        });
      }
    } catch (e) {
      setGenerated(true);
      setGenerateError(e instanceof Error ? e.message : '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const removeIngredient = (name: string) => {
    setIngredients(ingredients.filter((i) => i.name !== name));
  };
  const addIngredient = (name: string, category: string) => {
    setIngredients([...ingredients, { name, category }]);
  };

  const toggleChecked = useCallback((planId: number, dishName: string) => {
    const key = `${planId}-${dishName}`;
    setCheckedDishes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const uncheck = (planId: number, dishName: string) => {
    const key = `${planId}-${dishName}`;
    setCheckedDishes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearAllChecked = () => setCheckedDishes({});

  const dietExclude = [...selectedDiets, ...customDiets];
  const diseaseNames = [...selectedDiseases, ...customDiseases.map((d) => d.name)];
  const diseaseAvoid = customDiseases.flatMap((d) => d.avoid);
  const hasAnyExclude =
    selectedDiets.length > 0 ||
    customDiets.length > 0 ||
    selectedDiseases.length > 0 ||
    customDiseases.length > 0;

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />

      <main className="container max-w-3xl space-y-6 py-10">
        {/* 上传区 */}
        <UploadZone
          uploaded={uploaded}
          previewUrl={previewUrl}
          generating={generating || recognizing}
          onUpload={handleUpload}
          onGenerate={handleGenerate}
        />

        {/* 识别状态条 */}
        {uploaded && recognizing && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/85 px-5 py-4 text-sm text-muted-foreground shadow-sm animate-fade-in-up">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            通义千问 VL 正在识别照片中的食材…
          </div>
        )}
        {uploaded && !recognizing && recognizeError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm animate-fade-in-up">
            <span>{recognizeError}</span>
            {imageDataUrl && (
              <button
                onClick={() => void runRecognize(imageDataUrl)}
                className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium hover:bg-amber-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重试
              </button>
            )}
          </div>
        )}
        {uploaded && !recognizing && !recognizeError && ingredients.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm animate-fade-in-up">
            <ScanSearch className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              已识别 {ingredients.length} 种食材：
              {ingredients.slice(0, 10).map((i) => i.name).join('、')}
              {ingredients.length > 10 ? ' 等' : ''}。生成菜谱后可在结果区增删标签并重新生成。
            </span>
          </div>
        )}

        {/* 偏好设置 */}
        {uploaded && (
          <PreferencePanel
            selectedTastes={selectedTastes}
            setSelectedTastes={setSelectedTastes}
            selectedDiets={selectedDiets}
            setSelectedDiets={setSelectedDiets}
            customDiets={customDiets}
            setCustomDiets={setCustomDiets}
            selectedDiseases={selectedDiseases}
            setSelectedDiseases={setSelectedDiseases}
            customDiseases={customDiseases}
            setCustomDiseases={setCustomDiseases}
            isLoggedIn={isLoggedIn}
          />
        )}

        {/* 生成状态 / 错误 */}
        {generating && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/85 px-5 py-4 text-sm text-muted-foreground shadow-sm animate-fade-in-up">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            AI 营养师正在根据食材与忌口设计三套方案，约需 10~30 秒…
          </div>
        )}
        {generated && !generating && generateError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm animate-fade-in-up">
            <span>{generateError}</span>
            <button
              onClick={() => void handleGenerate()}
              className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium hover:bg-amber-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重试
            </button>
          </div>
        )}

        {/* 生成结果 */}
        {generated && !generateError && (
          <>
            {/* 忌口确认区 */}
            {hasAnyExclude && (
              <div className="rounded-2xl bg-white p-5 shadow-sm animate-fade-in-up">
                <h3 className="text-sm font-bold text-foreground">📋 已生效的忌口清单</h3>
                {diseaseNames.length > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">疾病：</span>
                    <span className="text-foreground">{diseaseNames.join('、')}</span>
                  </div>
                )}
                {(dietExclude.length > 0 || diseaseAvoid.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[...dietExclude, ...diseaseAvoid].map((item, i) => (
                      <span key={i} className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs text-rose-700">
                        ✗ {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <IngredientRecognize
              ingredients={ingredients}
              onRemove={removeIngredient}
              onAdd={addIngredient}
              onRegenerate={handleGenerate}
            />

            <RecipeSection
              plans={plans}
              selectedPlanId={selectedPlanId}
              setSelectedPlanId={setSelectedPlanId}
              checkedDishes={checkedDishes}
              toggleChecked={toggleChecked}
              onCheckChange={() => { /* 预留钩子 */ }}
            />

            <CookingPlan
              plans={plans}
              checkedDishes={checkedDishes}
              onClearAll={clearAllChecked}
              onUncheck={uncheck}
            />
          </>
        )}

        <footer className="py-8 text-center text-xs">
          <span className="inline-block rounded-full bg-white/70 px-4 py-1.5 font-medium text-[#4A423B] shadow-sm backdrop-blur-sm">
            今天吃什么 · 让每一份食材都被好好对待
          </span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}

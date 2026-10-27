import { useState } from 'react';
import { Flame, UtensilsCrossed, HeartPulse, Plus, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASTE_TAGS, DIET_TAGS, DISEASE_TAGS } from '@/data/mock';
import { Dialog } from '@/components/ui/dialog';

interface PreferencePanelProps {
  selectedTastes: string[];
  setSelectedTastes: (v: string[]) => void;
  selectedDiets: string[];
  setSelectedDiets: (v: string[]) => void;
  customDiets: string[];
  setCustomDiets: (v: string[]) => void;
  selectedDiseases: string[];
  setSelectedDiseases: (v: string[]) => void;
  customDiseases: { name: string; avoid: string[] }[];
  setCustomDiseases: (v: { name: string; avoid: string[] }[]) => void;
  isLoggedIn: boolean;
}

function Chip({
  active,
  children,
  onClick,
  onRemove,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-input bg-white/80 text-foreground hover:border-primary'
      )}
    >
      {children}
      {onRemove && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

export function PreferencePanel(props: PreferencePanelProps) {
  const {
    selectedTastes, setSelectedTastes,
    selectedDiets, setSelectedDiets,
    customDiets, setCustomDiets,
    selectedDiseases, setSelectedDiseases,
    customDiseases, setCustomDiseases,
    isLoggedIn,
  } = props;

  const [customDietInput, setCustomDietInput] = useState('');
  const [customDiseaseName, setCustomDiseaseName] = useState('');
  const [customDiseaseAvoid, setCustomDiseaseAvoid] = useState('');
  const [confirmDiseaseOpen, setConfirmDiseaseOpen] = useState(false);

  const toggle = (arr: string[], v: string, setArr: (x: string[]) => void) => {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const addCustomDiet = () => {
    const v = customDietInput.trim();
    if (!v) return;
    if (!customDiets.includes(v)) setCustomDiets([...customDiets, v]);
    setCustomDietInput('');
  };

  const openConfirmAddDisease = () => {
    if (!customDiseaseName.trim() || !customDiseaseAvoid.trim()) return;
    setConfirmDiseaseOpen(true);
  };

  const confirmAddDisease = () => {
    setCustomDiseases([
      ...customDiseases,
      {
        name: customDiseaseName.trim(),
        avoid: customDiseaseAvoid.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean),
      },
    ]);
    setCustomDiseaseName('');
    setCustomDiseaseAvoid('');
    setConfirmDiseaseOpen(false);
  };

  const hasAnyDisease = selectedDiseases.length > 0 || customDiseases.length > 0;

  return (
    <section className="rounded-2xl bg-white/85 p-6 shadow-sm backdrop-blur-md animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">🧂 口味与饮食偏好</h2>
        <span className="text-xs text-muted-foreground">可多选，影响生成结果</span>
      </div>

      {/* 口味偏好 */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Flame className="h-4 w-4 text-amber-500" />
          口味偏好
        </div>
        <div className="flex flex-wrap gap-2">
          {TASTE_TAGS.map((t) => (
            <Chip
              key={t}
              active={selectedTastes.includes(t)}
              onClick={() => toggle(selectedTastes, t, setSelectedTastes)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </div>

      {/* 饮食禁忌 */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <UtensilsCrossed className="h-4 w-4 text-rose-500" />
          饮食禁忌
        </div>
        <div className="flex flex-wrap gap-2">
          {DIET_TAGS.map((t) => (
            <Chip
              key={t}
              active={selectedDiets.includes(t)}
              onClick={() => toggle(selectedDiets, t, setSelectedDiets)}
            >
              {t}
            </Chip>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={customDietInput}
            onChange={(e) => setCustomDietInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomDiet()}
            placeholder="手动添加忌口食材，如芹菜、花生"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={addCustomDiet}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            添加忌口
          </button>
        </div>

        {customDiets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {customDiets.map((d) => (
              <Chip key={d} active onRemove={() => setCustomDiets(customDiets.filter((x) => x !== d))}>
                {d}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* 疾病忌口 */}
      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <HeartPulse className="h-4 w-4 text-rose-500" />
          疾病忌口
          <span className="ml-1 text-xs text-muted-foreground">选中后将自动排除禁忌食材</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DISEASE_TAGS.map((t) => (
            <Chip
              key={t}
              active={selectedDiseases.includes(t)}
              onClick={() => toggle(selectedDiseases, t, setSelectedDiseases)}
            >
              {t}
            </Chip>
          ))}
        </div>

        {/* 自定义疾病 */}
        <details className="mt-3 rounded-lg bg-white/70 p-3 group">
          <summary className="flex cursor-pointer items-center gap-1.5 text-sm text-primary font-medium">
            <Plus className="h-4 w-4" />
            添加自定义疾病及其忌口食材
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-2">
            <input
              value={customDiseaseName}
              onChange={(e) => setCustomDiseaseName(e.target.value)}
              placeholder="疾病名称，如结肠炎"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              value={customDiseaseAvoid}
              onChange={(e) => setCustomDiseaseAvoid(e.target.value)}
              placeholder="忌口食材，用逗号分隔，如肥肉、酒精、乳制品"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-between">
              {!isLoggedIn && (
                <span className="text-xs text-amber-700">登录后可长期保存您的自定义设置</span>
              )}
              <button
                onClick={openConfirmAddDisease}
                disabled={!customDiseaseName.trim() || !customDiseaseAvoid.trim()}
                className="ml-auto rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
              >
                添加疾病
              </button>
            </div>
          </div>
        </details>

        {/* 已添加自定义疾病列表 */}
        {customDiseases.length > 0 && (
          <div className="mt-3 space-y-2">
            {customDiseases.map((cd) => (
              <div key={cd.name} className="flex items-start justify-between rounded-lg bg-white/80 p-3">
                <div>
                  <div className="text-sm font-medium">{cd.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cd.avoid.map((a) => (
                      <span key={a} className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">{a}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setCustomDiseases(customDiseases.filter((x) => x.name !== cd.name))}
                  className="rounded-full p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 免责声明 */}
        {hasAnyDisease && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>本菜谱仅供参考，具体饮食请遵医嘱</span>
          </div>
        )}
      </div>

      {/* 确认弹窗 */}
      <Dialog open={confirmDiseaseOpen} onOpenChange={setConfirmDiseaseOpen} maxWidth="max-w-sm">
        <h3 className="text-base font-semibold">确认添加</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          这些食材将在生成菜谱时被<strong className="text-rose-600">严格排除</strong>；
          本菜谱仅供参考，具体饮食请遵医嘱。
        </p>
        <div className="mt-4 rounded-lg bg-muted p-3">
          <div className="text-sm font-medium">{customDiseaseName}</div>
          <div className="mt-1 text-xs text-muted-foreground">忌口：{customDiseaseAvoid}</div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={() => setConfirmDiseaseOpen(false)}
            className="rounded-lg border border-input px-4 py-1.5 text-sm hover:bg-muted"
          >
            取消
          </button>
          <button
            onClick={confirmAddDisease}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            确认添加
          </button>
        </div>
      </Dialog>
    </section>
  );
}

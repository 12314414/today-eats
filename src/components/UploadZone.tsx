import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImagePlus, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  uploaded: boolean;
  onUpload: (file: File) => void;
  previewUrl: string | null;
  generating: boolean;
  onGenerate: () => void;
}

export function UploadZone({ uploaded, onUpload, previewUrl, generating, onGenerate }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onUpload(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  if (uploaded && previewUrl) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm animate-fade-in-up">
        <div className="relative overflow-hidden rounded-xl">
          <img src={previewUrl} alt="冰箱食材" className="h-64 w-full object-cover" />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/75"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            更换照片
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

        <button
          onClick={onGenerate}
          disabled={generating}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-medium text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-70"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              AI 正在处理，请稍候…
            </>
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              开始生成菜谱
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'cursor-pointer rounded-2xl border border-dashed bg-white px-6 py-14 text-center shadow-sm transition',
        dragging ? 'border-primary' : 'border-black/10 hover:border-primary/60'
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <ImagePlus className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-5 text-[19px] font-bold text-[#2E2A26]">上传冰箱食材照片</h3>
      <p className="mt-2 text-sm text-[#7C736A]">点击选择，或将照片拖拽到此处</p>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#7C736A]">
        <span className="rounded-full bg-black/5 px-3 py-1">JPEG / PNG / WEBP</span>
        <span className="rounded-full bg-black/5 px-3 py-1">最大 1MB（超出自动压缩）</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  );
}

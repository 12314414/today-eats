// 前端识别流程：压缩图片 → base64 → POST /api/recognize → 食材列表
import type { IngredientTag } from '@/types/types';
import { apiUrl } from '@/lib/api';

const MAX_SIDE = 1024; // 压缩到最长边 1024px，控制 base64 体积
const JPEG_QUALITY = 0.8;

/** File → 压缩后的 data URL（jpeg） */
export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('浏览器不支持 canvas'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };
    img.src = url;
  });
}

/** 调用后端识别接口，返回食材列表；失败抛出带用户可读信息的 Error */
export async function recognizeIngredients(imageDataUrl: string): Promise<IngredientTag[]> {
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/recognize'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl }),
    });
  } catch {
    throw new Error('无法连接识别服务，请确认后端 server 已启动（npm run server）');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `识别失败（HTTP ${res.status}）`);
  }
  return (data.ingredients as IngredientTag[]) ?? [];
}

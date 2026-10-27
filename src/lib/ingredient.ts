export function difficultyColorClass(difficulty: string): string {
  const map: Record<string, string> = {
    简单: 'bg-emerald-500 text-white',
    中等: 'bg-amber-500 text-white',
    困难: 'bg-rose-500 text-white',
  };
  return map[difficulty] ?? 'bg-gray-400 text-white';
}

/** プレイ人数のフォーマット */
export const formatPlayerCount = (
  min: number | null,
  max: number | null,
  fallback = '−',
): string => {
  if (min === null && max === null) return fallback;
  if (min !== null && max !== null) {
    return min === max ? `${min}人` : `${min}〜${max}人`;
  }
  if (min !== null) return `${min}人〜`;
  return `〜${max}人`;
};

/** プレイ時間のフォーマット */
export const formatPlaytime = (
  min: number | null,
  max: number | null,
  fallback = '−',
): string => {
  if (min === null && max === null) return fallback;
  if (min !== null && max !== null) {
    return min === max ? `${min}分` : `${min}〜${max}分`;
  }
  if (min !== null) return `${min}分〜`;
  return `〜${max}分`;
};

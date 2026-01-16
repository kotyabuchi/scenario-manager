import { isNil } from 'ramda';

/**
 * 分を時間表示にフォーマット
 * @example formatMinutesToHours(90) // "1時間30分"
 * @example formatMinutesToHours(120) // "2時間"
 */
export const formatMinutesToHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}時間`;
  return `${hours}時間${mins}分`;
};

/**
 * プレイ時間を表示用にフォーマット
 * @example formatPlaytime(60, 120) // "1時間〜2時間"
 * @example formatPlaytime(null, null) // "-"
 */
export const formatPlaytime = (
  minMinutes?: number | null,
  maxMinutes?: number | null,
): string => {
  if (isNil(minMinutes) && isNil(maxMinutes)) return '-';
  if (isNil(minMinutes) && !isNil(maxMinutes))
    return formatMinutesToHours(maxMinutes);
  if (!isNil(minMinutes) && isNil(maxMinutes))
    return formatMinutesToHours(minMinutes);
  if (!isNil(minMinutes) && !isNil(maxMinutes)) {
    if (minMinutes === maxMinutes) return formatMinutesToHours(minMinutes);
    return `${formatMinutesToHours(minMinutes)}〜${formatMinutesToHours(maxMinutes)}`;
  }
  return '-';
};

/**
 * プレイ人数を表示用にフォーマット
 * @example formatPlayerCount(3, 5) // "3〜5人"
 * @example formatPlayerCount(4, 4) // "4人"
 */
export const formatPlayerCount = (
  min?: number | null,
  max?: number | null,
): string => {
  if (isNil(min) && isNil(max)) return '-';
  if (isNil(min)) return `〜${max}人`;
  if (isNil(max)) return `${min}人〜`;
  if (min === max) return `${min}人`;
  return `${min}〜${max}人`;
};

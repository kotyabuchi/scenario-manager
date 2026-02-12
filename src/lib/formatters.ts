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

/**
 * ISO日付文字列を相対時間表示にフォーマット（サーバーサイド専用）
 * UTCベースで計算（Supabaseのタイムスタンプは ISO 8601/UTC）
 */
export const formatRelativeTime = (isoDateString: string): string => {
  const now = Date.now();
  const target = new Date(isoDateString).getTime();
  const diffMs = now - target;

  if (diffMs < 0) return 'たった今';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return 'たった今';
  if (hours < 1) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${weeks}週間前`;
  if (months < 12) return `${months}ヶ月前`;
  return new Date(isoDateString).toLocaleDateString('ja-JP');
};

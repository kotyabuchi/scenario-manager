import { FeedbackCategories, FeedbackStatuses } from '@/db/enum';

/** カテゴリ値からラベルを取得 */
export const getCategoryLabel = (value: string): string => {
  const entry = Object.values(FeedbackCategories).find(
    (c) => c.value === value,
  );
  return entry?.label ?? value;
};

/** ステータス値からラベルを取得 */
export const getStatusLabel = (value: string): string => {
  const entry = Object.values(FeedbackStatuses).find((s) => s.value === value);
  return entry?.label ?? value;
};

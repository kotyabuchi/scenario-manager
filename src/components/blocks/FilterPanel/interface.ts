import type { UseFilterStateReturn } from './useFilterState';

export type SystemItem = {
  systemId: string;
  name: string;
};

export type TagItem = {
  tagId: string;
  name: string;
};

export type FilterPanelVariant = 'sidebar' | 'inline' | 'bottomsheet';

export type FilterPanelProps = {
  /** 表示バリアント */
  variant?: FilterPanelVariant;
  /** 利用可能なシステム一覧 */
  systems: SystemItem[];
  /** 利用可能なタグ一覧 */
  tags: TagItem[];
  /** フィルター状態（useFilterStateから取得） */
  filterState: UseFilterStateReturn;
  /** ボトムシートを閉じるコールバック（variant='bottomsheet'時のみ使用） */
  onClose?: () => void;
};

export type DurationOption = {
  value: string;
  label: string;
};

export const DURATION_OPTIONS: DurationOption[] = [
  { value: '~1h', label: '〜1h' },
  { value: '1~3h', label: '1〜3h' },
  { value: '3~6h', label: '3〜6h' },
  { value: '6h~', label: '6h〜' },
];

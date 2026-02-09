import type { FilterParams } from '@/app/(main)/scenarios/searchParams';

export type SystemItem = {
  systemId: string;
  name: string;
};

export type TagItem = {
  tagId: string;
  name: string;
};

/**
 * FilterPanel が依存する共通インターフェース
 * useFilterState / useFilterDraft の両方がこの型を満たす
 */
export type FilterStateBase = {
  mode: 'immediate' | 'draft';
  params: FilterParams;
  isPending: boolean;
  activeFilterCount: number;
  toggleSystem: (systemId: string) => void;
  toggleTag: (tagId: string) => void;
  setPlayerRange: (min: number, max: number) => void;
  setPlaytimeRange: (min: number, max: number) => void;
  setKeyword: (q: string) => void;
  clearAll: () => void;
  /** ドラフトモード時のみ存在。検索ボタン押下でURLに一括反映 */
  commit?: () => void;
};

export type FilterPanelVariant = 'sidebar' | 'inline' | 'bottomsheet';

export type FilterPanelProps = {
  /** 表示バリアント */
  variant?: FilterPanelVariant;
  /** 利用可能なシステム一覧 */
  systems: SystemItem[];
  /** 利用可能なタグ一覧 */
  tags: TagItem[];
  /** フィルター状態（useFilterState / useFilterDraft から取得） */
  filterState: FilterStateBase;
  /** ボトムシートを閉じるコールバック（variant='bottomsheet'時のみ使用） */
  onClose?: () => void;
  /** システム選択セクションの表示制御（デフォルト: true） */
  showSystems?: boolean;
};

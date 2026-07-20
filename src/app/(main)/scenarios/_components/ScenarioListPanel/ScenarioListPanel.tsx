'use client';

import { CaretDown } from '@phosphor-icons/react/ssr';

import { ScenarioFilters } from '../ScenarioFilters';
import { ScenarioList } from '../ScenarioList';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';

import type {
  SystemItem,
  TagItem,
  UseFilterDraftReturn,
} from '@/components/blocks/FilterPanel';
import type { ScenarioWithRelations, SortOption } from '../../interface';

// ソートオプションの表示ラベル（ScenariosContent と同一）
const sortSelectItems: SelectItem[] = [
  { value: 'newest', label: '新着順' },
  { value: 'oldest', label: '古い順' },
  { value: 'playtime_asc', label: '短時間順' },
  { value: 'playtime_desc', label: '長時間順' },
];

export type ScenarioListPanelProps = {
  systems: SystemItem[];
  tags: TagItem[];
  draftState: UseFilterDraftReturn;
  scenarios: ScenarioWithRelations[];
  totalCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** 空状態からの「条件をリセット」 */
  onResetFilters?: () => void;
};

/**
 * ScenarioListPanel - シナリオ一覧ペイン（2ペイン左側）
 *
 * 上部インラインフィルター（ScenarioFilters）＋検索結果ヘッダー（件数/並び替え）
 * ＋カードグリッド（ScenarioList）を積んだ自己完結パネル。ScenarioDetailPanel と
 * 横並びにして 2 ペインを構成する。データ取得は持たず、props で受け取る
 * プレゼンテーショナルコンポーネント。
 */
export const ScenarioListPanel = ({
  systems,
  tags,
  draftState,
  scenarios,
  totalCount,
  sort,
  onSortChange,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onResetFilters,
}: ScenarioListPanelProps) => {
  return (
    <div className={styles.panel}>
      {/* 上部インラインフィルター */}
      <ScenarioFilters systems={systems} tags={tags} draftState={draftState} />

      {/* 検索結果ヘッダー */}
      <div className={styles.resultHeader}>
        <div className={styles.resultCount}>検索結果：{totalCount}件</div>

        <div className={styles.sortArea}>
          <span className={styles.sortLabel}>並び替え：</span>
          <div className={styles.sortSelectWrapper}>
            <Select
              items={sortSelectItems}
              value={[sort]}
              onValueChange={(details: SelectValueChangeDetails<SelectItem>) =>
                onSortChange(details.value[0] as SortOption)
              }
              variant="minimal"
              aria-label="並び替え"
            />
          </div>
        </div>
      </div>

      {/* カードグリッド */}
      <ScenarioList
        scenarios={scenarios}
        isLoading={isLoading}
        {...(onResetFilters ? { onReset: onResetFilters } : {})}
      />

      {/* もっと見る */}
      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <Button
            variant="outline"
            status="primary"
            onClick={onLoadMore}
            loading={isLoadingMore}
            loadingText="読み込み中..."
            className={styles.loadMoreButton}
          >
            <CaretDown size={18} className={styles.loadMoreIcon} />
            もっと見る
          </Button>
        </div>
      )}
    </div>
  );
};

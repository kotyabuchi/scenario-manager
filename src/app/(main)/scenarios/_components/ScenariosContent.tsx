'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { isNil } from 'ramda';

import { ScenarioList } from './ScenarioList';
import * as styles from './styles';

import { FilterBottomSheet } from '@/components/blocks/FilterBottomSheet';
import { FilterChipBar } from '@/components/blocks/FilterChipBar';
import { FilterPanel, useFilterState } from '@/components/blocks/FilterPanel';
import { Button } from '@/components/elements/button/button';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';
import { getAppLogger } from '@/lib/logger';

import type { SystemItem, TagItem } from '@/components/blocks/FilterPanel';
import type {
  ScenarioSystem,
  SearchResult,
  SortOption,
  Tag,
} from '../interface';

// ソートオプションの定義
const sortOptions: SelectItem[] = [
  { value: 'newest', label: '新着順' },
  { value: 'rating', label: '高評価順' },
  { value: 'playtime_asc', label: '短時間順' },
  { value: 'playtime_desc', label: '長時間順' },
];

type ScenariosContentProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
  initialResult: SearchResult;
};

// API用のクエリ文字列を構築
const buildApiQueryString = (params: {
  systems: string[];
  tags: string[];
  minPlayer: number | null;
  maxPlayer: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  q: string;
  sort: SortOption;
}): string => {
  const query = new URLSearchParams();

  if (params.systems.length > 0) {
    query.set('systems', params.systems.join(','));
  }

  if (params.tags.length > 0) {
    query.set('tags', params.tags.join(','));
  }

  if (!isNil(params.minPlayer)) {
    query.set('minPlayer', params.minPlayer.toString());
  }

  if (!isNil(params.maxPlayer)) {
    query.set('maxPlayer', params.maxPlayer.toString());
  }

  if (!isNil(params.minPlaytime)) {
    query.set('minPlaytime', params.minPlaytime.toString());
  }

  if (!isNil(params.maxPlaytime)) {
    query.set('maxPlaytime', params.maxPlaytime.toString());
  }

  if (params.q !== '') {
    query.set('q', params.q);
  }

  if (params.sort !== 'newest') {
    query.set('sort', params.sort);
  }

  const qs = query.toString();
  return qs ? `?${qs}` : '?';
};

export const ScenariosContent = ({
  systems,
  tags,
  initialResult,
}: ScenariosContentProps) => {
  // フィルター状態（URLと同期）
  const filterState = useFilterState();
  const { params, isPending, activeFilterCount, toggleSystem, clearAll } =
    filterState;

  // ソート状態
  const [sort, setSort] = useState<SortOption>('newest');

  // 検索結果状態
  const [searchResult, setSearchResult] = useState<SearchResult>(initialResult);
  const [offset, setOffset] = useState(0);

  // モバイル用ボトムシートの開閉状態
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // タブレット用ドロップダウンの開閉状態（将来的にPopoverで実装）
  const [_activeDropdown, setActiveDropdown] = useState<
    'system' | 'tag' | 'player' | 'time' | null
  >(null);

  // SystemItem/TagItem 形式に変換
  const systemItems: SystemItem[] = systems.map((s) => ({
    systemId: s.systemId,
    name: s.name,
  }));

  const tagItems: TagItem[] = tags.map((t) => ({
    tagId: t.tagId,
    name: t.name,
  }));

  // フィルターパラメータが変更されたら検索を実行
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const queryString = buildApiQueryString({
          systems: params.systems,
          tags: params.tags,
          minPlayer: params.minPlayer,
          maxPlayer: params.maxPlayer,
          minPlaytime: params.minPlaytime,
          maxPlaytime: params.maxPlaytime,
          q: params.q,
          sort,
        });
        const response = await fetch(
          `/api/scenarios/search${queryString}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data = (await response.json()) as SearchResult;
          setSearchResult(data);
          setOffset(0);
        }
      } catch (error) {
        getAppLogger(['app', 'scenarios']).error`Search failed: ${error}`;
      }
    };

    fetchResults();
  }, [
    params.systems,
    params.tags,
    params.minPlayer,
    params.maxPlayer,
    params.minPlaytime,
    params.maxPlaytime,
    params.q,
    sort,
  ]);

  // ソート変更
  const handleSortChange = useCallback(
    (details: SelectValueChangeDetails<SelectItem>) => {
      setSort(details.value[0] as SortOption);
    },
    [],
  );

  // もっと見る
  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const queryString = buildApiQueryString({
        systems: params.systems,
        tags: params.tags,
        minPlayer: params.minPlayer,
        maxPlayer: params.maxPlayer,
        minPlaytime: params.minPlaytime,
        maxPlaytime: params.maxPlaytime,
        q: params.q,
        sort,
      });
      const response = await fetch(
        `/api/scenarios/search${queryString}&limit=20&offset=${newOffset}`,
      );
      if (response.ok) {
        const data = (await response.json()) as SearchResult;
        setSearchResult((prev) => ({
          scenarios: [...prev.scenarios, ...data.scenarios],
          totalCount: data.totalCount,
        }));
        setOffset(newOffset);
      }
    } catch (error) {
      getAppLogger(['app', 'scenarios']).error`Load more failed: ${error}`;
    }
  }, [params, sort, offset]);

  // 検索条件をリセット
  const handleReset = useCallback(() => {
    clearAll();
  }, [clearAll]);

  // タブレット用ドロップダウンを開く
  const handleOpenDropdown = useCallback(
    (type: 'system' | 'tag' | 'player' | 'time') => {
      setActiveDropdown(type);
      // TODO: Popover実装時にここでドロップダウンを開く
    },
    [],
  );

  const hasMore = searchResult.scenarios.length < searchResult.totalCount;

  // 選択中のシステム（モバイル用チップ表示）
  const selectedSystems = params.systems
    .map((id) => {
      const system = systems.find((s) => s.systemId === id);
      return system ? { systemId: id, name: system.name } : null;
    })
    .filter((s): s is { systemId: string; name: string } => s !== null);

  return (
    <>
      {/* キーワード検索バー */}
      <div className={styles.keywordSearchBar}>
        <div className={styles.keywordSearchContent}>
          <Search size={20} color="#9CA3AF" />
          <input
            type="text"
            placeholder="シナリオを検索..."
            className={styles.keywordSearchInput}
            value={params.q}
            onChange={(e) => filterState.setKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* モバイル用フィルターボタン行（768px未満） */}
      <div className={styles.mobileFilterRow}>
        <button
          type="button"
          className={styles.mobileFilterButton}
          onClick={() => setIsBottomSheetOpen(true)}
        >
          <Filter size={16} />
          フィルター
          {activeFilterCount > 0 && (
            <span className={styles.mobileFilterBadge}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* 選択中のフィルターをチップで表示 */}
        <div className={styles.mobileFilterChips}>
          {selectedSystems.slice(0, 2).map((system) => (
            <div key={system.systemId} className={styles.mobileFilterChip}>
              {system.name}
              <button
                type="button"
                className={styles.mobileFilterChipRemove}
                onClick={() => toggleSystem(system.systemId)}
                aria-label={`${system.name}を削除`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <span className={styles.mobileResultCount}>
          {searchResult.totalCount}件
        </span>
      </div>

      {/* タブレット用フィルターバー（768px〜1023px） */}
      <div className={styles.filterChipBarWrapper}>
        <div className={styles.filterChipBarContent}>
          <FilterChipBar
            systems={systemItems}
            tags={tagItems}
            filterState={filterState}
            onOpenDropdown={handleOpenDropdown}
          />
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className={styles.mainContent}>
        {/* サイドバー（デスクトップのみ、1024px以上） */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarPanel}>
            <FilterPanel
              variant="sidebar"
              systems={systemItems}
              tags={tagItems}
              filterState={filterState}
            />
          </div>
        </aside>

        {/* 結果コンテンツ */}
        <div className={styles.resultsContent}>
          <div className={styles.resultHeader}>
            <div className={styles.resultCount}>
              検索結果：{searchResult.totalCount}件
            </div>

            <div className={styles.sortArea}>
              <span className={styles.sortLabel}>並び替え：</span>
              <div className={styles.sortSelectWrapper}>
                <Select
                  items={sortOptions}
                  value={[sort]}
                  onValueChange={handleSortChange}
                  variant="minimal"
                />
              </div>
            </div>
          </div>

          <ScenarioList
            scenarios={searchResult.scenarios}
            isLoading={isPending}
            onReset={handleReset}
          />

          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <Button
                variant="outline"
                status="primary"
                onClick={handleLoadMore}
                className={styles.loadMoreButton}
              >
                <ChevronDown size={18} className={styles.loadMoreIcon} />
                もっと見る
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* モバイル用フィルターボトムシート */}
      <FilterBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        systems={systemItems}
        tags={tagItems}
        filterState={filterState}
      />
    </>
  );
};

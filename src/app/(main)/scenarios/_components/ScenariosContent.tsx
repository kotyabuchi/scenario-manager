'use client';

import { useCallback, useEffect, useState } from 'react';
import { CaretDown, Faders } from '@phosphor-icons/react/ssr';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { isNil } from 'ramda';

import { sortOptions } from '../searchParams';
import { MobileSearchBar } from './MobileSearchBar';
import { ScenarioList } from './ScenarioList';
import { SearchSidebar } from './SearchSidebar';
import { SearchTopBar } from './SearchTopBar';
import * as styles from './styles';

import { FilterBottomSheet } from '@/components/blocks/FilterBottomSheet';
import { useFilterDraft } from '@/components/blocks/FilterPanel';
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

// ソートオプションの表示ラベル
const sortSelectItems: SelectItem[] = [
  { value: 'newest', label: '新着順' },
  { value: 'oldest', label: '古い順' },
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
  // ドラフト式フィルター状態
  const draftState = useFilterDraft();

  // ソート状態（URLと同期）
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(sortOptions).withDefault('newest'),
  );

  // 検索結果状態
  const [searchResult, setSearchResult] = useState<SearchResult>(initialResult);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // モバイル用ボトムシートの開閉状態
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // サイドバーの折りたたみ状態
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // SystemItem/TagItem 形式に変換
  const systemItems: SystemItem[] = systems.map((s) => ({
    systemId: s.systemId,
    name: s.name,
  }));

  const tagItems: TagItem[] = tags.map((t) => ({
    tagId: t.tagId,
    name: t.name,
  }));

  // committed の変更で検索を実行（ドラフトではなく確定値のみ監視）
  useEffect(() => {
    const abortController = new AbortController();

    // フィルター変更時はページネーションを即座にリセット
    setOffset(0);

    const fetchResults = async () => {
      try {
        const queryString = buildApiQueryString({
          systems: draftState.committed.systems,
          tags: draftState.committed.tags,
          minPlayer: draftState.committed.minPlayer,
          maxPlayer: draftState.committed.maxPlayer,
          minPlaytime: draftState.committed.minPlaytime,
          maxPlaytime: draftState.committed.maxPlaytime,
          q: draftState.committed.q,
          sort,
        });
        const response = await fetch(
          `/api/scenarios/search${queryString}&limit=20&offset=0`,
          { signal: abortController.signal },
        );
        if (response.ok) {
          const data = (await response.json()) as SearchResult;
          setSearchResult(data);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        getAppLogger(['app', 'scenarios']).error`Search failed: ${error}`;
      }
    };

    fetchResults();

    return () => {
      abortController.abort();
    };
  }, [
    draftState.committed.systems,
    draftState.committed.tags,
    draftState.committed.minPlayer,
    draftState.committed.maxPlayer,
    draftState.committed.minPlaytime,
    draftState.committed.maxPlaytime,
    draftState.committed.q,
    sort,
  ]);

  // ソート変更
  const handleSortChange = useCallback(
    (details: SelectValueChangeDetails<SelectItem>) => {
      setSort(details.value[0] as SortOption);
    },
    [setSort],
  );

  // もっと見る
  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;
    setIsLoadingMore(true);

    try {
      const queryString = buildApiQueryString({
        systems: draftState.committed.systems,
        tags: draftState.committed.tags,
        minPlayer: draftState.committed.minPlayer,
        maxPlayer: draftState.committed.maxPlayer,
        minPlaytime: draftState.committed.minPlaytime,
        maxPlaytime: draftState.committed.maxPlaytime,
        q: draftState.committed.q,
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
    } finally {
      setIsLoadingMore(false);
    }
  }, [draftState.committed, sort, offset]);

  const hasMore = searchResult.scenarios.length < searchResult.totalCount;

  return (
    <>
      {/* PC: 上部検索バー（lg 以上） */}
      <SearchTopBar systems={systemItems} draftState={draftState} />

      {/* SP: 検索バー（lg 未満） */}
      <MobileSearchBar systems={systemItems} draftState={draftState} />

      {/* SP: フィルターボタン（lg 未満） */}
      <div className={styles.mobileFilterRow}>
        <button
          type="button"
          className={styles.mobileFilterButton}
          onClick={() => setIsBottomSheetOpen(true)}
        >
          <Faders size={16} />
          フィルター
          {draftState.activeFilterCount > 0 && (
            <span className={styles.mobileFilterBadge}>
              {draftState.activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* メインコンテンツエリア */}
      <div className={styles.mainContent}>
        {/* PC: サイドバー（lg 以上） */}
        <SearchSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((p) => !p)}
          systems={systemItems}
          tags={tagItems}
          draftState={draftState}
        />

        {/* 結果コンテンツ（isPending 時はローディングオーバーレイ表示） */}
        <div className={styles.resultsContent} aria-busy={draftState.isPending}>
          <div className={styles.resultHeader}>
            <div className={styles.resultCount}>
              検索結果：{searchResult.totalCount}件
            </div>

            <div className={styles.sortArea}>
              <span className={styles.sortLabel}>並び替え：</span>
              <div className={styles.sortSelectWrapper}>
                <Select
                  items={sortSelectItems}
                  value={[sort]}
                  onValueChange={handleSortChange}
                  variant="minimal"
                  aria-label="並び替え"
                />
              </div>
            </div>
          </div>

          <ScenarioList
            scenarios={searchResult.scenarios}
            isLoading={draftState.isPending}
            onReset={() => {
              draftState.clearAll();
              draftState.commit();
            }}
          />

          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <Button
                variant="outline"
                status="primary"
                onClick={handleLoadMore}
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
      </div>

      {/* SP: フィルターボトムシート */}
      <FilterBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        systems={systemItems}
        tags={tagItems}
        filterState={draftState}
      />
    </>
  );
};

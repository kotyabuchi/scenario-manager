'use client';

import { useCallback, useState, useTransition } from 'react';
import { useQueryStates } from 'nuqs';
import { isNil } from 'ramda';

import { searchParamsParsers } from '../searchParams';
import { ScenarioList } from './ScenarioList';
import { SearchPanel } from './SearchPanel';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { css } from '@/styled-system/css';

import type {
  ScenarioSystem,
  SearchParams,
  SearchResult,
  SortOption,
  Tag,
} from '../interface';

type ScenariosContentProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
  initialResult: SearchResult;
  initialParams: SearchParams;
};

const selectStyle = css({
  px: 'sm',
  py: 'xs',
  border: '1px solid',
  borderColor: 'border.500',
  borderRadius: 'sm',
  bg: 'bg.primary',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  cursor: 'pointer',
  _focus: {
    borderColor: 'primary.500',
  },
});

// API用のクエリ文字列を構築
const buildApiQueryString = (
  params: SearchParams,
  sort: SortOption,
): string => {
  const query = new URLSearchParams();

  if (!isNil(params.systemIds) && params.systemIds.length > 0) {
    query.set('systems', params.systemIds.join(','));
  }

  if (!isNil(params.tagIds) && params.tagIds.length > 0) {
    query.set('tags', params.tagIds.join(','));
  }

  if (!isNil(params.playerCount)) {
    if (params.playerCount.min !== 1) {
      query.set('minPlayer', params.playerCount.min.toString());
    }
    if (params.playerCount.max !== 20) {
      query.set('maxPlayer', params.playerCount.max.toString());
    }
  }

  if (!isNil(params.playtime)) {
    if (params.playtime.min !== 1) {
      query.set('minPlaytime', params.playtime.min.toString());
    }
    if (params.playtime.max !== 24) {
      query.set('maxPlaytime', params.playtime.max.toString());
    }
  }

  if (!isNil(params.scenarioName) && params.scenarioName !== '') {
    query.set('q', params.scenarioName);
  }

  if (sort !== 'newest') {
    query.set('sort', sort);
  }

  const qs = query.toString();
  return qs ? `?${qs}` : '?';
};

export const ScenariosContent = ({
  systems,
  tags,
  initialResult,
  initialParams,
}: ScenariosContentProps) => {
  const [isPending, startTransition] = useTransition();

  // nuqsで型安全にURL状態を管理
  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  });

  const [searchResult, setSearchResult] = useState<SearchResult>(initialResult);
  const [currentParams, setCurrentParams] =
    useState<SearchParams>(initialParams);
  const [offset, setOffset] = useState(0);

  const handleSearch = useCallback(
    async (params: SearchParams) => {
      setCurrentParams(params);
      setOffset(0);

      // nuqsでURL更新（自動で反映される）
      await setQueryParams({
        systems: params.systemIds ?? [],
        tags: params.tagIds ?? [],
        minPlayer: params.playerCount?.min ?? null,
        maxPlayer: params.playerCount?.max ?? null,
        minPlaytime: params.playtime?.min ?? null,
        maxPlaytime: params.playtime?.max ?? null,
        q: params.scenarioName ?? '',
      });

      // サーバーから検索結果を取得
      try {
        const queryString = buildApiQueryString(params, queryParams.sort);
        const response = await fetch(
          `/api/scenarios/search${queryString}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data = (await response.json()) as SearchResult;
          setSearchResult(data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    },
    [queryParams.sort, setQueryParams],
  );

  const handleSortChange = useCallback(
    async (newSort: SortOption) => {
      setOffset(0);

      // nuqsでソート更新
      await setQueryParams({ sort: newSort });

      // サーバーから検索結果を取得
      try {
        const queryString = buildApiQueryString(currentParams, newSort);
        const response = await fetch(
          `/api/scenarios/search${queryString}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data = (await response.json()) as SearchResult;
          setSearchResult(data);
        }
      } catch (error) {
        console.error('Sort failed:', error);
      }
    },
    [currentParams, setQueryParams],
  );

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const queryString = buildApiQueryString(currentParams, queryParams.sort);
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
      console.error('Load more failed:', error);
    }
  }, [currentParams, queryParams.sort, offset]);

  const hasMore = searchResult.scenarios.length < searchResult.totalCount;

  return (
    <>
      <SearchPanel
        systems={systems}
        tags={tags}
        defaultParams={currentParams}
        onSearch={handleSearch}
      />

      <div className={styles.resultCount}>
        検索結果: {searchResult.totalCount}件
      </div>

      <div className={styles.sortSelect}>
        <span>ソート:</span>
        <select
          value={queryParams.sort}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
          className={selectStyle}
        >
          <option value="newest">新着順</option>
          <option value="rating">高評価順</option>
          <option value="playtime_asc">プレイ時間（短い順）</option>
          <option value="playtime_desc">プレイ時間（長い順）</option>
        </select>
      </div>

      <ScenarioList scenarios={searchResult.scenarios} isLoading={isPending} />

      {hasMore && (
        <div
          className={css({
            display: 'flex',
            justifyContent: 'center',
            mt: 'xl',
          })}
        >
          <Button variant="outline" onClick={handleLoadMore}>
            もっと見る
          </Button>
        </div>
      )}
    </>
  );
};

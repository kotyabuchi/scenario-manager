'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { isNil } from 'ramda';

import { sortOptions } from '../searchParams';
import { ScenarioListPanel } from './ScenarioListPanel';
import {
  type ScenarioListSnapshot,
  useScenarioListSession,
} from './ScenarioListSession';

import { useFilterDraft } from '@/components/blocks/FilterPanel';
import { getAppLogger } from '@/lib/logger';

import type {
  ScenarioSystem,
  SearchResult,
  SortOption,
  Tag,
} from '../interface';

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
  const pathname = usePathname();
  const listSession = useScenarioListSession();
  // ドラフト式フィルター状態
  const draftState = useFilterDraft();

  // ソート状態（URLと同期）
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(sortOptions).withDefault('newest'),
  );

  const searchQueryString = buildApiQueryString({
    systems: draftState.committed.systems,
    tags: draftState.committed.tags,
    minPlayer: draftState.committed.minPlayer,
    maxPlayer: draftState.committed.maxPlayer,
    minPlaytime: draftState.committed.minPlaytime,
    maxPlaytime: draftState.committed.maxPlaytime,
    q: draftState.committed.q,
    sort,
  });

  const [resultState, setResultState] = useState<ScenarioListSnapshot>(() => {
    const snapshot = listSession.snapshot;
    return snapshot?.queryString === searchQueryString
      ? snapshot
      : { queryString: searchQueryString, result: initialResult, offset: 0 };
  });
  const restoredQuery = useRef<string | null>(
    listSession.snapshot?.queryString === searchQueryString
      ? searchQueryString
      : null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // FilterPanel の選択肢へ変換
  const systemItems = systems.map((s) => ({
    systemId: s.systemId,
    name: s.name,
  }));

  const tagItems = tags.map((t) => ({
    tagId: t.tagId,
    name: t.name,
  }));

  useEffect(() => {
    listSession.snapshot = resultState;
  }, [listSession, resultState]);

  // committed の変更で検索を実行（ドラフトではなく確定値のみ監視）
  useEffect(() => {
    if (restoredQuery.current === searchQueryString) return;
    restoredQuery.current = null;
    const abortController = new AbortController();

    const fetchResults = async () => {
      try {
        const response = await fetch(
          `/api/scenarios/search${searchQueryString}&limit=20&offset=0`,
          { signal: abortController.signal },
        );
        if (response.ok) {
          const data = (await response.json()) as SearchResult;
          setResultState({
            queryString: searchQueryString,
            result: data,
            offset: 0,
          });
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
  }, [searchQueryString]);

  // 一覧が並列ルートに保持されている間は、閉じた後に元のカードへフォーカスを戻す。
  useEffect(() => {
    if (pathname !== '/scenarios' || isNil(listSession.openedScenarioId))
      return;
    const scenarioId = listSession.openedScenarioId;
    const frame = requestAnimationFrame(() => {
      listSession.listPaneElement?.scrollTo({ top: listSession.scrollTop });
      const cards = document.querySelectorAll<HTMLAnchorElement>(
        'a[data-scenario-id]',
      );
      const card = Array.from(cards).find(
        (element) => element.dataset.scenarioId === scenarioId,
      );
      card?.focus({ preventScroll: true });
      listSession.openedScenarioId = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, listSession]);

  const handleSortChange = useCallback(
    (nextSort: SortOption) => {
      void setSort(nextSort);
    },
    [setSort],
  );

  // もっと見る
  const handleLoadMore = useCallback(async () => {
    if (resultState.queryString !== searchQueryString) return;
    const newOffset = resultState.offset + 20;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/scenarios/search${searchQueryString}&limit=20&offset=${newOffset}`,
      );
      if (response.ok) {
        const data = (await response.json()) as SearchResult;
        setResultState((previous) => ({
          queryString: searchQueryString,
          result: {
            scenarios: [...previous.result.scenarios, ...data.scenarios],
            totalCount: data.totalCount,
          },
          offset: newOffset,
        }));
      }
    } catch (error) {
      getAppLogger(['app', 'scenarios']).error`Load more failed: ${error}`;
    } finally {
      setIsLoadingMore(false);
    }
  }, [searchQueryString, resultState.offset, resultState.queryString]);

  const hasMore =
    resultState.queryString === searchQueryString &&
    resultState.result.scenarios.length < resultState.result.totalCount;

  const returnTo =
    searchQueryString === '?' ? '/scenarios' : `/scenarios${searchQueryString}`;

  return (
    <ScenarioListPanel
      systems={systemItems}
      tags={tagItems}
      draftState={draftState}
      scenarios={resultState.result.scenarios}
      totalCount={resultState.result.totalCount}
      sort={sort}
      onSortChange={handleSortChange}
      isLoading={draftState.isPending}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
      onResetFilters={() => {
        draftState.clearAll();
        draftState.commit();
      }}
      returnTo={returnTo}
      onScenarioOpen={(scenarioId) => {
        listSession.snapshot = resultState;
        listSession.openedScenarioId = scenarioId;
        listSession.scrollTop = listSession.listPaneElement?.scrollTop ?? 0;
      }}
    />
  );
};

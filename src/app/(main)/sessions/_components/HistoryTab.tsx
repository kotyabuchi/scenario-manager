'use client';

import { useCallback, useState, useTransition } from 'react';
import { useQueryStates } from 'nuqs';

import { searchParamsParsers } from '../searchParams';
import { EmptyState } from './EmptyState';
import { FilterPanel } from './FilterPanel';
import { SessionList } from './SessionList';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { css } from '@/styled-system/css';

import type {
  HistorySortOption,
  MySessionWithRole,
  RoleFilter,
  ScenarioSystem,
  SearchResult,
  StatusFilter,
} from '../interface';

type HistoryTabProps = {
  systems: ScenarioSystem[];
  initialResult: SearchResult<MySessionWithRole>;
  initialRole: RoleFilter;
  initialStatus: StatusFilter;
  initialSystems: string[];
};

// セレクトのスタイル（ボーダーレス、背景色で区別）
const selectStyle = css({
  px: 'md',
  py: 'sm',
  border: 'none',
  borderRadius: 'md',
  bg: 'bg.muted',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  transition: 'all 0.2s',
  shadow: 'sm',
  cursor: 'pointer',
  _hover: {
    bg: 'bg.emphasized',
  },
  _focus: {
    bg: 'bg.emphasized',
    shadow: '0 0 0 2px {colors.primary.focusRing}',
  },
});

export const HistoryTab = ({
  systems,
  initialResult,
  initialRole,
  initialStatus,
  initialSystems,
}: HistoryTabProps) => {
  const [isPending, startTransition] = useTransition();

  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  });

  const [searchResult, setSearchResult] =
    useState<SearchResult<MySessionWithRole>>(initialResult);
  const [currentRole, setCurrentRole] = useState<RoleFilter>(initialRole);
  const [currentStatus, setCurrentStatus] =
    useState<StatusFilter>(initialStatus);
  const [currentSystems, setCurrentSystems] =
    useState<string[]>(initialSystems);
  const [offset, setOffset] = useState(0);

  const buildQueryString = useCallback(
    (
      role: RoleFilter,
      status: StatusFilter,
      systemIds: string[],
      sort: HistorySortOption,
      limit: number,
      offsetVal: number,
    ) => {
      const params = new URLSearchParams({
        role,
        status,
        sort,
        limit: String(limit),
        offset: String(offsetVal),
      });
      if (systemIds.length > 0) {
        params.set('systems', systemIds.join(','));
      }
      return params.toString();
    },
    [],
  );

  const handleFilterChange = useCallback(
    async (role: RoleFilter, status: StatusFilter, systemIds: string[]) => {
      setCurrentRole(role);
      setCurrentStatus(status);
      setCurrentSystems(systemIds);
      setOffset(0);

      await setQueryParams({
        role,
        status,
        historySystems: systemIds.length > 0 ? systemIds : [],
      });

      try {
        const query = buildQueryString(
          role,
          status,
          systemIds,
          queryParams.historySort,
          20,
          0,
        );
        const response = await fetch(`/api/sessions/history?${query}`);
        if (response.ok) {
          const data =
            (await response.json()) as SearchResult<MySessionWithRole>;
          setSearchResult(data);
        }
      } catch (error) {
        console.error('Filter change failed:', error);
      }
    },
    [queryParams.historySort, setQueryParams, buildQueryString],
  );

  const handleSortChange = useCallback(
    async (newSort: HistorySortOption) => {
      await setQueryParams({ historySort: newSort });
      setOffset(0);

      try {
        const query = buildQueryString(
          currentRole,
          currentStatus,
          currentSystems,
          newSort,
          20,
          0,
        );
        const response = await fetch(`/api/sessions/history?${query}`);
        if (response.ok) {
          const data =
            (await response.json()) as SearchResult<MySessionWithRole>;
          setSearchResult(data);
        }
      } catch (error) {
        console.error('Sort change failed:', error);
      }
    },
    [
      currentRole,
      currentStatus,
      currentSystems,
      setQueryParams,
      buildQueryString,
    ],
  );

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const query = buildQueryString(
        currentRole,
        currentStatus,
        currentSystems,
        queryParams.historySort,
        20,
        newOffset,
      );
      const response = await fetch(`/api/sessions/history?${query}`);
      if (response.ok) {
        const data = (await response.json()) as SearchResult<MySessionWithRole>;
        setSearchResult((prev) => ({
          sessions: [...prev.sessions, ...data.sessions],
          totalCount: data.totalCount,
        }));
        setOffset(newOffset);
      }
    } catch (error) {
      console.error('Load more failed:', error);
    }
  }, [
    offset,
    currentRole,
    currentStatus,
    currentSystems,
    queryParams.historySort,
    buildQueryString,
  ]);

  const hasMore = searchResult.sessions.length < searchResult.totalCount;

  return (
    <>
      <FilterPanel
        systems={systems}
        selectedRole={currentRole}
        selectedStatus={currentStatus}
        selectedSystems={currentSystems}
        onFilterChange={handleFilterChange}
      />

      <div className={styles.resultHeader}>
        <div className={styles.resultCount}>
          参加履歴: {searchResult.totalCount}件
        </div>

        <div className={styles.sortSelect}>
          <span>ソート:</span>
          <select
            value={queryParams.historySort}
            onChange={(e) =>
              handleSortChange(e.target.value as HistorySortOption)
            }
            className={selectStyle}
          >
            <option value="date_desc">開催日順（新しい順）</option>
            <option value="date_asc">開催日順（古い順）</option>
          </select>
        </div>
      </div>

      {searchResult.sessions.length === 0 ? (
        <EmptyState type="history" />
      ) : (
        <div
          className={css({
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 0.2s',
          })}
        >
          <SessionList sessions={searchResult.sessions} variant="my" showMeta />

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
        </div>
      )}
    </>
  );
};

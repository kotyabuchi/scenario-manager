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
  RoleFilterValue,
  ScenarioSystem,
  SearchResult,
  StatusFilterValue,
} from '../interface';

type HistoryTabProps = {
  systems: ScenarioSystem[];
  initialResult: SearchResult<MySessionWithRole>;
  initialRoles: RoleFilterValue[];
  initialStatuses: StatusFilterValue[];
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
  initialRoles,
  initialStatuses,
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
  const [currentRoles, setCurrentRoles] =
    useState<RoleFilterValue[]>(initialRoles);
  const [currentStatuses, setCurrentStatuses] =
    useState<StatusFilterValue[]>(initialStatuses);
  const [currentSystems, setCurrentSystems] =
    useState<string[]>(initialSystems);
  const [offset, setOffset] = useState(0);

  const buildQueryString = useCallback(
    (
      roles: RoleFilterValue[],
      statuses: StatusFilterValue[],
      systemIds: string[],
      sort: HistorySortOption,
      limit: number,
      offsetVal: number,
    ) => {
      const params = new URLSearchParams({
        sort,
        limit: String(limit),
        offset: String(offsetVal),
      });
      if (roles.length > 0) {
        params.set('roles', roles.join(','));
      }
      if (statuses.length > 0) {
        params.set('statuses', statuses.join(','));
      }
      if (systemIds.length > 0) {
        params.set('systems', systemIds.join(','));
      }
      return params.toString();
    },
    [],
  );

  const handleFilterChange = useCallback(
    async (
      roles: RoleFilterValue[],
      statuses: StatusFilterValue[],
      systemIds: string[],
    ) => {
      setCurrentRoles(roles);
      setCurrentStatuses(statuses);
      setCurrentSystems(systemIds);
      setOffset(0);

      await setQueryParams({
        roles: roles.length > 0 ? roles : [],
        statuses: statuses.length > 0 ? statuses : [],
        historySystems: systemIds.length > 0 ? systemIds : [],
      });

      try {
        const query = buildQueryString(
          roles,
          statuses,
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
          currentRoles,
          currentStatuses,
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
      currentRoles,
      currentStatuses,
      currentSystems,
      setQueryParams,
      buildQueryString,
    ],
  );

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const query = buildQueryString(
        currentRoles,
        currentStatuses,
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
    currentRoles,
    currentStatuses,
    currentSystems,
    queryParams.historySort,
    buildQueryString,
  ]);

  const hasMore = searchResult.sessions.length < searchResult.totalCount;

  return (
    <>
      <FilterPanel
        systems={systems}
        selectedRoles={currentRoles}
        selectedStatuses={currentStatuses}
        selectedSystems={currentSystems}
        onFilterChange={handleFilterChange}
      />

      <div className={styles.resultHeader}>
        <div className={styles.resultCount}>
          参加履歴: {searchResult.totalCount}件
        </div>

        <div className={styles.sortTabs}>
          <button
            type="button"
            onClick={() => handleSortChange('date_desc')}
            className={styles.sortTabButton({
              active: queryParams.historySort === 'date_desc',
            })}
          >
            新しい順
          </button>
          <button
            type="button"
            onClick={() => handleSortChange('date_asc')}
            className={styles.sortTabButton({
              active: queryParams.historySort === 'date_asc',
            })}
          >
            古い順
          </button>
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

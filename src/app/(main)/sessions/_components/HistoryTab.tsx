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
  SearchResult,
  StatusFilter,
} from '../interface';

type HistoryTabProps = {
  initialResult: SearchResult<MySessionWithRole>;
  initialRole: RoleFilter;
  initialStatus: StatusFilter;
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

export const HistoryTab = ({
  initialResult,
  initialRole,
  initialStatus,
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
  const [offset, setOffset] = useState(0);

  const handleFilterChange = useCallback(
    async (role: RoleFilter, status: StatusFilter) => {
      setCurrentRole(role);
      setCurrentStatus(status);
      setOffset(0);

      await setQueryParams({
        role,
        status,
      });

      try {
        const response = await fetch(
          `/api/sessions/history?role=${role}&status=${status}&sort=${queryParams.historySort}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data =
            (await response.json()) as SearchResult<MySessionWithRole>;
          setSearchResult(data);
        }
      } catch (error) {
        console.error('Filter change failed:', error);
      }
    },
    [queryParams.historySort, setQueryParams],
  );

  const handleSortChange = useCallback(
    async (newSort: HistorySortOption) => {
      await setQueryParams({ historySort: newSort });
      setOffset(0);

      try {
        const response = await fetch(
          `/api/sessions/history?role=${currentRole}&status=${currentStatus}&sort=${newSort}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data =
            (await response.json()) as SearchResult<MySessionWithRole>;
          setSearchResult(data);
        }
      } catch (error) {
        console.error('Sort change failed:', error);
      }
    },
    [currentRole, currentStatus, setQueryParams],
  );

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const response = await fetch(
        `/api/sessions/history?role=${currentRole}&status=${currentStatus}&sort=${queryParams.historySort}&limit=20&offset=${newOffset}`,
      );
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
  }, [offset, currentRole, currentStatus, queryParams.historySort]);

  const hasMore = searchResult.sessions.length < searchResult.totalCount;

  return (
    <>
      <FilterPanel
        selectedRole={currentRole}
        selectedStatus={currentStatus}
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

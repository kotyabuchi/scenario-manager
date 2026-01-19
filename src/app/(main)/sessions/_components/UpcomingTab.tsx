'use client';

import { useCallback, useState, useTransition } from 'react';
import { Calendar, List } from 'lucide-react';
import { useQueryStates } from 'nuqs';

import { searchParamsParsers } from '../searchParams';
import { CalendarView } from './CalendarView';
import { EmptyState } from './EmptyState';
import { SessionList } from './SessionList';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { css } from '@/styled-system/css';

import type {
  MySessionWithRole,
  SearchResult,
  UpcomingSortOption,
  ViewType,
} from '../interface';

type UpcomingTabProps = {
  initialResult: SearchResult<MySessionWithRole>;
};

export const UpcomingTab = ({ initialResult }: UpcomingTabProps) => {
  const [isPending, startTransition] = useTransition();

  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  });

  const [searchResult, setSearchResult] =
    useState<SearchResult<MySessionWithRole>>(initialResult);
  const [offset, setOffset] = useState(0);

  const handleSortChange = useCallback(
    async (newSort: UpcomingSortOption) => {
      await setQueryParams({ upcomingSort: newSort });

      try {
        const response = await fetch(
          `/api/sessions/upcoming?sort=${newSort}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data =
            (await response.json()) as SearchResult<MySessionWithRole>;
          setSearchResult(data);
          setOffset(0);
        }
      } catch (error) {
        console.error('Sort change failed:', error);
      }
    },
    [setQueryParams],
  );

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const response = await fetch(
        `/api/sessions/upcoming?sort=${queryParams.upcomingSort}&limit=20&offset=${newOffset}`,
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
  }, [offset, queryParams.upcomingSort]);

  const hasMore = searchResult.sessions.length < searchResult.totalCount;

  const handleViewChange = async (newView: ViewType) => {
    await setQueryParams({ view: newView });
  };

  const currentView = queryParams.view;

  return (
    <>
      <div className={styles.resultHeader}>
        <div className={styles.resultCount}>
          参加予定: {searchResult.totalCount}件
        </div>

        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: 'md',
          })}
        >
          {currentView === 'list' && (
            <div className={styles.sortTabs}>
              <button
                type="button"
                onClick={() => handleSortChange('date_asc')}
                className={styles.sortTabButton({
                  active: queryParams.upcomingSort === 'date_asc',
                })}
              >
                開催日順
              </button>
              <button
                type="button"
                onClick={() => handleSortChange('created_desc')}
                className={styles.sortTabButton({
                  active: queryParams.upcomingSort === 'created_desc',
                })}
              >
                登録日順
              </button>
            </div>
          )}

          <div className={styles.viewToggle}>
            <button
              type="button"
              className={styles.viewToggleButton({
                active: currentView === 'list',
              })}
              onClick={() => handleViewChange('list')}
              aria-label="リスト表示"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              className={styles.viewToggleButton({
                active: currentView === 'calendar',
              })}
              onClick={() => handleViewChange('calendar')}
              aria-label="カレンダー表示"
            >
              <Calendar size={18} />
            </button>
          </div>
        </div>
      </div>

      {searchResult.sessions.length === 0 ? (
        <EmptyState type="upcoming" />
      ) : (
        <div
          className={css({
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 0.2s',
          })}
        >
          {currentView === 'calendar' ? (
            <CalendarView sessions={searchResult.sessions} />
          ) : (
            <>
              <SessionList sessions={searchResult.sessions} variant="my" />

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
          )}
        </div>
      )}
    </>
  );
};

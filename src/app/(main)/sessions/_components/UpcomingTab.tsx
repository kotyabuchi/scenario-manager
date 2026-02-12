'use client';

import { useCallback, useState, useTransition } from 'react';
import { Calendar, CaretDown, ListBullets } from '@phosphor-icons/react/ssr';
import { useQueryStates } from 'nuqs';

import { searchParamsParsers } from '../searchParams';
import { CalendarView } from './CalendarView';
import { EmptyState } from './EmptyState';
import { SessionList } from './SessionList';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Select } from '@/components/elements/select/select';
import { ToggleGroup } from '@/components/elements/toggle-group/toggle-group';
import { getAppLogger } from '@/lib/logger';

import type { SelectValueChangeDetails } from '@/components/elements/select/select';
import type { ToggleItem } from '@/components/elements/toggle-group/toggle-group';
import type {
  MySessionWithRole,
  SearchResult,
  UpcomingSortOption,
  ViewType,
} from '../interface';

type UpcomingTabProps = {
  initialResult: SearchResult<MySessionWithRole>;
};

const viewToggleItems: ToggleItem[] = [
  { value: 'list', icon: <ListBullets size={18} />, label: 'リスト表示' },
  { value: 'calendar', icon: <Calendar size={18} />, label: 'カレンダー表示' },
];

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

  // ビュー切替はローカルstate
  const [currentView, setCurrentView] = useState<ViewType>('list');

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
        getAppLogger(['app', 'sessions']).error`Sort change failed: ${error}`;
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
      getAppLogger(['app', 'sessions']).error`Load more failed: ${error}`;
    }
  }, [offset, queryParams.upcomingSort]);

  const hasMore = searchResult.sessions.length < searchResult.totalCount;
  const isCalendarView = currentView === 'calendar';

  const handleViewChange = (newView: ViewType) => {
    setCurrentView(newView);
  };

  return (
    <div className={styles.contentArea_upcoming}>
      {/* Pencil準拠: 左にビュー切替、右に並び替え */}
      <div className={styles.resultHeader}>
        <ToggleGroup
          value={[currentView]}
          onValueChange={(details) => {
            const newView = details.value[0] as ViewType | undefined;
            if (newView) {
              handleViewChange(newView);
            }
          }}
          items={viewToggleItems}
        />
        <div className={styles.resultHeader_sortArea}>
          <span className={styles.resultHeader_sortLabel}>並び替え</span>
          <Select
            items={[
              { value: 'date_asc', label: '開催日順' },
              { value: 'created_desc', label: '登録日順' },
            ]}
            value={[queryParams.upcomingSort]}
            onValueChange={(
              details: SelectValueChangeDetails<{
                label: string;
                value: string;
              }>,
            ) => {
              const val = details.value[0] as UpcomingSortOption | undefined;
              if (val) handleSortChange(val);
            }}
            variant="minimal"
          />
        </div>
      </div>

      {searchResult.sessions.length === 0 ? (
        <EmptyState type="upcoming" />
      ) : (
        <div
          className={`${styles.viewContainer} ${isPending ? styles.viewContainer_pending : ''}`}
        >
          {/* リストパネル: カレンダー時は右サイドパネルに縮小 */}
          <div className={styles.listPanel({ calendarView: isCalendarView })}>
            <SessionList sessions={searchResult.sessions} variant="my" />
            {hasMore && !isCalendarView && (
              <div className={styles.moreButtonArea}>
                <Button variant="subtle" onClick={handleLoadMore}>
                  <CaretDown size={16} /> もっと見る
                </Button>
              </div>
            )}
          </div>

          {/* カレンダーパネル: 左から展開 */}
          <div
            className={styles.calendarPanel({ calendarView: isCalendarView })}
          >
            {isCalendarView && (
              <CalendarView sessions={searchResult.sessions} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

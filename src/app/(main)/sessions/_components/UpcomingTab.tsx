'use client';

import { useCallback, useState, useTransition } from 'react';
import { Calendar, ChevronDown, List } from 'lucide-react';
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
import { css, cx } from '@/styled-system/css';

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
  { value: 'list', icon: <List size={18} />, label: 'リスト表示' },
  { value: 'calendar', icon: <Calendar size={18} />, label: 'カレンダー表示' },
];

// アニメーション用スタイル
const viewContainer = css({
  display: 'flex',
  gap: '0',
  overflow: 'hidden',
  position: 'relative',
});

const listPanel = (isCalendarView: boolean) =>
  css({
    transition: 'all {durations.slower} cubic-bezier(0.4, 0, 0.2, 1)',
    width: isCalendarView ? '320px' : '100%',
    minWidth: isCalendarView ? '320px' : '0',
    flexShrink: 0,
    overflow: 'hidden',
  });

const calendarPanel = (isCalendarView: boolean) =>
  css({
    transition: 'all {durations.slower} cubic-bezier(0.4, 0, 0.2, 1)',
    width: isCalendarView ? 'calc(100% - 320px)' : '0',
    opacity: isCalendarView ? 1 : 0,
    overflow: 'hidden',
    flexShrink: 0,
  });

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
          className={cx(
            viewContainer,
            css({
              opacity: isPending ? 'disabled' : 1,
              transition: 'opacity {durations.normal}',
            }),
          )}
        >
          {/* リストパネル: カレンダー時は右サイドパネルに縮小 */}
          <div className={listPanel(isCalendarView)}>
            <SessionList sessions={searchResult.sessions} variant="my" />
            {hasMore && !isCalendarView && (
              <div className={styles.moreButtonArea}>
                <Button variant="subtle" onClick={handleLoadMore}>
                  <ChevronDown size={16} /> もっと見る
                </Button>
              </div>
            )}
          </div>

          {/* カレンダーパネル: 左から展開 */}
          <div className={calendarPanel(isCalendarView)}>
            {isCalendarView && (
              <CalendarView sessions={searchResult.sessions} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

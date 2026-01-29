'use client';

import { useCallback, useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import { isNil } from 'ramda';

import { searchParamsParsers } from '../searchParams';
import { EmptyState } from './EmptyState';
import { SearchPanel } from './SearchPanel';
import { SessionList } from './SessionList';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Select } from '@/components/elements/select/select';
import { getAppLogger } from '@/lib/logger';

import type { SelectValueChangeDetails } from '@/components/elements/select/select';
import type {
  PublicSearchResult,
  PublicSortOption,
  ScenarioSystem,
} from '../interface';
import type { SearchFormValues } from './schema';

type PublicTabProps = {
  systems: ScenarioSystem[];
  initialResult: PublicSearchResult;
  initialParams: {
    systems: string[];
    phases: string[];
    dateFrom: string;
    dateTo: string;
    q: string;
  };
};

// API用のクエリ文字列を構築
const buildApiQueryString = (
  params: {
    systems: string[];
    phases: string[];
    dateFrom?: string;
    dateTo?: string;
    q?: string;
  },
  sort: PublicSortOption,
): string => {
  const query = new URLSearchParams();

  if (params.systems.length > 0) {
    query.set('systems', params.systems.join(','));
  }

  if (params.phases.length > 0) {
    query.set('phases', params.phases.join(','));
  }

  if (!isNil(params.dateFrom) && params.dateFrom !== '') {
    query.set('dateFrom', params.dateFrom);
  }

  if (!isNil(params.dateTo) && params.dateTo !== '') {
    query.set('dateTo', params.dateTo);
  }

  if (!isNil(params.q) && params.q !== '') {
    query.set('q', params.q);
  }

  if (sort !== 'date_asc') {
    query.set('sort', sort);
  }

  const qs = query.toString();
  return qs ? `?${qs}` : '?';
};

export const PublicTab = ({
  systems,
  initialResult,
  initialParams,
}: PublicTabProps) => {
  const [isPending, startTransition] = useTransition();

  // nuqsで型安全にURL状態を管理
  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  });

  const [searchResult, setSearchResult] =
    useState<PublicSearchResult>(initialResult);
  const [currentParams, setCurrentParams] = useState(initialParams);
  const [offset, setOffset] = useState(0);

  const handleSearch = useCallback(
    async (formValues: SearchFormValues) => {
      const params = {
        systems: formValues.systems,
        phases: formValues.phases,
        dateFrom: formValues.dateFrom ?? '',
        dateTo: formValues.dateTo ?? '',
        q: formValues.q ?? '',
      };

      setCurrentParams(params);
      setOffset(0);

      // nuqsでURL更新
      await setQueryParams({
        systems: params.systems,
        phases: params.phases,
        dateFrom: params.dateFrom ?? null,
        dateTo: params.dateTo ?? null,
        q: params.q,
      });

      // サーバーから検索結果を取得
      try {
        const queryString = buildApiQueryString(params, queryParams.publicSort);
        const response = await fetch(
          `/api/sessions/search${queryString}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data = (await response.json()) as PublicSearchResult;
          setSearchResult(data);
        }
      } catch (error) {
        getAppLogger(['app', 'sessions']).error`Search failed: ${error}`;
      }
    },
    [queryParams.publicSort, setQueryParams],
  );

  const handleSortChange = useCallback(
    async (newSort: PublicSortOption) => {
      setOffset(0);

      // nuqsでソート更新
      await setQueryParams({ publicSort: newSort });

      // サーバーから検索結果を取得
      try {
        const queryString = buildApiQueryString(currentParams, newSort);
        const response = await fetch(
          `/api/sessions/search${queryString}&limit=20&offset=0`,
        );
        if (response.ok) {
          const data = (await response.json()) as PublicSearchResult;
          setSearchResult(data);
        }
      } catch (error) {
        getAppLogger(['app', 'sessions']).error`Sort failed: ${error}`;
      }
    },
    [currentParams, setQueryParams],
  );

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + 20;

    try {
      const queryString = buildApiQueryString(
        currentParams,
        queryParams.publicSort,
      );
      const response = await fetch(
        `/api/sessions/search${queryString}&limit=20&offset=${newOffset}`,
      );
      if (response.ok) {
        const data = (await response.json()) as PublicSearchResult;
        setSearchResult((prev) => ({
          sessions: [...prev.sessions, ...data.sessions],
          totalCount: data.totalCount,
        }));
        setOffset(newOffset);
      }
    } catch (error) {
      getAppLogger(['app', 'sessions']).error`Load more failed: ${error}`;
    }
  }, [currentParams, queryParams.publicSort, offset]);

  const hasMore = searchResult.sessions.length < searchResult.totalCount;

  return (
    <>
      {/* 検索パネルはタブバー直下（コンテンツエリアの外） */}
      <SearchPanel
        systems={systems}
        selectedSystems={currentParams.systems}
        selectedPhases={currentParams.phases}
        dateFrom={currentParams.dateFrom ?? ''}
        dateTo={currentParams.dateTo ?? ''}
        scenarioName={currentParams.q ?? ''}
        onSearch={handleSearch}
      />

      <div className={styles.contentArea_public}>
        <div className={styles.resultHeader}>
          <span className={styles.resultHeader_count}>
            {searchResult.totalCount}件のセッションが見つかりました
          </span>
          <div className={styles.resultHeader_sortArea}>
            <span className={styles.resultHeader_sortLabel}>並び替え</span>
            <Select
              items={[
                { value: 'date_asc', label: '開催日順' },
                { value: 'created_desc', label: '新着順' },
                { value: 'slots_desc', label: '残り枠順' },
              ]}
              value={[queryParams.publicSort]}
              onValueChange={(
                details: SelectValueChangeDetails<{
                  label: string;
                  value: string;
                }>,
              ) => {
                const val = details.value[0] as PublicSortOption | undefined;
                if (val) handleSortChange(val);
              }}
              variant="minimal"
            />
          </div>
        </div>

        {searchResult.sessions.length === 0 ? (
          <EmptyState type="public" />
        ) : (
          <>
            <SessionList sessions={searchResult.sessions} variant="public" />

            {hasMore && (
              <div className={styles.moreButtonArea}>
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isPending}
                >
                  <ChevronDown size={16} />
                  もっと見る
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

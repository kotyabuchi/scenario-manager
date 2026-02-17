'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react/ssr';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import { ALL_STATUSES, DEFAULT_STATUSES, sortOptions } from '../searchParams';
import { FeedbackList } from './FeedbackList';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Checkbox } from '@/components/elements/checkbox';
import { Input } from '@/components/elements/input';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';
import { FeedbackCategories } from '@/db/enum';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import type { FeedbackSearchResult, FeedbackSortOption } from '../interface';

const sortSelectItems: SelectItem[] = [
  { value: 'votes', label: '投票数順' },
  { value: 'newest', label: '新着順' },
  { value: 'comments', label: 'コメント数順' },
];

const categoryOptions = [
  { value: '', label: 'すべて' },
  ...Object.values(FeedbackCategories).map((c) => ({
    value: c.value,
    label: c.label,
  })),
];

type FeedbackContentProps = {
  initialResult: FeedbackSearchResult;
};

const buildApiUrl = (params: {
  category: string;
  q: string;
  mine: boolean;
  statuses: string[];
  sort: FeedbackSortOption;
  limit: number;
  offset: number;
}): string => {
  const query = new URLSearchParams();

  if (params.category !== '') {
    query.set('category', params.category);
  }
  if (params.q !== '') {
    query.set('q', params.q);
  }
  if (params.mine) {
    query.set('mine', 'true');
  }
  if (params.statuses.length > 0) {
    query.set('statuses', params.statuses.join(','));
  }
  query.set('sort', params.sort);
  query.set('limit', params.limit.toString());
  query.set('offset', params.offset.toString());

  return `/api/feedback/search?${query.toString()}`;
};

const searchParamsParsers = {
  category: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  mine: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(sortOptions).withDefault('votes'),
  statuses: parseAsArrayOf(parseAsString, ',').withDefault(DEFAULT_STATUSES),
};

export const FeedbackContent = ({ initialResult }: FeedbackContentProps) => {
  const [params, setParams] = useQueryStates(searchParamsParsers);
  const { category, q, mine, sort, statuses } = params;

  const [result, setResult] = useState<FeedbackSearchResult>(initialResult);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debouncedQ = useDebouncedValue(q, 400);
  const loadMoreAbortRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 初回マウント時は SSR の initialResult をそのまま使用
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const abortController = new AbortController();
    setOffset(0);

    const fetchResults = async () => {
      setFetchError(null);
      try {
        const url = buildApiUrl({
          category,
          q: debouncedQ,
          mine,
          statuses,
          sort,
          limit: 20,
          offset: 0,
        });
        const response = await fetch(url, { signal: abortController.signal });
        if (response.ok) {
          const data = (await response.json()) as FeedbackSearchResult;
          setResult(data);
        } else {
          setFetchError('フィードバックの取得に失敗しました');
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setFetchError('フィードバックの取得に失敗しました');
      }
    };

    fetchResults();

    return () => {
      abortController.abort();
      loadMoreAbortRef.current?.abort();
    };
  }, [category, debouncedQ, mine, statuses, sort]);

  const handleSortChange = useCallback(
    (details: SelectValueChangeDetails<SelectItem>) => {
      setParams({ sort: details.value[0] as FeedbackSortOption });
    },
    [setParams],
  );

  const handleLoadMore = useCallback(async () => {
    loadMoreAbortRef.current?.abort();
    const controller = new AbortController();
    loadMoreAbortRef.current = controller;

    const newOffset = offset + 20;
    setIsLoadingMore(true);

    try {
      const url = buildApiUrl({
        category,
        q: debouncedQ,
        mine,
        statuses,
        sort,
        limit: 20,
        offset: newOffset,
      });
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) {
        const data = (await response.json()) as FeedbackSearchResult;
        setResult((prev) => ({
          feedbacks: [...prev.feedbacks, ...data.feedbacks],
          totalCount: data.totalCount,
        }));
        setOffset(newOffset);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFetchError('追加の読み込みに失敗しました');
    } finally {
      setIsLoadingMore(false);
    }
  }, [category, debouncedQ, mine, statuses, sort, offset]);

  const handleReset = useCallback(() => {
    setParams({ category: '', q: '', mine: false });
  }, [setParams]);

  const hasFilters = category !== '' || q !== '' || mine;
  const hasMore = result.feedbacks.length < result.totalCount;

  const isShowAll = ALL_STATUSES.every((s) => statuses.includes(s));

  return (
    <>
      <div className={styles.contentHeader}>
        <div className={styles.categoryChips}>
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={!mine && category === opt.value}
              className={styles.categoryChip({
                isActive: !mine && category === opt.value,
              })}
              onClick={() => setParams({ category: opt.value, mine: false })}
            >
              {opt.label}
            </button>
          ))}
          <div className={styles.chipDivider} />
          <button
            type="button"
            aria-pressed={mine}
            className={styles.categoryChip({ isActive: mine })}
            onClick={() => setParams({ mine: !mine })}
          >
            自分の投稿
          </button>
        </div>

        <Input
          type="search"
          placeholder="フィードバックを検索..."
          aria-label="フィードバックを検索"
          value={q}
          onChange={(e) => setParams({ q: e.target.value })}
        />

        <div className={styles.filterControlRow}>
          <Checkbox
            checked={isShowAll}
            onCheckedChange={(details) =>
              setParams({
                statuses:
                  details.checked === true ? ALL_STATUSES : DEFAULT_STATUSES,
              })
            }
          >
            見送り・統合済みも表示
          </Checkbox>
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

      <div className={styles.resultsArea}>
        {fetchError && (
          <p className={styles.fetchError} role="alert">
            {fetchError}
          </p>
        )}
        <div className={styles.resultCount}>
          {result.totalCount}件のフィードバック
        </div>

        <FeedbackList
          feedbacks={result.feedbacks}
          hasFilters={hasFilters}
          onReset={handleReset}
        />

        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <Button
              variant="outline"
              onClick={handleLoadMore}
              loading={isLoadingMore}
              loadingText="読み込み中..."
              className={styles.loadMoreButton}
            >
              もっと見る
              <CaretDown size={18} className={styles.loadMoreIcon} />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

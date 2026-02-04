'use client';

import { useCallback, useMemo, useRef, useTransition } from 'react';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';

// フィルターパーサー定義
export const filterParsers = {
  systems: parseAsArrayOf(parseAsString, ',').withDefault([]),
  tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
  minPlayer: parseAsInteger,
  maxPlayer: parseAsInteger,
  duration: parseAsString, // '~1h' | '1~3h' | '3~6h' | '6h~'
  q: parseAsString.withDefault(''),
};

export type FilterParams = {
  systems: string[];
  tags: string[];
  minPlayer: number | null;
  maxPlayer: number | null;
  duration: string | null;
  q: string;
};

/**
 * フィルター状態管理フック
 * - URLクエリパラメータと同期
 * - 即時適用（チップ選択）とdebounce適用（スライダー、キーワード）をサポート
 */
export const useFilterState = () => {
  const [isPending, startTransition] = useTransition();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [params, setParams] = useQueryStates(filterParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  });

  // 即時適用（チップ選択など）
  const applyFilter = useCallback(
    <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
      setParams({ [key]: value });
    },
    [setParams],
  );

  // debounce適用（スライダー、キーワード検索）
  const applyFilterDebounced = useCallback(
    <K extends keyof FilterParams>(
      key: K,
      value: FilterParams[K],
      delay = 300,
    ) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setParams({ [key]: value });
      }, delay);
    },
    [setParams],
  );

  // システム選択の切り替え
  const toggleSystem = useCallback(
    (systemId: string) => {
      const newSystems = params.systems.includes(systemId)
        ? params.systems.filter((s) => s !== systemId)
        : [...params.systems, systemId];
      applyFilter('systems', newSystems);
    },
    [params.systems, applyFilter],
  );

  // タグ選択の切り替え
  const toggleTag = useCallback(
    (tagId: string) => {
      const newTags = params.tags.includes(tagId)
        ? params.tags.filter((t) => t !== tagId)
        : [...params.tags, tagId];
      applyFilter('tags', newTags);
    },
    [params.tags, applyFilter],
  );

  // プレイ人数の変更（debounce）
  const setPlayerRange = useCallback(
    (min: number, max: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setParams({ minPlayer: min, maxPlayer: max });
      }, 300);
    },
    [setParams],
  );

  // プレイ時間の選択
  const setDuration = useCallback(
    (duration: string | null) => {
      applyFilter('duration', duration);
    },
    [applyFilter],
  );

  // キーワード検索（debounce）
  const setKeyword = useCallback(
    (keyword: string) => {
      applyFilterDebounced('q', keyword, 300);
    },
    [applyFilterDebounced],
  );

  // 全フィルタークリア
  const clearAll = useCallback(() => {
    setParams({
      systems: [],
      tags: [],
      minPlayer: null,
      maxPlayer: null,
      duration: null,
      q: '',
    });
  }, [setParams]);

  // アクティブなフィルター数
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (params.systems.length > 0) count += params.systems.length;
    if (params.tags.length > 0) count += params.tags.length;
    if (params.minPlayer !== null || params.maxPlayer !== null) count += 1;
    if (params.duration !== null) count += 1;
    return count;
  }, [params]);

  return {
    params,
    isPending,
    activeFilterCount,
    // 即時適用
    toggleSystem,
    toggleTag,
    setDuration,
    // debounce適用
    setPlayerRange,
    setKeyword,
    // その他
    applyFilter,
    clearAll,
  };
};

export type UseFilterStateReturn = ReturnType<typeof useFilterState>;

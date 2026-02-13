'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useQueryStates } from 'nuqs';

import {
  type FilterParams,
  filterParsers,
} from '@/app/(main)/scenarios/searchParams';

const DEFAULT_FILTER: FilterParams = {
  systems: [],
  tags: [],
  minPlayer: null,
  maxPlayer: null,
  minPlaytime: null,
  maxPlaytime: null,
  q: '',
};

/**
 * ドラフト式フィルター状態管理フック
 * - ユーザー操作はドラフト（ローカル state）に即座に反映
 * - 「検索」ボタンで commit() → URL に一括反映 → API 呼び出しトリガー
 * - ブラウザ戻る/進むで URL が変わった場合、ドラフトも同期
 */
export const useFilterDraft = () => {
  const [isPending, startTransition] = useTransition();

  // 確定状態（URL と同期）
  const [committed, setCommitted] = useQueryStates(filterParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  });

  // ドラフト状態（ローカルのみ）
  const [draft, setDraft] = useState<FilterParams>({
    systems: committed.systems,
    tags: committed.tags,
    minPlayer: committed.minPlayer,
    maxPlayer: committed.maxPlayer,
    minPlaytime: committed.minPlaytime,
    maxPlaytime: committed.maxPlaytime,
    q: committed.q,
  });

  // URL 変更時にドラフトを同期（ブラウザ戻る/進む対応）
  useEffect(() => {
    setDraft({
      systems: committed.systems,
      tags: committed.tags,
      minPlayer: committed.minPlayer,
      maxPlayer: committed.maxPlayer,
      minPlaytime: committed.minPlaytime,
      maxPlaytime: committed.maxPlaytime,
      q: committed.q,
    });
  }, [
    committed.systems,
    committed.tags,
    committed.minPlayer,
    committed.maxPlayer,
    committed.minPlaytime,
    committed.maxPlaytime,
    committed.q,
  ]);

  // --- ドラフト操作（ローカルのみ） ---

  const toggleSystem = useCallback((systemId: string) => {
    setDraft((prev) => ({
      ...prev,
      systems: prev.systems.includes(systemId)
        ? prev.systems.filter((s) => s !== systemId)
        : [...prev.systems, systemId],
    }));
  }, []);

  const setSystems = useCallback((newSystems: string[]) => {
    setDraft((prev) => ({ ...prev, systems: newSystems }));
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  }, []);

  const setPlayerRange = useCallback(
    (min: number | null, max: number | null) => {
      setDraft((prev) => ({ ...prev, minPlayer: min, maxPlayer: max }));
    },
    [],
  );

  const setPlaytimeRange = useCallback(
    (min: number | null, max: number | null) => {
      setDraft((prev) => ({ ...prev, minPlaytime: min, maxPlaytime: max }));
    },
    [],
  );

  const setKeyword = useCallback((q: string) => {
    setDraft((prev) => ({ ...prev, q }));
  }, []);

  const clearAll = useCallback(() => {
    setDraft({ ...DEFAULT_FILTER });
  }, []);

  // --- 確定操作 ---

  const commit = useCallback(() => {
    setCommitted({
      systems: draft.systems,
      tags: draft.tags,
      minPlayer: draft.minPlayer,
      maxPlayer: draft.maxPlayer,
      minPlaytime: draft.minPlaytime,
      maxPlaytime: draft.maxPlaytime,
      q: draft.q,
    });
  }, [draft, setCommitted]);

  // --- 算出値 ---

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (draft.systems.length > 0) count += draft.systems.length;
    if (draft.tags.length > 0) count += draft.tags.length;
    if (draft.minPlayer !== null || draft.maxPlayer !== null) count += 1;
    if (draft.minPlaytime !== null || draft.maxPlaytime !== null) count += 1;
    return count;
  }, [draft]);

  const isDirty = useMemo(() => {
    return (
      JSON.stringify([...draft.systems].sort()) !==
        JSON.stringify([...committed.systems].sort()) ||
      JSON.stringify([...draft.tags].sort()) !==
        JSON.stringify([...committed.tags].sort()) ||
      draft.minPlayer !== committed.minPlayer ||
      draft.maxPlayer !== committed.maxPlayer ||
      draft.minPlaytime !== committed.minPlaytime ||
      draft.maxPlaytime !== committed.maxPlaytime ||
      draft.q !== committed.q
    );
  }, [draft, committed]);

  return {
    // FilterPanel 互換インターフェース
    mode: 'draft' as const,
    params: draft,
    isPending,
    activeFilterCount,
    toggleSystem,
    setSystems,
    toggleTag,
    setPlayerRange,
    setPlaytimeRange,
    setKeyword,
    clearAll,
    // ドラフト固有
    draft,
    committed,
    commit,
    isDirty,
  };
};

export type UseFilterDraftReturn = ReturnType<typeof useFilterDraft>;

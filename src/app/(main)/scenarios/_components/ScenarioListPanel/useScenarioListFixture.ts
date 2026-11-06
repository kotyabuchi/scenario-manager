import { useState } from 'react';
import { useQueryStates } from 'nuqs';

import { filterParsers } from '../../searchParams';

import { useFilterDraft } from '@/components/blocks/FilterPanel';

import type { ScenarioWithRelations, SortOption } from '../../interface';

const PAGE_SIZE = 3;

/** Storybook内だけで検索・並び替え・ページ追加を再現する。APIの代用にはしない。 */
export const useScenarioListFixture = (
  items: ScenarioWithRelations[],
  paginated = false,
) => {
  const draftState = useFilterDraft();
  const [, setParams] = useQueryStates(filterParsers);
  const [sort, setSort] = useState<SortOption>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const params = draftState.committed;
  const list = items
    .filter(
      (scenario) =>
        (!params.q ||
          scenario.name
            .toLocaleLowerCase()
            .includes(params.q.toLocaleLowerCase())) &&
        (params.systems.length === 0 ||
          params.systems.includes(scenario.system.systemId)) &&
        params.tags.every((id) =>
          scenario.tags?.some((tag) => tag.tagId === id),
        ) &&
        (params.minPlayer === null ||
          (scenario.maxPlayer ?? Infinity) >= params.minPlayer) &&
        (params.maxPlayer === null ||
          (scenario.minPlayer ?? 0) <= params.maxPlayer) &&
        (params.minPlaytime === null ||
          (scenario.maxPlaytime ?? Infinity) >= params.minPlaytime * 60) &&
        (params.maxPlaytime === null ||
          (scenario.minPlaytime ?? 0) <= params.maxPlaytime * 60),
    )
    .sort((left, right) => {
      if (sort === 'playtime_asc')
        return (left.minPlaytime ?? 0) - (right.minPlaytime ?? 0);
      if (sort === 'playtime_desc')
        return (right.maxPlaytime ?? 0) - (left.maxPlaytime ?? 0);
      const dateOrder = (left.createdAt ?? '').localeCompare(
        right.createdAt ?? '',
      );
      return sort === 'oldest' ? dateOrder : -dateOrder;
    });

  return {
    draftState,
    scenarios: paginated ? list.slice(0, visibleCount) : list,
    totalCount: list.length,
    sort,
    onSortChange: setSort,
    hasMore: paginated && visibleCount < list.length,
    onLoadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
    onResetFilters: () => {
      draftState.clearAll();
      setParams(null);
    },
  };
};

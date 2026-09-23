'use client';

import { Collapsible } from '@ark-ui/react/collapsible';
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import { FilterPanel } from '@/components/blocks/FilterPanel';
import { Button } from '@/components/elements/button/button';

import type {
  SystemItem,
  TagItem,
  UseFilterDraftReturn,
} from '@/components/blocks/FilterPanel';

export type ScenarioFiltersProps = {
  systems: SystemItem[];
  tags: TagItem[];
  draftState: UseFilterDraftReturn;
  /** 詳細フィルターの初期展開状態 @default false */
  defaultExpanded?: boolean;
};

/**
 * ScenarioFilters - 一覧ペイン上部のインライン検索フィルター
 *
 * 基本行（フリーワード）を常時表示し、詳細フィルター（システム/タグ/人数/
 * プレイ時間）を Ark UI Collapsible として「詳細フィルター」見出しで開閉する。
 * 旧 SearchSidebar / SearchTopBar のインライン置き換え（第一イテレーション）。
 */
export const ScenarioFilters = ({
  systems,
  tags,
  draftState,
  defaultExpanded = false,
}: ScenarioFiltersProps) => {
  const { params, setKeyword, commit, clearAll, activeFilterCount } =
    draftState;

  return (
    <section className={styles.panel} aria-label="シナリオ検索フィルター">
      {/* 基本行: フリーワード */}
      <div className={styles.basicRow}>
        <div className={styles.keywordWrap}>
          <MagnifyingGlass className={styles.keywordIcon} />
          <input
            type="search"
            className={styles.keywordInput}
            placeholder="シナリオ名"
            value={params.q}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="フリーワード検索"
          />
        </div>
      </div>

      {/* 詳細フィルター（Ark UI Collapsible） */}
      <Collapsible.Root
        defaultOpen={defaultExpanded}
        className={styles.collapsible}
      >
        <Collapsible.Trigger className={styles.collapsibleHeader}>
          <span className={styles.collapsibleTitleGroup}>
            詳細フィルター
            {activeFilterCount > 0 && (
              <span className={styles.toggleBadge}>{activeFilterCount}</span>
            )}
          </span>
          <Collapsible.Indicator className={styles.indicator}>
            <CaretDown size={14} />
          </Collapsible.Indicator>
        </Collapsible.Trigger>

        <Collapsible.Content className={styles.detail}>
          <FilterPanel
            variant="sidebar"
            systems={systems}
            tags={tags}
            filterState={draftState}
            showClear={false}
          />
        </Collapsible.Content>
      </Collapsible.Root>

      {/* フッター: クリア + 検索 */}
      <div className={styles.footer}>
        {(activeFilterCount > 0 || params.q !== '') && (
          <Button type="button" variant="ghost" onClick={clearAll}>
            フィルターをクリア
          </Button>
        )}
        <Button type="button" status="primary" onClick={() => commit()}>
          <MagnifyingGlass size={16} />
          この条件で検索
        </Button>
      </div>
    </section>
  );
};

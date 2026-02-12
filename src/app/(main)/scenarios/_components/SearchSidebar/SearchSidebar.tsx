'use client';

import { useEffect, useRef } from 'react';
import { MagnifyingGlass, SidebarSimple } from '@phosphor-icons/react/ssr';

import { fullWidthButton } from '../styles';
import * as styles from './styles';

import { FilterPanel } from '@/components/blocks/FilterPanel';
import { Button } from '@/components/elements/button/button';

import type { SystemItem, TagItem } from '@/components/blocks/FilterPanel';
import type { UseFilterDraftReturn } from '@/components/blocks/FilterPanel/useFilterDraft';

type SearchSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  systems: SystemItem[];
  tags: TagItem[];
  draftState: UseFilterDraftReturn;
};

export const SearchSidebar = ({
  isCollapsed,
  onToggleCollapse,
  systems,
  tags,
  draftState,
}: SearchSidebarProps) => {
  const { activeFilterCount, commit } = draftState;
  const toggleRef = useRef<HTMLButtonElement>(null);

  // 折りたたみ時にトグルボタンにフォーカスを移動
  useEffect(() => {
    if (isCollapsed) {
      toggleRef.current?.focus();
    }
  }, [isCollapsed]);

  const handleSearch = () => {
    commit();
  };

  return (
    <aside className={styles.sidebar({ collapsed: isCollapsed })}>
      {isCollapsed ? (
        <>
          {/* 折りたたみ時: トグルボタン + バッジ */}
          <button
            ref={toggleRef}
            type="button"
            onClick={onToggleCollapse}
            className={styles.sidebarToggle}
            aria-label="フィルターを展開"
            aria-expanded={false}
          >
            <SidebarSimple size={18} />
          </button>
          {activeFilterCount > 0 && (
            <span className={styles.sidebarCollapsedBadge}>
              {activeFilterCount}
            </span>
          )}
        </>
      ) : (
        <>
          {/* 展開時: トグル（上部） + FilterPanel（スクロール可） + 検索ボタン */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles.sidebarToggle}
            aria-label="フィルターを閉じる"
            aria-expanded={true}
          >
            <SidebarSimple size={16} />
            閉じる
          </button>

          <div className={styles.sidebarContent({ visible: !isCollapsed })}>
            <FilterPanel
              variant="sidebar"
              systems={systems}
              tags={tags}
              filterState={draftState}
              showSystems={false}
            />
          </div>

          <div className={styles.sidebarSearchButton}>
            <Button
              type="button"
              status="primary"
              onClick={handleSearch}
              className={fullWidthButton}
            >
              <MagnifyingGlass size={16} />
              検索
            </Button>
          </div>
        </>
      )}
    </aside>
  );
};

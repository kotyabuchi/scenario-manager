'use client';

import { useCallback, useEffect } from 'react';
import {
  ArrowCounterClockwise,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import { FilterPanel } from '@/components/blocks/FilterPanel';
import { Button } from '@/components/elements/button/button';

import type {
  FilterStateBase,
  SystemItem,
  TagItem,
} from '@/components/blocks/FilterPanel';

type FilterBottomSheetProps = {
  /** 表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 利用可能なシステム一覧 */
  systems: SystemItem[];
  /** 利用可能なタグ一覧 */
  tags: TagItem[];
  /** フィルター状態 */
  filterState: FilterStateBase;
};

/**
 * モバイル用フィルターボトムシート
 * FilterPanelをラップしてボトムシート表示
 */
export const FilterBottomSheet = ({
  isOpen,
  onClose,
  systems,
  tags,
  filterState,
}: FilterBottomSheetProps) => {
  const { clearAll } = filterState;

  // Escapeキーで閉じる
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 開いている間はbodyスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 条件をリセット（ドラフトのみクリア）
  const handleClear = () => {
    clearAll();
  };

  // この条件で検索（commit＋閉じる）
  const handleApply = () => {
    filterState.commit?.();
    onClose();
  };

  return (
    <>
      {/* オーバーレイ */}
      <button
        type="button"
        className={styles.overlay({ visible: isOpen })}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label="フィルターを閉じる"
      />

      {/* ボトムシート */}
      <div
        className={styles.container({ visible: isOpen })}
        role="dialog"
        aria-modal="true"
        aria-label="フィルター"
      >
        {/* ハンドルバー */}
        <div className={styles.handle}>
          <div className={styles.handleBar} />
        </div>

        {/* ヘッダー */}
        <div className={styles.header}>
          <h2 className={styles.title}>フィルター</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className={styles.content}>
          <FilterPanel
            variant="bottomsheet"
            systems={systems}
            tags={tags}
            filterState={filterState}
            showSystems={false}
          />
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <Button
              type="button"
              variant="ghost"
              status="primary"
              onClick={handleClear}
            >
              <ArrowCounterClockwise size={16} />
              条件をリセット
            </Button>
          </div>

          <Button
            type="button"
            status="primary"
            onClick={handleApply}
            className={styles.fullWidthButton}
          >
            <MagnifyingGlass size={16} />
            この条件で検索
          </Button>
        </div>
      </div>
    </>
  );
};

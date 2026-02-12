'use client';

import { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

type FilterSectionProps = {
  label: string;
  children: React.ReactNode;
  /** 「すべて表示」機能を有効にする場合のアイテム総数 */
  totalCount?: number;
  /** 初期表示するアイテム数（デフォルト: 5） */
  initialShowCount?: number;
};

/**
 * フィルターセクションコンポーネント
 * ラベルと子要素を表示し、オプションで「すべて表示」機能を提供
 */
export const FilterSection = ({
  label,
  children,
  totalCount,
  initialShowCount = 5,
}: FilterSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = totalCount !== undefined && totalCount > initialShowCount;

  return (
    <div className={styles.filterSection}>
      <span className={styles.filterSection_label}>{label}</span>
      <div className={styles.filterSection_content}>
        {children}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.showAllButton}
          >
            {isExpanded ? (
              <>
                <CaretUp size={12} />
                閉じる
              </>
            ) : (
              <>
                <CaretDown size={12} />+{totalCount - initialShowCount}件
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

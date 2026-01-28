'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import * as styles from './styles';

export type PaginationProps = {
  /**
   * 現在のページ番号
   */
  page: number;

  /**
   * 総ページ数
   */
  totalPages: number;

  /**
   * ページ変更時のコールバック
   */
  onPageChange: (page: number) => void;

  /**
   * 現在のページの前後に表示するページ数
   * @default 1
   */
  siblingCount?: number;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * ページ番号の配列を生成する
 */
const getPageNumbers = (
  page: number,
  totalPages: number,
  siblingCount: number,
): (number | 'ellipsis')[] => {
  const pages: (number | 'ellipsis')[] = [];

  // 常に最初のページを表示
  pages.push(1);

  // 左側の省略記号
  if (page - siblingCount > 2) {
    pages.push('ellipsis');
  }

  // 現在のページの前後
  for (
    let i = Math.max(2, page - siblingCount);
    i <= Math.min(totalPages - 1, page + siblingCount);
    i++
  ) {
    pages.push(i);
  }

  // 右側の省略記号
  if (page + siblingCount < totalPages - 1) {
    pages.push('ellipsis');
  }

  // 常に最後のページを表示
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

/**
 * ページネーションコンポーネント
 *
 * ページ間のナビゲーションを提供する。
 *
 * @example
 * const [page, setPage] = useState(1);
 *
 * <Pagination
 *   page={page}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 */
export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) => {
  const pages = getPageNumbers(page, totalPages, siblingCount);

  return (
    <nav aria-label="ページネーション" className={className}>
      <div className={styles.paginationRoot}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="前のページ"
          className={styles.paginationButton({ variant: 'nav' })}
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, index) =>
          p === 'ellipsis' ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: ellipsisは同値が複数存在するためindexで区別
              key={`ellipsis-${index}`}
              className={styles.paginationEllipsis}
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`ページ ${p}`}
              className={styles.paginationButton({
                variant: p === page ? 'active' : 'page',
              })}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="次のページ"
          className={styles.paginationButton({ variant: 'nav' })}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

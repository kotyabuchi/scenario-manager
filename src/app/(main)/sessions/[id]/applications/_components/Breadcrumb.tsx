import { CaretRight, House } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from '../styles';

import type { Route } from 'next';

type BreadcrumbProps = {
  sessionId: string;
  sessionName: string;
};

/**
 * パンくずナビゲーション（Server Component）
 * ホーム > マイセッション > セッション名 > 参加申請一覧
 */
export const Breadcrumb = ({ sessionId, sessionName }: BreadcrumbProps) => {
  return (
    <nav aria-label="パンくずナビゲーション" className={styles.breadcrumb_nav}>
      <ol className={styles.breadcrumb_list}>
        <li className={styles.breadcrumb_item}>
          <Link href={'/' as Route} className={styles.breadcrumb_link}>
            <House size={16} aria-hidden="true" />
            ホーム
          </Link>
        </li>
        <li aria-hidden="true" className={styles.breadcrumb_separator}>
          <CaretRight size={14} />
        </li>
        <li className={styles.breadcrumb_item}>
          <Link href={'/sessions' as Route} className={styles.breadcrumb_link}>
            マイセッション
          </Link>
        </li>
        <li aria-hidden="true" className={styles.breadcrumb_separator}>
          <CaretRight size={14} />
        </li>
        <li className={styles.breadcrumb_item}>
          <Link
            href={`/sessions/${sessionId}` as Route}
            className={styles.breadcrumb_link}
          >
            {sessionName}
          </Link>
        </li>
        <li aria-hidden="true" className={styles.breadcrumb_separator}>
          <CaretRight size={14} />
        </li>
        <li className={styles.breadcrumb_item}>
          <span aria-current="page" className={styles.breadcrumb_current}>
            参加申請一覧
          </span>
        </li>
      </ol>
    </nav>
  );
};

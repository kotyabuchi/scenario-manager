'use client';

import { Calendar, Plus, Search } from 'lucide-react';
import Link from 'next/link';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

type EmptyStateProps = {
  type: 'upcoming' | 'history' | 'public';
  onReset?: () => void;
};

export const EmptyState = ({ type, onReset }: EmptyStateProps) => {
  if (type === 'upcoming') {
    return (
      <div className={styles.sessionListEmpty}>
        <Calendar className={styles.sessionListEmptyIcon} />
        <p className={styles.sessionListEmptyText}>
          参加予定のセッションはありません
        </p>
        <p className={styles.sessionListEmptySubtext}>
          公開卓を探してみませんか？
        </p>
        <div className={styles.sessionListEmptyActions}>
          <Link href="/sessions?tab=public">
            <Button variant="subtle">
              <Search size={16} />
              公開卓を探す
            </Button>
          </Link>
          <Link href="/sessions/new">
            <Button status="primary">
              <Plus size={16} />
              セッションを作成する
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div className={styles.sessionListEmpty}>
        <Calendar className={styles.sessionListEmptyIcon} />
        <p className={styles.sessionListEmptyText}>参加履歴はまだありません</p>
        <p className={styles.sessionListEmptySubtext}>
          セッションに参加して思い出を作りましょう!
        </p>
        <div className={styles.sessionListEmptyActions}>
          <Link href="/sessions?tab=public">
            <Button variant="subtle">
              <Search size={16} />
              公開卓を探す
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionListEmpty}>
      <Search className={styles.sessionListEmptyIcon} />
      <p className={styles.sessionListEmptyText}>
        条件に一致するセッションが見つかりませんでした
      </p>
      <p className={styles.sessionListEmptySubtext}>
        条件を変えて、もう一度探してみませんか？
      </p>
      <div className={styles.sessionListEmptyActions}>
        {onReset && (
          <Button variant="subtle" onClick={onReset}>
            条件をリセット
          </Button>
        )}
        <Link href="/sessions/new">
          <Button status="primary">
            <Plus size={16} />
            セッションを作成する
          </Button>
        </Link>
      </div>
    </div>
  );
};

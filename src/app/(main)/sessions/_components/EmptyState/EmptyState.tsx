'use client';

import {
  CalendarX,
  ClockCounterClockwise,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  Plus,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

type EmptyStateProps = {
  type: 'upcoming' | 'history' | 'public';
  onReset?: () => void;
};

export const EmptyState = ({ type }: EmptyStateProps) => {
  if (type === 'upcoming') {
    return (
      <div className={styles.emptyState}>
        <CalendarX className={styles.emptyState_icon} />
        <p className={styles.emptyState_title}>
          参加予定のセッションはありません
        </p>
        <p className={styles.emptyState_subtitle}>
          公開卓を探して参加してみましょう
        </p>
        <Link href="/sessions?tab=public">
          <Button status="primary">
            <MagnifyingGlass size={16} />
            公開卓を探す
          </Button>
        </Link>
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div className={styles.emptyState}>
        <ClockCounterClockwise className={styles.emptyState_icon} />
        <p className={styles.emptyState_title}>参加履歴はまだありません</p>
        <p className={styles.emptyState_subtitle}>
          セッションに参加すると、ここに履歴が表示されます
        </p>
        <Link href="/sessions?tab=public">
          <Button status="primary">
            <MagnifyingGlass size={16} />
            公開卓を探す
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.emptyState}>
      <MagnifyingGlassMinus className={styles.emptyState_icon} />
      <p className={styles.emptyState_title}>
        条件に一致するセッションが見つかりませんでした
      </p>
      <p className={styles.emptyState_subtitle}>
        検索条件を変更するか、新しいセッションを作成してみましょう
      </p>
      <Link href="/sessions/new">
        <Button status="primary">
          <Plus size={16} />
          セッションを作成する
        </Button>
      </Link>
    </div>
  );
};

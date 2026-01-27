'use client';

import { CalendarX, History, Plus, Search, SearchX } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/elements/button/button';
import { css } from '@/styled-system/css';

type EmptyStateProps = {
  type: 'upcoming' | 'history' | 'public';
  onReset?: () => void;
};

const emptyContainer = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  flex: 1,
  minH: '400px',
});

const emptyIcon = css({
  w: '48px',
  h: '48px',
  color: '#D1D5DB',
});

const emptyTitle = css({
  fontSize: '16px',
  fontWeight: 'normal',
  color: 'text.muted',
});

const emptySubtitle = css({
  fontSize: '13px',
  color: '#9CA3AF',
});

export const EmptyState = ({ type }: EmptyStateProps) => {
  if (type === 'upcoming') {
    return (
      <div className={emptyContainer}>
        <CalendarX className={emptyIcon} />
        <p className={emptyTitle}>参加予定のセッションはありません</p>
        <p className={emptySubtitle}>公開卓を探して参加してみましょう</p>
        <Link href="/sessions?tab=public">
          <Button status="primary">
            <Search size={16} />
            公開卓を探す
          </Button>
        </Link>
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div className={emptyContainer}>
        <History className={emptyIcon} />
        <p className={emptyTitle}>参加履歴はまだありません</p>
        <p className={emptySubtitle}>
          セッションに参加すると、ここに履歴が表示されます
        </p>
        <Link href="/sessions?tab=public">
          <Button status="primary">
            <Search size={16} />
            公開卓を探す
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={emptyContainer}>
      <SearchX className={emptyIcon} />
      <p className={emptyTitle}>
        条件に一致するセッションが見つかりませんでした
      </p>
      <p className={emptySubtitle}>
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

'use client';

import { useTransition } from 'react';

import * as styles from './styles';

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: () => Promise<void>;
};

export const FavoriteButton = ({
  isFavorite,
  onToggle,
}: FavoriteButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await onToggle();
    });
  };

  return (
    <div className={styles.fab}>
      <button
        type="button"
        className={styles.fabButton({ active: isFavorite })}
        onClick={handleClick}
        disabled={isPending}
        aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
        title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
      >
        {isPending ? (
          <span style={{ fontSize: '24px' }}>⏳</span>
        ) : isFavorite ? (
          <span style={{ fontSize: '24px' }}>★</span>
        ) : (
          <span style={{ fontSize: '24px' }}>☆</span>
        )}
      </button>
    </div>
  );
};

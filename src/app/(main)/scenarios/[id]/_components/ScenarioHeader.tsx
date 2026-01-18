'use client';

import { useOptimistic, useTransition } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { isNil } from 'ramda';

import { css } from '@/styled-system/css';

type ScenarioHeaderProps = {
  scenarioName: string;
  currentUserId?: string;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<void>;
};

const header = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  mb: 'lg',
});

const header_backButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'text.secondary',
  fontSize: 'xl',
  cursor: 'pointer',
  transition: 'all 0.2s',
  flexShrink: 0,
  _hover: {
    bg: 'bg.subtle',
    color: 'text.primary',
  },
});

const header_title = css({
  flex: 1,
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'text.primary',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const header_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  flexShrink: 0,
});

const favoriteButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: 'full',
  bg: 'transparent',
  fontSize: 'xl',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: 'none',
  _hover: {
    bg: 'bg.subtle',
  },
});

const favoriteButton_active = css({
  color: 'primary.500',
});

const favoriteButton_inactive = css({
  color: 'text.muted',
});

export const ScenarioHeader = ({
  scenarioName,
  currentUserId,
  isFavorite,
  onToggleFavorite,
}: ScenarioHeaderProps) => {
  const isLoggedIn = !isNil(currentUserId);
  const [, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  const handleFavoriteClick = () => {
    setOptimisticFavorite(!optimisticFavorite);
    startTransition(async () => {
      await onToggleFavorite();
    });
  };

  return (
    <header className={header}>
      <Link
        href="/scenarios"
        className={header_backButton}
        aria-label="シナリオ一覧に戻る"
      >
        <ArrowLeft size={20} />
      </Link>

      <h1 className={header_title}>{scenarioName}</h1>

      {isLoggedIn && (
        <div className={header_actions}>
          <button
            type="button"
            className={`${favoriteButton} ${optimisticFavorite ? favoriteButton_active : favoriteButton_inactive}`}
            onClick={handleFavoriteClick}
            aria-label={
              optimisticFavorite ? 'お気に入りから削除' : 'お気に入りに追加'
            }
          >
            <Star
              size={20}
              fill={optimisticFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      )}
    </header>
  );
};

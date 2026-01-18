'use client';

import Link from 'next/link';
import { isNil } from 'ramda';

import { ActionMenu } from './ActionMenu';

import { css } from '@/styled-system/css';

type ScenarioHeaderProps = {
  scenarioId: string;
  scenarioName: string;
  currentUserId?: string;
  createdById?: string | null;
  isFavorite: boolean;
  isPlayed: boolean;
  onToggleFavorite: () => Promise<void>;
  onTogglePlayed: () => Promise<void>;
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
  scenarioId,
  scenarioName,
  currentUserId,
  createdById,
  isFavorite,
  isPlayed,
  onToggleFavorite,
  onTogglePlayed,
}: ScenarioHeaderProps) => {
  const isLoggedIn = !isNil(currentUserId);
  const canEdit = isLoggedIn && currentUserId === createdById;

  return (
    <header className={header}>
      <Link
        href="/scenarios"
        className={header_backButton}
        aria-label="シナリオ一覧に戻る"
      >
        ←
      </Link>

      <h1 className={header_title}>{scenarioName}</h1>

      {isLoggedIn && (
        <div className={header_actions}>
          <button
            type="button"
            className={`${favoriteButton} ${isFavorite ? favoriteButton_active : favoriteButton_inactive}`}
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            {isFavorite ? '★' : '☆'}
          </button>

          <ActionMenu
            scenarioId={scenarioId}
            isPlayed={isPlayed}
            canEdit={canEdit}
            onTogglePlayed={onTogglePlayed}
          />
        </div>
      )}
    </header>
  );
};

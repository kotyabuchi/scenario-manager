'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';

import { css } from '@/styled-system/css';

import type { Route } from 'next';

type ScenarioFABProps = {
  scenarioId: string;
  isFavorite: boolean;
  isPlayed: boolean;
  canEdit: boolean;
  onToggleFavorite: () => Promise<void>;
  onTogglePlayed: () => Promise<void>;
};

const fabContainer = css({
  position: 'fixed',
  bottom: 'xl',
  right: 'xl',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 'sm',
  zIndex: 50,
});

const fabButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '56px',
  height: '56px',
  borderRadius: 'full',
  cursor: 'pointer',
  transition: 'all 0.2s',
  shadow: 'lg',
  border: 'none',
  _hover: {
    transform: 'scale(1.1)',
  },
});

const fabButton_favorite = css({
  bg: 'bg.card',
  color: 'text.secondary',
  _hover: {
    color: 'primary.500',
  },
});

const fabButton_favoriteActive = css({
  bg: 'primary.500',
  color: 'white',
});

const fabButton_menu = css({
  bg: 'bg.card',
  color: 'text.secondary',
  _hover: {
    color: 'text.primary',
  },
});

const menuDropdown = css({
  position: 'absolute',
  bottom: '100%',
  right: 0,
  mb: 'sm',
  minW: '180px',
  bg: 'bg.card',
  borderRadius: 'lg',
  shadow: 'lg',
  overflow: 'hidden',
  zIndex: 100,
});

const menuItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  width: '100%',
  px: 'md',
  py: 'sm',
  bg: 'transparent',
  color: 'text.primary',
  fontSize: 'sm',
  textAlign: 'left',
  cursor: 'pointer',
  border: 'none',
  transition: 'background 0.2s',
  _hover: {
    bg: 'bg.subtle',
  },
});

const menuLink = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'sm',
  width: '100%',
  px: 'md',
  py: 'sm',
  color: 'text.primary',
  fontSize: 'sm',
  textDecoration: 'none',
  transition: 'background 0.2s',
  _hover: {
    bg: 'bg.subtle',
  },
});

const checkMark = css({
  color: 'primary.600',
});

export const ScenarioFAB = ({
  scenarioId,
  isFavorite,
  isPlayed,
  canEdit,
  onToggleFavorite,
  onTogglePlayed,
}: ScenarioFABProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // クリック外で閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleFavoriteClick = () => {
    startTransition(async () => {
      await onToggleFavorite();
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setIsMenuOpen(false);
    // TODO: トースト通知を表示
  };

  const handleTogglePlayed = async () => {
    await onTogglePlayed();
    setIsMenuOpen(false);
  };

  return (
    <div className={fabContainer}>
      {/* メニューボタン */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className={`${fabButton} ${fabButton_menu}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
        >
          <span style={{ fontSize: '24px' }}>⋮</span>
        </button>

        {isMenuOpen && (
          <div className={menuDropdown} role="menu">
            <Link
              href={`/sessions/new?scenarioId=${scenarioId}` as '/sessions/new'}
              className={menuLink}
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              <span>📅</span>
              <span>セッション作成</span>
            </Link>

            <button
              type="button"
              className={menuItem}
              role="menuitem"
              onClick={handleTogglePlayed}
            >
              <span>{isPlayed ? '✓' : '○'}</span>
              <span>プレイ済み登録</span>
              {isPlayed && <span className={checkMark}>✓</span>}
            </button>

            {canEdit && (
              <Link
                href={`/scenarios/${scenarioId}/edit` as Route}
                className={menuLink}
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>✏️</span>
                <span>シナリオ編集</span>
              </Link>
            )}

            <button
              type="button"
              className={menuItem}
              role="menuitem"
              onClick={handleShare}
            >
              <span>🔗</span>
              <span>シェア</span>
            </button>
          </div>
        )}
      </div>

      {/* お気に入りボタン */}
      <button
        type="button"
        className={`${fabButton} ${isFavorite ? fabButton_favoriteActive : fabButton_favorite}`}
        onClick={handleFavoriteClick}
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

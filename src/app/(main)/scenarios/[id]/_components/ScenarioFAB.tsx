'use client';

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import Link from 'next/link';

import { css } from '@/styled-system/css';

import type { Route } from 'next';

type ScenarioFABProps = {
  scenarioId: string;
  isPlayed: boolean;
  canEdit: boolean;
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
  isPlayed,
  canEdit,
  onTogglePlayed,
}: ScenarioFABProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [optimisticPlayed, setOptimisticPlayed] = useOptimistic(isPlayed);

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

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setIsMenuOpen(false);
    // TODO: トースト通知を表示
  };

  const handleTogglePlayed = () => {
    setOptimisticPlayed(!optimisticPlayed);
    setIsMenuOpen(false);
    startTransition(async () => {
      await onTogglePlayed();
    });
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
              <span>{optimisticPlayed ? '✓' : '○'}</span>
              <span>プレイ済み登録</span>
              {optimisticPlayed && <span className={checkMark}>✓</span>}
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
    </div>
  );
};

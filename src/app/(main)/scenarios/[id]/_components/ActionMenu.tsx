'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { css } from '@/styled-system/css';

type ActionMenuProps = {
  scenarioId: string;
  isPlayed: boolean;
  canEdit: boolean;
  onTogglePlayed: () => Promise<void>;
};

const menuContainer = css({
  position: 'relative',
});

const menuButton = css({
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
  border: 'none',
  _hover: {
    bg: 'bg.subtle',
    color: 'text.primary',
  },
});

const menuDropdown = css({
  position: 'absolute',
  top: 'auto',
  bottom: '100%',
  right: 0,
  mb: 'xs',
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

export const ActionMenu = ({
  scenarioId,
  isPlayed,
  canEdit,
  onTogglePlayed,
}: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // クリック外で閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setIsOpen(false);
    // TODO: トースト通知を表示
  };

  const handleTogglePlayed = async () => {
    await onTogglePlayed();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={menuContainer}>
      <button
        type="button"
        className={menuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        ⋮
      </button>

      {isOpen && (
        <div className={menuDropdown} role="menu">
          <Link
            href={`/sessions/new?scenarioId=${scenarioId}` as '/sessions/new'}
            className={menuLink}
            role="menuitem"
            onClick={() => setIsOpen(false)}
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
              href={`/scenarios/${scenarioId}/edit`}
              className={menuLink}
              role="menuitem"
              onClick={() => setIsOpen(false)}
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
  );
};

'use client';

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  Check,
  List,
  PencilSimple,
  Plus,
  ShareNetwork,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from './styles';

import type { Route } from 'next';

type ScenarioFABProps = {
  scenarioId: string;
  isPlayed: boolean;
  canEdit: boolean;
  onTogglePlayed: () => Promise<void>;
};

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
    setIsMenuOpen(false);
    startTransition(async () => {
      setOptimisticPlayed(!optimisticPlayed);
      await onTogglePlayed();
    });
  };

  return (
    <div className={styles.fabContainer} ref={menuRef}>
      {/* メニュー（開いている時のみ表示） */}
      {isMenuOpen && (
        <div className={styles.fabMenu}>
          <Link
            href={`/sessions/new?scenarioId=${scenarioId}` as '/sessions/new'}
            className={styles.fabMenuItem}
            onClick={() => setIsMenuOpen(false)}
          >
            <Plus size={18} className={styles.fabMenuItem_iconPrimary} />
            <span>セッション作成</span>
          </Link>

          <button
            type="button"
            className={styles.fabMenuItem}
            onClick={handleTogglePlayed}
          >
            <Check size={18} className={styles.fabMenuItem_iconGray} />
            <span>プレイ済み登録</span>
            {optimisticPlayed && (
              <Check size={14} className={styles.fabMenuItem_iconPrimary} />
            )}
          </button>

          <button
            type="button"
            className={styles.fabMenuItem}
            onClick={handleShare}
          >
            <ShareNetwork size={18} className={styles.fabMenuItem_iconGray} />
            <span>シェア</span>
          </button>

          {canEdit && (
            <Link
              href={`/scenarios/${scenarioId}/edit` as Route}
              className={styles.fabMenuItem}
              onClick={() => setIsMenuOpen(false)}
            >
              <PencilSimple size={18} className={styles.fabMenuItem_iconGray} />
              <span>シナリオ編集</span>
            </Link>
          )}
        </div>
      )}

      {/* FABボタン */}
      <button
        type="button"
        className={styles.fabButton}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="メニューを開く"
        aria-expanded={isMenuOpen}
      >
        <List size={24} />
      </button>
    </div>
  );
};

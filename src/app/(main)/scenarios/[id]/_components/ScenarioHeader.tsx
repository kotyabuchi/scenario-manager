'use client';

import { useOptimistic, useTransition } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';

import * as styles from './styles';

type ScenarioHeaderProps = {
  scenarioName: string;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
  onToggleFavorite?: () => Promise<void>;
};

export const ScenarioHeader = ({
  scenarioName,
  isFavorite = false,
  isLoggedIn = false,
  onToggleFavorite,
}: ScenarioHeaderProps) => {
  const [, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

  const handleToggleFavorite = () => {
    if (!onToggleFavorite) return;
    startTransition(async () => {
      setOptimisticFavorite(!optimisticFavorite);
      await onToggleFavorite();
    });
  };

  return (
    <header className={styles.subHeader}>
      <div className={styles.subHeader_left}>
        <Link
          href="/scenarios"
          className={styles.subHeader_backBtn}
          aria-label="シナリオ一覧に戻る"
        >
          <ArrowLeft size={18} />
        </Link>

        <h1 className={styles.subHeader_title}>{scenarioName}</h1>
      </div>

      {isLoggedIn && onToggleFavorite && (
        <button
          type="button"
          className={styles.subHeader_favBtn}
          onClick={handleToggleFavorite}
          aria-label={optimisticFavorite ? 'お気に入り解除' : 'お気に入り登録'}
        >
          <Star
            size={16}
            className={styles.subHeader_favIcon}
            fill={optimisticFavorite ? 'currentColor' : 'none'}
          />
          <span>お気に入り</span>
        </button>
      )}
    </header>
  );
};

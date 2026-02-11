'use client';

import { useOptimistic, useTransition } from 'react';
import { Star } from 'lucide-react';

import * as styles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader';

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
    <PageHeader
      backHref="/scenarios"
      title={scenarioName}
      actions={
        isLoggedIn && onToggleFavorite ? (
          <button
            type="button"
            className={styles.subHeader_favBtn}
            onClick={handleToggleFavorite}
            aria-label={
              optimisticFavorite ? 'お気に入り解除' : 'お気に入り登録'
            }
          >
            <Star
              size={16}
              className={styles.subHeader_favIcon}
              fill={optimisticFavorite ? 'currentColor' : 'none'}
            />
            <span>お気に入り</span>
          </button>
        ) : undefined
      }
    />
  );
};

import { BookOpen } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import { ScenarioCard } from '@/app/(main)/scenarios/_components/ScenarioCard';

import type { NewScenariosProps } from '../interface';

export const NewScenarios = ({ scenarios }: NewScenariosProps) => {
  if (scenarios.length === 0) {
    return (
      <div className={styles.emptyState}>
        <BookOpen className={styles.emptyStateIcon} />
        <p className={styles.emptyStateText}>新着シナリオはまだありません</p>
      </div>
    );
  }

  return (
    <div className={styles.scenarioGrid}>
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.scenarioId}
          scenario={{
            ...scenario,
            tags: scenario.scenarioTags.map((t) => t.tag),
            averageRating: null,
            reviewCount: 0,
          }}
        />
      ))}
    </div>
  );
};

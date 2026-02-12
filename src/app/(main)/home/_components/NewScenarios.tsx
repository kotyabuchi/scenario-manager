import { BookOpen, CaretRight } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from '../styles';

import { ScenarioCard } from '@/app/(main)/scenarios/_components/ScenarioCard';

import type { NewScenariosProps } from '../interface';

export const NewScenarios = ({ scenarios }: NewScenariosProps) => {
  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionAccentBar} />
          新着おすすめシナリオ
        </h2>
        {scenarios.length > 0 && (
          <Link href="/scenarios" className={styles.sectionLink}>
            すべて見る
            <CaretRight size={16} />
          </Link>
        )}
      </div>

      {scenarios.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen className={styles.emptyStateIcon} />
          <p className={styles.emptyStateText}>新着シナリオはまだありません</p>
        </div>
      ) : (
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
      )}
    </section>
  );
};

import { Search } from 'lucide-react';

import { ScenarioCard } from './ScenarioCard';
import * as styles from './styles.experimental'; // 実験用スタイル

import type { ScenarioListProps } from '../interface';

export const ScenarioList = ({ scenarios, isLoading }: ScenarioListProps) => {
  if (isLoading) {
    return (
      <div className={styles.scenarioListEmpty}>
        <span className={styles.scenarioListEmptyText}>読み込み中...</span>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className={styles.scenarioListEmpty}>
        <Search className={styles.scenarioListEmptyIcon} />
        <span className={styles.scenarioListEmptyText}>
          条件に一致するシナリオが見つかりませんでした
        </span>
        <span className={styles.scenarioListEmptySubtext}>
          条件を変えて、もう一度探してみませんか？
        </span>
      </div>
    );
  }

  return (
    <div className={styles.scenarioListContainer}>
      {scenarios.map((scenario) => (
        <ScenarioCard key={scenario.scenarioId} scenario={scenario} />
      ))}
    </div>
  );
};

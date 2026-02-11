import { Plus, RotateCcw, SearchX } from 'lucide-react';

import { ScenarioCard } from './ScenarioCard';
import { ScenarioCardSkeletonGrid } from './ScenarioCardSkeleton';
import * as styles from './styles';

import { ScenarioRegisterDialog } from '@/components/blocks/ScenarioRegisterDialog';
import { Button } from '@/components/elements/button/button';

import type { ScenarioListProps } from '../interface';

type ScenarioListWithActionsProps = ScenarioListProps & {
  onReset?: () => void;
};

export const ScenarioList = ({
  scenarios,
  isLoading,
  onReset,
}: ScenarioListWithActionsProps) => {
  if (isLoading) {
    return <ScenarioCardSkeletonGrid />;
  }

  if (scenarios.length === 0) {
    return (
      <div className={styles.scenarioListEmpty}>
        {/* アイコン（円形フレーム内） */}
        <div className={styles.scenarioListEmptyIconFrame}>
          <SearchX className={styles.scenarioListEmptyIcon} />
        </div>

        {/* タイトル */}
        <span className={styles.scenarioListEmptyText}>
          条件に一致するシナリオが見つかりませんでした
        </span>

        {/* サブテキスト */}
        <span className={styles.scenarioListEmptySubtext}>
          検索条件を変更するか、新しいシナリオを登録してみませんか？
        </span>

        {/* アクションボタン */}
        <div className={styles.scenarioListEmptyActions}>
          <Button variant="outline" status="primary" onClick={onReset}>
            <RotateCcw size={16} />
            条件をリセット
          </Button>
          <ScenarioRegisterDialog>
            <Button status="primary">
              <Plus size={18} />
              シナリオを登録する
            </Button>
          </ScenarioRegisterDialog>
        </div>
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

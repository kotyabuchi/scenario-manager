'use client';

import { Clock, Users, X } from '@phosphor-icons/react/ssr';

import { formatPlayerCount, formatPlaytime } from './formatters';
import * as styles from './styles';

import { IconButton } from '@/components/elements/icon-button/icon-button';

import type { ScenarioSummary } from '../../interface';

type ScenarioSelectedCardProps = {
  scenario: ScenarioSummary;
  onClear: () => void;
  onChange: () => void;
};

export const ScenarioSelectedCard = ({
  scenario,
  onClear,
  onChange,
}: ScenarioSelectedCardProps) => {
  return (
    <div className={styles.scenarioCard}>
      <div className={styles.scenarioCard_content}>
        <span className={styles.scenarioCard_system}>
          {scenario.systemName}
        </span>
        <h3 className={styles.scenarioCard_title}>{scenario.name}</h3>
        <div className={styles.scenarioCard_meta}>
          <span className={styles.scenarioCard_metaItem}>
            <Users size={14} aria-hidden="true" />
            {formatPlayerCount(
              scenario.minPlayer,
              scenario.maxPlayer,
              '未設定',
            )}
          </span>
          <span className={styles.scenarioCard_metaItem}>
            <Clock size={14} aria-hidden="true" />
            {formatPlaytime(
              scenario.minPlaytime,
              scenario.maxPlaytime,
              '未設定',
            )}
          </span>
        </div>
      </div>
      <div className={styles.scenarioCard_actions}>
        <button
          type="button"
          className={styles.scenarioCard_changeLink}
          onClick={onChange}
          aria-label="シナリオを変更"
        >
          変更
        </button>
        <IconButton
          aria-label="シナリオの選択を解除"
          onClick={onClear}
          variant="ghost"
          size="sm"
        >
          <X size={16} />
        </IconButton>
      </div>
    </div>
  );
};

export type { ScenarioSelectedCardProps };

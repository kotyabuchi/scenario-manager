'use client';

import { Clock, Users, X } from '@phosphor-icons/react/ssr';

import * as styles from './scenarioCardStyles';

import { IconButton } from '@/components/elements/icon-button/icon-button';

import type { ScenarioSummary } from '../interface';

type ScenarioSelectedCardProps = {
  scenario: ScenarioSummary;
  onClear: () => void;
  onChange: () => void;
};

/** プレイ人数のフォーマット */
const formatPlayerCount = (min: number | null, max: number | null): string => {
  if (min === null && max === null) return '未設定';
  if (min !== null && max !== null) {
    return min === max ? `${min}人` : `${min}〜${max}人`;
  }
  if (min !== null) return `${min}人〜`;
  return `〜${max}人`;
};

/** プレイ時間のフォーマット */
const formatPlaytime = (min: number | null, max: number | null): string => {
  if (min === null && max === null) return '未設定';
  if (min !== null && max !== null) {
    return min === max ? `${min}分` : `${min}〜${max}分`;
  }
  if (min !== null) return `${min}分〜`;
  return `〜${max}分`;
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
            {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
          </span>
          <span className={styles.scenarioCard_metaItem}>
            <Clock size={14} aria-hidden="true" />
            {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
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

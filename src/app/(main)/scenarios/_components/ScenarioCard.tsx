import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import type { ScenarioCardProps } from '../interface';

/**
 * プレイ時間を表示用にフォーマット
 */
const formatPlaytime = (
  minMinutes?: number | null,
  maxMinutes?: number | null,
): string => {
  if (isNil(minMinutes) && isNil(maxMinutes)) return '-';

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}時間`;
    return `${hours}時間${mins}分`;
  };

  if (isNil(minMinutes)) return formatHours(maxMinutes!);
  if (isNil(maxMinutes)) return formatHours(minMinutes);
  if (minMinutes === maxMinutes) return formatHours(minMinutes);

  return `${formatHours(minMinutes)}〜${formatHours(maxMinutes)}`;
};

/**
 * プレイ人数を表示用にフォーマット
 */
const formatPlayerCount = (
  min?: number | null,
  max?: number | null,
): string => {
  if (isNil(min) && isNil(max)) return '-';
  if (isNil(min)) return `〜${max}人`;
  if (isNil(max)) return `${min}人〜`;
  if (min === max) return `${min}人`;
  return `${min}〜${max}人`;
};

export const ScenarioCard = ({ scenario }: ScenarioCardProps) => {
  const tags = scenario.scenarioTags.map((st) => st.tag).slice(0, 2);

  return (
    <Link
      href={`/scenarios/${scenario.scenarioId}`}
      className={styles.scenarioCard}
    >
      {/* サムネイル */}
      <div className={styles.cardThumbnail}>
        {!isNil(scenario.scenarioImageUrl) ? (
          <img
            src={scenario.scenarioImageUrl}
            alt={scenario.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.cardThumbnailPlaceholder}>No Image</div>
        )}
      </div>

      {/* コンテンツ */}
      <div className={styles.cardContent}>
        {/* システム名 */}
        <span className={styles.cardSystem}>{scenario.system.name}</span>

        {/* シナリオ名 */}
        <h3 className={styles.cardTitle}>{scenario.name}</h3>

        {/* メタ情報 */}
        <div className={styles.cardMeta}>
          <span className={styles.cardMetaItem}>
            {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
          </span>
          <span className={styles.cardMetaItem}>
            {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
          </span>
        </div>

        {/* タグ */}
        {tags.length > 0 && (
          <div className={styles.cardTags}>
            {tags.map((tag) => (
              <span key={tag.tagId} className={styles.cardTag}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

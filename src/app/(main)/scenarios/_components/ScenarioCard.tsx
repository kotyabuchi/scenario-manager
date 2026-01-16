import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioCardProps } from '../interface';

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
          <Image
            src={scenario.scenarioImageUrl}
            alt={scenario.name}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            style={{ objectFit: 'cover' }}
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

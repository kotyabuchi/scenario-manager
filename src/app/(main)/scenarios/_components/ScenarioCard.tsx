import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioCardProps } from '../interface';

export const ScenarioCard = ({ scenario }: ScenarioCardProps) => {
  const tags = scenario.scenarioTags.map((st) => st.tag).slice(0, 3);

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
        {/* オーバーレイ: システム名と評価 */}
        <div className={styles.cardOverlay}>
          <span className={styles.cardSystemLabel}>{scenario.system.name}</span>
          <span className={styles.cardRating}>
            <span className={styles.cardRatingStar}>★</span>
            {/* TODO: 実際の評価データと連携 */}-
          </span>
        </div>
      </div>

      {/* コンテンツ */}
      <div className={styles.cardContent}>
        {/* シナリオ名 */}
        <h3 className={styles.cardTitle}>{scenario.name}</h3>

        {/* メタ情報 */}
        <div className={styles.cardMeta}>
          <span className={styles.cardMetaItem}>
            <span className={styles.cardMetaIcon}>👤</span>
            {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
          </span>
          <span className={styles.cardMetaItem}>
            <span className={styles.cardMetaIcon}>⏱</span>
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

        {/* 概要 */}
        {!isNil(scenario.description) && (
          <p className={styles.cardDescription}>{scenario.description}</p>
        )}
      </div>
    </Link>
  );
};

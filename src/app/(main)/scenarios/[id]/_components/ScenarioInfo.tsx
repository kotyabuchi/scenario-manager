'use client';

import { useState } from 'react';
import Image from 'next/image';
import { isNil } from 'ramda';

import * as styles from './styles';

import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioDetail } from '../interface';

type ScenarioInfoProps = {
  scenario: ScenarioDetail;
};

/**
 * 星評価を表示するコンポーネント
 */
const StarRating = ({ rating }: { rating: number | null }) => {
  if (isNil(rating)) {
    return <span className={styles.scenarioInfo_ratingCount}>評価なし</span>;
  }

  return (
    <div className={styles.scenarioInfo_ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ opacity: star <= rating ? 1 : 0.3 }}>
          ★
        </span>
      ))}
    </div>
  );
};

export const ScenarioInfo = ({ scenario }: ScenarioInfoProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const hasLongDescription =
    !isNil(scenario.description) && scenario.description.length > 200;

  return (
    <article className={styles.scenarioInfo}>
      {/* サムネイル */}
      <div>
        {!isNil(scenario.scenarioImageUrl) ? (
          <div className={styles.scenarioInfo_thumbnail}>
            <Image
              src={scenario.scenarioImageUrl}
              alt={scenario.name}
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        ) : (
          <div className={styles.scenarioInfo_thumbnailPlaceholder}>
            No Image
          </div>
        )}
      </div>

      {/* 情報エリア */}
      <div className={styles.scenarioInfo_content}>
        {/* システム名 */}
        <span className={styles.scenarioInfo_system}>
          {scenario.system.name}
        </span>

        {/* シナリオ名 */}
        <h1 className={styles.scenarioInfo_title}>{scenario.name}</h1>

        {/* 評価 */}
        <div className={styles.scenarioInfo_rating}>
          <StarRating rating={scenario.avgRating} />
          {!isNil(scenario.avgRating) && (
            <span className={styles.scenarioInfo_ratingValue}>
              {scenario.avgRating.toFixed(1)}
            </span>
          )}
          <span className={styles.scenarioInfo_ratingCount}>
            ({scenario.reviewCount}件)
          </span>
        </div>

        {/* 作者 */}
        {!isNil(scenario.author) && (
          <p className={styles.scenarioInfo_author}>作者: {scenario.author}</p>
        )}

        {/* メタ情報 */}
        <div className={styles.scenarioInfo_metaGrid}>
          <div className={styles.scenarioInfo_metaItem}>
            <span className={styles.scenarioInfo_metaLabel}>プレイ人数</span>
            <span className={styles.scenarioInfo_metaValue}>
              {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
            </span>
          </div>
          <div className={styles.scenarioInfo_metaItem}>
            <span className={styles.scenarioInfo_metaLabel}>プレイ時間</span>
            <span className={styles.scenarioInfo_metaValue}>
              {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
            </span>
          </div>
          <div className={styles.scenarioInfo_metaItem}>
            <span className={styles.scenarioInfo_metaLabel}>ハンドアウト</span>
            <span className={styles.scenarioInfo_metaValue}>
              {scenario.handoutType === 'NONE' && 'なし'}
              {scenario.handoutType === 'PUBLIC' && '公開'}
              {scenario.handoutType === 'SECRET' && '秘匿'}
            </span>
          </div>
        </div>

        {/* タグ */}
        {scenario.tags.length > 0 && (
          <div className={styles.scenarioInfo_tags}>
            {scenario.tags.map((tag) => (
              <span key={tag.tagId} className={styles.scenarioInfo_tag}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 概要 */}
        {!isNil(scenario.description) && (
          <div className={styles.description_section}>
            <h2 className={styles.description_title}>概要</h2>
            <div className={styles.description_wrapper}>
              <p
                className={`${styles.description_text} ${
                  !isDescriptionExpanded && hasLongDescription
                    ? styles.description_collapsed
                    : ''
                }`}
              >
                {scenario.description}
              </p>
              {!isDescriptionExpanded && hasLongDescription && (
                <div className={styles.description_fadeout} />
              )}
            </div>
            {hasLongDescription && (
              <button
                type="button"
                className={styles.description_toggleButton}
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? '閉じる' : '続きを読む'}
              </button>
            )}
          </div>
        )}

        {/* 配布URL */}
        {!isNil(scenario.distributeUrl) && (
          <div className={styles.distributeUrl}>
            <a
              href={scenario.distributeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.distributeUrl_link}
            >
              配布ページを開く →
            </a>
          </div>
        )}
      </div>
    </article>
  );
};

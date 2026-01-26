'use client';

import { useState } from 'react';
import { ExternalLink, FileText, Star, Timer, User, Users } from 'lucide-react';
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
    return null;
  }

  return (
    <div className={styles.scenarioInfo_ratingStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          fill={star <= rating ? 'currentColor' : 'none'}
          style={{ opacity: star <= rating ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
};

/**
 * ハンドアウトタイプのテキスト
 */
const getHandoutText = (type: string): string => {
  switch (type) {
    case 'NONE':
      return 'なし';
    case 'PUBLIC':
      return '公開';
    case 'SECRET':
      return '秘匿ハンドアウト';
    default:
      return '不明';
  }
};

export const ScenarioInfo = ({ scenario }: ScenarioInfoProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const hasLongDescription =
    !isNil(scenario.description) && scenario.description.length > 200;

  // 短縮表示時のテキスト（3行分程度）
  const truncatedDescription =
    !isNil(scenario.description) && hasLongDescription && !isDescriptionExpanded
      ? `${scenario.description.slice(0, 150)}...`
      : scenario.description;

  return (
    <article className={styles.firstView}>
      {/* サムネイル */}
      {!isNil(scenario.scenarioImageUrl) ? (
        <div className={styles.firstView_thumbnail}>
          <Image
            src={scenario.scenarioImageUrl}
            alt={scenario.name}
            fill
            sizes="400px"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      ) : (
        <div className={styles.firstView_thumbnailPlaceholder}>
          <FileText size={48} />
        </div>
      )}

      {/* 情報エリア */}
      <div className={styles.firstView_content}>
        {/* トップ: システム + 評価 */}
        <div className={styles.scenarioInfo_top}>
          <span className={styles.scenarioInfo_system}>
            {scenario.system.name}
          </span>
          {!isNil(scenario.avgRating) && (
            <div className={styles.scenarioInfo_rating}>
              <StarRating rating={scenario.avgRating} />
              <span className={styles.scenarioInfo_ratingText}>
                {scenario.avgRating.toFixed(1)}（{scenario.reviewCount}件）
              </span>
            </div>
          )}
        </div>

        {/* シナリオ名 */}
        <h1 className={styles.scenarioInfo_title}>{scenario.name}</h1>

        {/* メタ情報（横並び） */}
        <div className={styles.scenarioInfo_metaRow}>
          <div className={styles.scenarioInfo_metaItem}>
            <Users size={16} className={styles.scenarioInfo_metaIcon} />
            <span>
              {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
            </span>
          </div>
          <div className={styles.scenarioInfo_metaItem}>
            <Timer size={16} className={styles.scenarioInfo_metaIcon} />
            <span>
              {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
            </span>
          </div>
          {!isNil(scenario.author) && (
            <div className={styles.scenarioInfo_metaItem}>
              <User size={16} className={styles.scenarioInfo_metaIcon} />
              <span>作者: {scenario.author}</span>
            </div>
          )}
          <div className={styles.scenarioInfo_metaItem}>
            <FileText size={16} className={styles.scenarioInfo_metaIcon} />
            <span>{getHandoutText(scenario.handoutType)}</span>
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
          <div className={styles.scenarioInfo_description}>
            <p className={styles.scenarioInfo_descText}>
              {truncatedDescription}
            </p>
            {hasLongDescription && (
              <button
                type="button"
                className={styles.scenarioInfo_readMore}
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? '閉じる' : '続きを読む'}
              </button>
            )}
          </div>
        )}

        {/* 配布URL */}
        {!isNil(scenario.distributeUrl) && (
          <a
            href={scenario.distributeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.scenarioInfo_distributeBtn}
          >
            <ExternalLink size={14} />
            <span>シナリオ配布ページへ</span>
          </a>
        )}
      </div>
    </article>
  );
};

import { Clock, ImageOff, Star, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioCardProps } from '../interface';

// システム名に基づいて色を決定（cvaバリアントの背景色と同期）
const getSystemColor = (systemName: string): string => {
  const name = systemName.toLowerCase();
  if (name.includes('coc') && name.includes('7')) return '#10B981'; // primary.500
  if (name.includes('sw') && name.includes('2.5')) return '#8B5CF6'; // purple.500
  if (name.includes('coc') && name.includes('6')) return '#F59E0B'; // CoC6版
  if (name.includes('coc')) return '#10B981'; // primary.500
  return '#6B7280'; // gray.500
};

// システムバリアントを決定
const getSystemVariant = (
  systemName: string,
): 'coc7' | 'sw25' | 'coc6' | 'default' => {
  const name = systemName.toLowerCase();
  if (name.includes('coc') && name.includes('7')) return 'coc7';
  if (name.includes('sw') && name.includes('2.5')) return 'sw25';
  if (name.includes('coc') && name.includes('6')) return 'coc6';
  if (name.includes('coc')) return 'coc7';
  return 'default';
};

export const ScenarioCard = ({ scenario }: ScenarioCardProps) => {
  const tags = scenario.tags
    ? scenario.tags.slice(0, 3)
    : scenario.scenarioTags
      ? scenario.scenarioTags.map((st) => st.tag).slice(0, 3)
      : [];

  const systemColor = getSystemColor(scenario.system.name);
  const systemVariant = getSystemVariant(scenario.system.name);

  return (
    <Link
      href={`/scenarios/${scenario.scenarioId}`}
      className={`group ${styles.scenarioCard}`}
      prefetch={false}
    >
      {/* サムネイル */}
      <div className={styles.cardThumbnail}>
        {!isNil(scenario.scenarioImageUrl) ? (
          <Image
            src={scenario.scenarioImageUrl}
            alt={scenario.name}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className={styles.cardThumbnailImage}
          />
        ) : (
          <div className={styles.cardThumbnailPlaceholder}>
            <ImageOff className={styles.cardThumbnailPlaceholderIcon} />
            <span className={styles.cardThumbnailPlaceholderText}>
              No Image
            </span>
          </div>
        )}

        {/* システム名ラベル（リキッドカーブ付き） */}
        <div className={styles.cardSystemLabelWrapper}>
          <div className={styles.cardSystemLabel({ system: systemVariant })}>
            <span className={styles.cardSystemLabelText}>
              {scenario.system.name}
            </span>
          </div>
          {/* 右側のリキッドカーブ */}
          <div
            className={styles.cardSystemLabelCurveRight}
            style={{
              background: `radial-gradient(circle 16px at 100% 100%, transparent 15.5px, ${systemColor} 16px)`,
            }}
          />
          {/* 下側のリキッドカーブ */}
          <div
            className={styles.cardSystemLabelCurveBottom}
            style={{
              background: `radial-gradient(circle 16px at 100% 100%, transparent 15.5px, ${systemColor} 16px)`,
            }}
          />
        </div>

        {/* お気に入りボタン */}
        <div className={styles.cardFavoriteButton}>
          <Star className={styles.cardFavoriteIcon} />
        </div>
      </div>

      {/* コンテンツ */}
      <div className={styles.cardContent}>
        {/* シナリオ名 */}
        <h3 className={styles.cardTitle}>{scenario.name}</h3>

        {/* メタ情報 */}
        <div className={styles.cardMeta}>
          <div className={styles.cardMetaItem}>
            <Users className={styles.cardMetaIcon} />
            <span>
              {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
            </span>
          </div>
          <div className={styles.cardMetaItem}>
            <Clock className={styles.cardMetaIcon} />
            <span>
              {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
            </span>
          </div>
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

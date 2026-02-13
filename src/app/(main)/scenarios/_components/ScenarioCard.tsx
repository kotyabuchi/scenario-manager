import { Clock, ImageBroken, Star, Users } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioCardProps } from '../interface';

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
            <ImageBroken className={styles.cardThumbnailPlaceholderIcon} />
            <span className={styles.cardThumbnailPlaceholderText}>
              No Image
            </span>
          </div>
        )}

        {/* システム名ラベル（逆角丸カットアウト） */}
        <div className={styles.cardSystemLabel}>
          <span
            className={styles.cardSystemLabelText({ system: systemVariant })}
          >
            {scenario.system.name}
          </span>
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

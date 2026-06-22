import { Clock, ImageSquare, Star, Users } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { Badge, type BadgeVariant } from '@/components/elements/badge';
import { Tag } from '@/components/elements/Tag';
import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioWithRelations } from '../interface';

export type ScenarioCardAltProps = {
  scenario: ScenarioWithRelations;
  /** 左上に表示するバッジ（人気/新着/おすすめ 等） */
  badge?: { label: string; variant: BadgeVariant };
};

/**
 * ScenarioCardAlt - モック準拠の比較用カードバリアント
 *
 * 現行 {@link ScenarioCard} との比較用。差分:
 * - 左上のノッチ式システムラベルを廃止
 * - 左上にバッジ（人気/新着 等）をオーバーレイ
 * - 画像をフルブリード（余白なし）
 * - 概要を出さず、タイトル → システム → タグ → メタ の順
 */
export const ScenarioCardAlt = ({ scenario, badge }: ScenarioCardAltProps) => {
  const tags = scenario.tags
    ? scenario.tags.slice(0, 3)
    : scenario.scenarioTags
      ? scenario.scenarioTags.map((st) => st.tag).slice(0, 3)
      : [];

  return (
    <Link
      href={`/scenarios/${scenario.scenarioId}`}
      className={`group ${styles.cardAlt}`}
      prefetch={false}
    >
      {/* サムネイル（フルブリード） */}
      <div className={styles.cardAlt_thumb}>
        {!isNil(scenario.scenarioImageUrl) ? (
          <Image
            src={scenario.scenarioImageUrl}
            alt={scenario.name}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className={styles.cardAlt_image}
          />
        ) : (
          <div className={styles.cardThumbnailPlaceholder}>
            <ImageSquare className={styles.cardThumbnailPlaceholderIcon} />
            <span className={styles.cardThumbnailPlaceholderText}>
              No Image
            </span>
          </div>
        )}

        {/* 左上バッジ */}
        {badge && (
          <div className={styles.cardAlt_badge}>
            <Badge variant={badge.variant} showDot={false}>
              {badge.label}
            </Badge>
          </div>
        )}

        {/* お気に入り */}
        <div className={styles.cardFavoriteButton}>
          <Star className={styles.cardFavoriteIcon} />
        </div>
      </div>

      {/* コンテンツ: タイトル → システム → タグ → メタ */}
      <div className={styles.cardAlt_content}>
        <h3 className={styles.cardAlt_title}>{scenario.name}</h3>

        <span className={styles.cardAlt_system}>{scenario.system.name}</span>

        {tags.length > 0 && (
          <div className={styles.cardAlt_tags}>
            {tags.map((tag) => (
              <Tag
                key={tag.tagId}
                label={tag.name}
                color={tag.color}
                size="sm"
              />
            ))}
          </div>
        )}

        <div className={styles.cardAlt_meta}>
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
      </div>
    </Link>
  );
};

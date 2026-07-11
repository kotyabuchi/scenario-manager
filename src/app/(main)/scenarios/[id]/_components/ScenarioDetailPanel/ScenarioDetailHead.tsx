import {
  ArrowSquareOut,
  FileText,
  ImageSquare,
  Star,
  Timer,
  User,
  Users,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { isNil } from 'ramda';

import * as styles from './styles';

import { Badge, type BadgeVariant } from '@/components/elements/badge';
import { Tag } from '@/components/elements/Tag';
import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

import type { ScenarioDetail } from '../../interface';

export type ScenarioDetailHeadProps = {
  scenario: ScenarioDetail;
  /** シナリオ名の上に表示する状態バッジ（新着・募集中など、任意・複数可） */
  badges?: { label: string; variant: BadgeVariant }[];
};

const getHandoutText = (type: string): string => {
  switch (type) {
    case 'NONE':
      return 'HOなし';
    case 'PUBLIC':
      return '公開HO';
    case 'SECRET':
      return '秘匿HO';
    default:
      return 'HO不明';
  }
};

const StarRating = ({ rating }: { rating: number }) => (
  <span className={styles.head_ratingStars} aria-hidden>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={16}
        weight={star <= rating ? 'fill' : 'regular'}
        className={styles.head_star({ filled: star <= rating })}
      />
    ))}
  </span>
);

const MetaItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className={styles.head_metaItem}>
    <span className={styles.head_metaIcon}>{icon}</span>
    <span className={styles.head_metaText}>
      <span className={styles.head_metaLabel}>{label}</span>
      <span className={styles.head_metaValue}>{value}</span>
    </span>
  </div>
);

/**
 * ScenarioDetailHead - シナリオ詳細の上部情報群（first-view）
 *
 * サムネイル＋（タイトル・状態バッジ・システム・タグ・概要・メタ情報・評価）。
 * 既存 ScenarioInfo の流用ではなく、詳細ペイン向けに配置・字組みを作り直したもの。
 */
export const ScenarioDetailHead = ({
  scenario,
  badges,
}: ScenarioDetailHeadProps) => {
  const hasBadges = !isNil(badges) && badges.length > 0;
  const hasRating = !isNil(scenario.avgRating);
  return (
    <article className={styles.head}>
      {!isNil(scenario.scenarioImageUrl) ? (
        <div className={styles.head_thumbnail}>
          <Image
            src={scenario.scenarioImageUrl}
            alt={scenario.name}
            fill
            sizes="300px"
            className={styles.head_thumbnailImage}
            priority
          />
        </div>
      ) : (
        <div className={styles.head_thumbnailPlaceholder}>
          <ImageSquare size={48} />
        </div>
      )}

      <div className={styles.head_content}>
        {/* シナリオ名の上: 左=バッジ群 / 右=評価 */}
        {(hasBadges || hasRating) && (
          <div className={styles.head_topRow}>
            <div className={styles.head_badges}>
              {badges?.map((b, index) => (
                <Badge key={`${b.label}-${index}`} variant={b.variant}>
                  {b.label}
                </Badge>
              ))}
            </div>
            {!isNil(scenario.avgRating) && (
              <div
                className={styles.head_rating}
                role="img"
                aria-label={`評価 ${scenario.avgRating.toFixed(1)}（${scenario.reviewCount}件）`}
              >
                <StarRating rating={scenario.avgRating} />
                <span className={styles.head_ratingText} aria-hidden>
                  {scenario.avgRating.toFixed(1)}（{scenario.reviewCount}件）
                </span>
              </div>
            )}
          </div>
        )}

        <div className={styles.head_titleGroup}>
          <h1 className={styles.head_title}>{scenario.name}</h1>
          <p className={styles.head_system}>{scenario.system.name}</p>
        </div>

        {scenario.tags.length > 0 && (
          <div className={styles.head_tags}>
            {scenario.tags.map((tag) => (
              <Tag
                key={tag.tagId}
                label={tag.name}
                color={tag.color}
                size="sm"
              />
            ))}
          </div>
        )}

        <div className={styles.head_metaRow}>
          <MetaItem
            icon={<Users size={18} />}
            label="人数"
            value={formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
          />
          <span className={styles.head_metaDivider} aria-hidden="true" />
          <MetaItem
            icon={<Timer size={18} />}
            label="プレイ時間"
            value={formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
          />
          {!isNil(scenario.author) && (
            <>
              <span className={styles.head_metaDivider} aria-hidden="true" />
              <MetaItem
                icon={<User size={18} />}
                label="作者"
                value={scenario.author}
              />
            </>
          )}
          <span className={styles.head_metaDivider} aria-hidden="true" />
          <MetaItem
            icon={<FileText size={18} />}
            label="ハンドアウト"
            value={getHandoutText(scenario.handoutType)}
          />
        </div>

        {!isNil(scenario.distributeUrl) && (
          <a
            href={scenario.distributeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.head_distribute}
          >
            <ArrowSquareOut size={16} />
            配布ページを開く
          </a>
        )}
      </div>
    </article>
  );
};

import * as styles from './styles';

import { Skeleton } from '@/components/elements/skeleton';

/**
 * ScenarioCard のスケルトン表示
 * 検索中のプレースホルダーとして使用
 */
export const ScenarioCardSkeleton = () => (
  <div className={styles.scenarioCard} aria-hidden="true">
    {/* サムネイル */}
    <Skeleton variant="rectangle" width="100%" height={180} withA11y={false} />

    {/* コンテンツ */}
    <div className={styles.cardContent}>
      {/* タイトル */}
      <Skeleton width="75%" height={18} withA11y={false} />

      {/* メタ情報 */}
      <div className={styles.cardMeta}>
        <Skeleton width={70} height={14} withA11y={false} />
        <Skeleton width={50} height={14} withA11y={false} />
      </div>

      {/* タグ */}
      <div className={styles.cardTags}>
        <Skeleton width={52} height={24} withA11y={false} />
        <Skeleton width={44} height={24} withA11y={false} />
        <Skeleton width={60} height={24} withA11y={false} />
      </div>

      {/* 説明文 */}
      <Skeleton variant="text" lines={2} width="100%" withA11y={false} />
    </div>
  </div>
);

/** 検索APIのデフォルト limit（adapter.ts）に合わせた表示件数 */
const SKELETON_COUNT = 20;

/**
 * ScenarioCard スケルトングリッド
 */
export const ScenarioCardSkeletonGrid = () => (
  // biome-ignore lint/a11y/useSemanticElements: divにrole="status"はローディング表示に適切
  <div
    role="status"
    aria-busy="true"
    aria-label="検索中"
    className={styles.scenarioListContainer}
  >
    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
      /* biome-ignore lint/suspicious/noArrayIndexKey: 固定数のスケルトンのためインデックスキーで十分 */
      <ScenarioCardSkeleton key={i} />
    ))}
  </div>
);

'use client';

import * as styles from './styles';

export type SkeletonProps = {
  /**
   * バリアント
   * @default 'text'
   */
  variant?: 'text' | 'circle' | 'rectangle';

  /**
   * 幅
   * @default '100%'
   */
  width?: string | number;

  /**
   * 高さ
   */
  height?: string | number;

  /**
   * 行数（テキストバリアントのみ）
   * @default 1
   */
  lines?: number;

  /**
   * アニメーションを有効にするか
   * @default true
   */
  animate?: boolean;

  /**
   * アクセシビリティ属性を付与するか（プリセット内で使用する場合はfalse）
   * @default true
   */
  withA11y?: boolean;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * スケルトンコンポーネント
 *
 * ローディング中のコンテンツプレースホルダーを表示する。
 *
 * @example
 * // テキスト
 * <Skeleton width={200} height={16} />
 *
 * @example
 * // 複数行テキスト
 * <Skeleton variant="text" lines={3} width={200} />
 *
 * @example
 * // 円形（アバター用）
 * <Skeleton variant="circle" width={48} height={48} />
 */
export const Skeleton = ({
  variant = 'text',
  width = '100%',
  height,
  lines = 1,
  animate = true,
  withA11y = true,
  className,
}: SkeletonProps) => {
  const baseStyle = animate
    ? styles.skeleton_baseAnimated
    : styles.skeleton_baseStatic;

  const getVariantStyle = () => {
    switch (variant) {
      case 'circle':
        return styles.skeleton_circle;
      case 'rectangle':
        return styles.skeleton_rectangle;
      default:
        return styles.skeleton_text;
    }
  };

  const formatSize = (value: string | number | undefined) =>
    typeof value === 'number' ? `${value}px` : value;

  const a11yProps = withA11y
    ? {
        role: 'status' as const,
        'aria-busy': true as const,
        'aria-label': '読み込み中',
      }
    : {};

  // 複数行テキストの場合
  if (variant === 'text' && lines > 1) {
    const getLineStyle = (index: number) => {
      if (index === lines - 1) {
        return styles.skeleton_lineLastStyle;
      }
      if (index === lines - 2) {
        return styles.skeleton_lineSecondLastStyle;
      }
      return styles.skeleton_lineNormalStyle;
    };

    return (
      <div
        {...a11yProps}
        className={`${styles.skeleton_linesContainer} ${className ?? ''}`}
        style={{ width: formatSize(width) }}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            /* biome-ignore lint/suspicious/noArrayIndexKey: 動的な行数のためインデックスキーが必要 */
            key={index}
            className={`${baseStyle} ${getVariantStyle()} ${getLineStyle(index)}`}
          />
        ))}
      </div>
    );
  }

  // 単一要素
  return (
    <div
      {...a11yProps}
      className={`${baseStyle} ${getVariantStyle()} ${className ?? ''}`}
      style={{
        width: formatSize(width),
        height:
          formatSize(height) ||
          (variant === 'circle' ? formatSize(width) : '16px'),
      }}
    />
  );
};

/**
 * テキストスケルトンプリセット
 */
export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <Skeleton variant="text" lines={lines} width={200} />
);

/**
 * アバタースケルトンプリセット
 */
export const SkeletonAvatar = () => (
  // biome-ignore lint/a11y/useSemanticElements: divにrole="status"はローディング表示に適切
  <div
    role="status"
    aria-busy="true"
    aria-label="読み込み中"
    className={styles.skeleton_avatarContainer}
  >
    <Skeleton variant="circle" width={48} height={48} withA11y={false} />
    <div className={styles.skeleton_avatarTextContainer}>
      <Skeleton width={120} height={14} withA11y={false} />
      <Skeleton width={80} height={12} withA11y={false} />
    </div>
  </div>
);

/**
 * カードスケルトンプリセット
 */
export const SkeletonCard = () => (
  // biome-ignore lint/a11y/useSemanticElements: divにrole="status"はローディング表示に適切
  <div
    role="status"
    aria-busy="true"
    aria-label="読み込み中"
    className={styles.skeleton_cardContainer}
  >
    <Skeleton variant="rectangle" width="100%" height={120} withA11y={false} />
    <div className={styles.skeleton_cardContent}>
      <Skeleton width={160} height={18} withA11y={false} />
      <div className={styles.skeleton_cardMeta}>
        <Skeleton width={60} height={14} withA11y={false} />
        <Skeleton width={60} height={14} withA11y={false} />
      </div>
      <div className={styles.skeleton_cardTags}>
        <Skeleton width={48} height={20} withA11y={false} />
        <Skeleton width={48} height={20} withA11y={false} />
      </div>
    </div>
  </div>
);

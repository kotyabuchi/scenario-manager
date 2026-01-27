import * as styles from './styles';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

export type BadgeProps = {
  /**
   * バリアント
   * @default 'neutral'
   */
  variant?: BadgeVariant;

  /**
   * ドットを表示するか
   * @default true
   */
  showDot?: boolean;

  /**
   * 子要素（テキスト）
   */
  children: React.ReactNode;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * バッジコンポーネント
 *
 * ステータスを視覚的に表示する。
 *
 * @example
 * // 成功ステータス
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * // ドットなし
 * <Badge variant="warning" showDot={false}>Pending</Badge>
 */
export const Badge = ({
  variant = 'neutral',
  showDot = true,
  children,
  className,
}: BadgeProps) => {
  return (
    <div
      data-testid="badge"
      data-variant={variant}
      className={`${styles.badge({ variant })} ${className ?? ''}`}
    >
      {showDot && (
        <div data-testid="badge-dot" className={styles.badgeDot({ variant })} />
      )}
      <span className={styles.badgeText({ variant })}>{children}</span>
    </div>
  );
};

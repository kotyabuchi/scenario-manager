import { Pill, type PillTone } from '../Pill';

export type BadgeVariant =
  | 'success'
  | 'recruiting'
  | 'warning'
  | 'error'
  | 'neutral';

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

const toneByVariant: Record<BadgeVariant, PillTone> = {
  success: 'green',
  recruiting: 'pink',
  warning: 'orange',
  error: 'red',
  neutral: 'gray',
};

/**
 * バッジコンポーネント
 *
 * ステータスを視覚的に表示する静的ラベル。共有基盤の {@link Pill} を
 * 「静的・rounded・ドット付き」プリセットで使う薄いラッパー。
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
    <Pill
      tone={toneByVariant[variant]}
      variant="subtle"
      shape="pill"
      size="sm"
      dot={showDot}
      className={className}
      data-testid="badge"
    >
      {children}
    </Pill>
  );
};

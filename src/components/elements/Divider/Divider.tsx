import * as styles from './styles';

export type DividerProps = {
  /**
   * 幅（親=最大幅に対する割合 %）。1〜100。
   * 未指定（または 100）でフル幅。部分幅のときは中央寄せ。
   * @default 100
   */
  width?: number;
  /** 追加のクラス名 */
  className?: string;
};

/**
 * Divider - 区切り線（`<hr>`）
 *
 * 既定は親幅いっぱい。`width` に % を渡すと、親幅に対するその割合の幅になる。
 *
 * @example
 * <Divider />            // フル幅
 * <Divider width={50} /> // 親幅の50%（中央寄せ）
 */
export const Divider = ({ width = 100, className }: DividerProps) => {
  const clamped = Math.min(100, Math.max(0, width));

  // 幅は親に対する動的な割合のため、トークン化できずインラインで指定する。
  // 100% のときはクラス側の full をそのまま使う。
  const style =
    clamped >= 100
      ? undefined
      : ({ width: `${clamped}%` } as React.CSSProperties);

  return (
    <hr className={`${styles.divider} ${className ?? ''}`} style={style} />
  );
};

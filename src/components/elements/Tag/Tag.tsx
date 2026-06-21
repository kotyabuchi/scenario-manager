import { Pill, type PillSize } from '../Pill';

import { deriveTagColors } from '@/lib/tagColor';

export type TagProps = {
  /** タグ名 */
  label: string;
  /**
   * 基準色（OKLCH 文字列。`tags.color` の値）。
   * null / 不正値の場合はグレーにフォールバックする。
   */
  color?: string | null;
  /** サイズ @default 'sm' */
  size?: PillSize;
  /** 追加クラス名 */
  className?: string;
};

/**
 * タグコンポーネント（DB管理の動的カラー対応）
 *
 * `color`（OKLCH 文字列）から淡い背景・濃い文字を導出して表示する静的タグ。
 * 共有基盤 {@link Pill} の `tone="custom"` を CSS 変数経由で使う薄いラッパー。
 *
 * @example
 * <Tag label="ホラー" color="oklch(0.65 0.18 20)" />
 *
 * @example
 * // 色未設定はグレー
 * <Tag label="未分類" />
 */
export const Tag = ({ label, color, size = 'sm', className }: TagProps) => {
  const colors = deriveTagColors(color);

  if (colors === null) {
    return (
      <Pill tone="gray" shape="pill" size={size} className={className}>
        {label}
      </Pill>
    );
  }

  const style = {
    '--pill-bg': colors.bg,
    '--pill-text': colors.text,
  } as React.CSSProperties;

  return (
    <Pill
      tone="custom"
      shape="pill"
      size={size}
      style={style}
      className={className}
    >
      {label}
    </Pill>
  );
};

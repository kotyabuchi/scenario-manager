import { X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

export type PillTone = 'gray' | 'green' | 'pink' | 'orange' | 'red' | 'purple';
export type PillVariant = 'subtle' | 'outline';
export type PillShape = 'rounded' | 'pill';
export type PillSize = 'sm' | 'md' | 'lg';

export type PillProps = {
  /** ラベル本文 */
  children: React.ReactNode;
  /** 色（状態・カテゴリ） @default 'gray' */
  tone?: PillTone;
  /** 塗り @default 'subtle' */
  variant?: PillVariant;
  /** 形状 @default 'rounded' */
  shape?: PillShape;
  /** サイズ @default 'md' */
  size?: PillSize;
  /** ステータスドットを表示するか @default false */
  dot?: boolean;
  /**
   * 選択状態。指定すると操作可能（button）になり aria-pressed を付与する。
   */
  selected?: boolean;
  /** クリックハンドラ。指定すると操作可能（button）になる。 */
  onClick?: (() => void) | undefined;
  /** 削除ボタンを表示するか @default false */
  removable?: boolean;
  /** 削除ハンドラ */
  onRemove?: (() => void) | undefined;
  /**
   * 削除ボタンの aria-label。
   * 未指定かつ children が文字列の場合は `${children}を削除` を自動生成する。
   */
  removeLabel?: string | undefined;
  /** 無効（操作可能時のみ有効） @default false */
  disabled?: boolean;
  /** 追加クラス名 */
  className?: string | undefined;
  /** テスト・識別用 */
  'data-testid'?: string | undefined;
};

const removeIconSize = (size: PillSize) =>
  size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

/**
 * Pill - Badge / Chip の共有基盤プリミティブ
 *
 * `onClick` または `selected` が指定された場合は操作可能な `<button>`、
 * それ以外は静的な `<span>` として描画する（ポリモーフィック）。
 *
 * @example
 * // 静的なステータス表示（Badge 相当）
 * <Pill tone="pink" dot>募集中</Pill>
 *
 * @example
 * // 選択可能なタグ（Chip 相当）
 * <Pill shape="pill" selected={selected} onClick={toggle}>ホラー</Pill>
 */
export const Pill = ({
  children,
  tone = 'gray',
  variant = 'subtle',
  shape = 'rounded',
  size = 'md',
  dot = false,
  selected,
  onClick,
  removable = false,
  onRemove,
  removeLabel,
  disabled = false,
  className,
  'data-testid': dataTestId,
}: PillProps) => {
  const interactive = onClick !== undefined || selected !== undefined;

  const resolvedRemoveLabel =
    removeLabel ??
    (typeof children === 'string' ? `${children}を削除` : '削除');

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove?.();
  };

  const content = (
    <>
      {dot && (
        <span data-testid="pill-dot" className={styles.pillDot({ tone })} />
      )}
      <span>{children}</span>
      {removable && (
        <X
          size={removeIconSize(size)}
          onClick={handleRemove}
          aria-label={resolvedRemoveLabel}
          className={styles.pillRemove}
        />
      )}
    </>
  );

  const classNames = `${styles.pill({ tone, variant, shape, size, interactive, disabled })} ${className ?? ''}`;

  if (interactive) {
    return (
      <button
        type="button"
        className={classNames}
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={selected}
        data-testid={dataTestId}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classNames} data-testid={dataTestId}>
      {content}
    </span>
  );
};

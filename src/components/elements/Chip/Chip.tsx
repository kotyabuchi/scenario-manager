import { X } from 'lucide-react';

import * as styles from './styles';

export type ChipProps = {
  /**
   * チップのラベル
   */
  label: string;

  /**
   * 選択状態
   */
  selected?: boolean;

  /**
   * サイズ
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * クリック時のハンドラ
   */
  onClick?: () => void;

  /**
   * 削除ボタンを表示するか
   */
  removable?: boolean;

  /**
   * 削除時のハンドラ
   */
  onRemove?: () => void;

  /**
   * 無効化
   */
  disabled?: boolean;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * チップコンポーネント
 *
 * 選択可能なタグ、フィルタなどに使用する。
 * デザインシステムに準拠したボーダーレス、影ベースのデザイン。
 *
 * @example
 * // 基本的な使い方
 * <Chip label="CoC7版" selected onClick={() => {}} />
 *
 * @example
 * // 削除可能なチップ
 * <Chip label="ホラー" removable onRemove={() => {}} />
 */
export const Chip = ({
  label,
  selected = false,
  size = 'md',
  onClick,
  removable = false,
  onRemove,
  disabled = false,
  className,
}: ChipProps) => {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${styles.chip({ selected, size })} ${className ?? ''}`}
      aria-pressed={selected}
    >
      <span>{label}</span>
      {removable && (
        <X
          size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14}
          onClick={handleRemove}
          aria-label={`${label}を削除`}
        />
      )}
    </button>
  );
};

import { Pill } from '../Pill';

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
 * 選択可能なタグ、フィルタなどに使用する。共有基盤の {@link Pill} を
 * 「操作可能・pill 形状」プリセットで使う薄いラッパー。
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
  return (
    <Pill
      tone="green"
      variant={selected ? 'subtle' : 'outline'}
      shape="pill"
      size={size}
      selected={selected}
      onClick={onClick}
      removable={removable}
      onRemove={onRemove}
      disabled={disabled}
      className={className}
    >
      {label}
    </Pill>
  );
};

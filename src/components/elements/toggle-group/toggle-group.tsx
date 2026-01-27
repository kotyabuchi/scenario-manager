'use client';

import { ToggleGroup as ArkToggleGroup } from '@ark-ui/react/toggle-group';

import * as styles from './styles';

export type ToggleItem = {
  /**
   * 値（識別子）
   */
  value: string;

  /**
   * アイコン
   */
  icon: React.ReactNode;

  /**
   * ラベル（アクセシビリティ用）
   */
  label?: string;
};

export type ToggleGroupProps = {
  /**
   * 選択中の値（制御モード）
   */
  value?: string[];

  /**
   * 初期選択値（非制御モード）
   */
  defaultValue?: string[];

  /**
   * 値変更時のコールバック
   */
  onValueChange?: (details: { value: string[] }) => void;

  /**
   * 複数選択可能か
   * @default false
   */
  multiple?: boolean;

  /**
   * 無効状態
   * @default false
   */
  disabled?: boolean;

  /**
   * トグルアイテムの配列
   */
  items: ToggleItem[];

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * トグルグループコンポーネント
 *
 * 複数のオプションから選択する。
 *
 * @example
 * <ToggleGroup
 *   defaultValue={['menu']}
 *   items={[
 *     { value: 'menu', icon: <Menu size={20} />, label: 'メニュー表示' },
 *     { value: 'list', icon: <List size={20} />, label: 'リスト表示' },
 *   ]}
 * />
 */
export const ToggleGroup = ({
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  disabled = false,
  items,
  className,
}: ToggleGroupProps) => {
  return (
    <ArkToggleGroup.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      multiple={multiple}
      disabled={disabled}
      className={`${styles.toggleGroupRoot} ${className ?? ''}`}
    >
      {items.map((item) => (
        <ArkToggleGroup.Item
          key={item.value}
          value={item.value}
          aria-label={item.label ?? item.value}
          className={styles.toggleGroupItem}
        >
          {item.icon}
        </ArkToggleGroup.Item>
      ))}
    </ArkToggleGroup.Root>
  );
};

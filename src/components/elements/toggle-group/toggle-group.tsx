'use client';

import { ToggleGroup as ArkToggleGroup } from '@ark-ui/react/toggle-group';

import * as styles from './styles';

export type ToggleItem = {
  /**
   * 値（識別子）
   */
  value: string;

  /**
   * 表示アイテム
   */
  item: React.ReactNode;

  /**
   * ラベル（アクセシビリティ用）
   */
  label?: string;
};

export type ToggleGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (details: { value: string }) => void;
  multiple?: false;
  disabled?: boolean;
  items: ToggleItem[];
  className?: string;
};

export type MultipleToggleGroupProps = {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (details: { value: string[] }) => void;
  multiple: true;
  disabled?: boolean;
  items: ToggleItem[];
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
  multiple,
  disabled = false,
  items,
  className,
}: ToggleGroupProps | MultipleToggleGroupProps) => {
  return (
    <ArkToggleGroup.Root
      value={value ? (multiple ? value : [value]) : undefined}
      defaultValue={
        defaultValue ? (multiple ? defaultValue : [defaultValue]) : undefined
      }
      onValueChange={(details) => {
        if (onValueChange) {
          if (multiple) {
            onValueChange({ value: details.value });
          } else {
            onValueChange({ value: details.value[0] as string });
          }
        }
      }}
      multiple={multiple}
      disabled={disabled}
      style={{ minWidth: items.length * 40 + 8 }}
      className={`${styles.toggleGroupRoot} ${className ?? ''}`}
    >
      {items.map((item) => (
        <ArkToggleGroup.Item
          key={item.value}
          value={item.value}
          aria-label={item.label ?? item.value}
          className={styles.toggleGroupItem}
        >
          {item.item}
        </ArkToggleGroup.Item>
      ))}
    </ArkToggleGroup.Root>
  );
};

'use client';

import {
  RadioGroup as ArkRadioGroup,
  type RadioGroupRootProps,
  type RadioGroupValueChangeDetails,
} from '@ark-ui/react/radio-group';

import * as styles from './styles';

type RadioGroupItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

type RadioGroupProps = {
  /** 選択肢リスト */
  items: RadioGroupItem[];
  /** 選択中の値 */
  value?: string;
  /** 値変更時のコールバック */
  onValueChange?: (details: RadioGroupValueChangeDetails) => void;
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素の名前 */
  name?: string;
  /** デフォルト値 */
  defaultValue?: string;
  /** 横方向に配置 */
  orientation?: 'horizontal' | 'vertical';
} & Omit<RadioGroupRootProps, 'value' | 'onValueChange'>;

/**
 * ラジオグループコンポーネント
 *
 * Ark UI RadioGroupをベースに、シナリオ登録画面のチップ風デザインを適用
 *
 * @example
 * const items = [
 *   { label: '公開', value: 'public' },
 *   { label: '非公開', value: 'private' },
 * ];
 *
 * <RadioGroup
 *   items={items}
 *   value={value}
 *   onValueChange={(details) => setValue(details.value)}
 *   name="visibility"
 * />
 */
export const RadioGroup = ({
  items,
  value,
  onValueChange,
  disabled,
  name,
  defaultValue,
  orientation = 'horizontal',
  ...rest
}: RadioGroupProps) => {
  return (
    <ArkRadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      defaultValue={defaultValue}
      orientation={orientation}
      className={styles.radioGroup_root}
      {...rest}
    >
      <div className={styles.radioGroup_items}>
        {items.map((item) => (
          <ArkRadioGroup.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={styles.radioGroup_item}
          >
            <ArkRadioGroup.ItemControl
              className={styles.radioGroup_itemControl}
            />
            <ArkRadioGroup.ItemText className={styles.radioGroup_itemText}>
              {item.label}
            </ArkRadioGroup.ItemText>
            <ArkRadioGroup.ItemHiddenInput />
          </ArkRadioGroup.Item>
        ))}
      </div>
    </ArkRadioGroup.Root>
  );
};

export type { RadioGroupProps, RadioGroupItem, RadioGroupValueChangeDetails };

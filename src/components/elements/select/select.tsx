'use client';

import { Portal } from '@ark-ui/react/portal';
import {
  Select as ArkSelect,
  createListCollection,
  type SelectRootProps,
  type SelectValueChangeDetails,
} from '@ark-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

import * as styles from './styles';

type SelectItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectVariant = 'form' | 'minimal';

type SelectProps = {
  /** 選択肢リスト */
  items: SelectItem[];
  /** 選択中の値（配列形式） */
  value?: string[];
  /** 値変更時のコールバック */
  onValueChange?: (details: SelectValueChangeDetails<SelectItem>) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素の名前 */
  name?: string;
  /** 複数選択を許可 */
  multiple?: boolean;
  /** スタイルバリアント: form（灰色背景）/ minimal（白背景） */
  variant?: SelectVariant;
} & Omit<
  SelectRootProps<SelectItem>,
  'collection' | 'value' | 'onValueChange' | 'multiple'
>;

/**
 * セレクトコンポーネント
 *
 * Ark UI Selectをベースに、プロジェクトのデザインシステムに合わせてスタイリング
 *
 * @example
 * const items = [
 *   { label: 'React', value: 'react' },
 *   { label: 'Vue', value: 'vue' },
 * ];
 *
 * <Select
 *   items={items}
 *   value={value}
 *   onValueChange={(details) => setValue(details.value)}
 *   placeholder="フレームワークを選択"
 * />
 */
export const Select = ({
  items,
  value,
  onValueChange,
  placeholder = '選択してください',
  disabled,
  name,
  multiple = false,
  variant = 'form',
  ...rest
}: SelectProps) => {
  const collection = createListCollection({ items });

  return (
    <ArkSelect.Root
      collection={collection}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      multiple={multiple}
      className={styles.select_root}
      {...rest}
    >
      <ArkSelect.HiddenSelect />
      <ArkSelect.Control>
        <ArkSelect.Trigger className={styles.select_trigger({ variant })}>
          <ArkSelect.ValueText placeholder={placeholder} />
          <ArkSelect.Indicator className={styles.select_icon}>
            <ChevronDown size={16} />
          </ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal>
        <ArkSelect.Positioner className={styles.select_positioner}>
          <ArkSelect.Content className={styles.select_content}>
            {collection.items.map((item) => (
              <ArkSelect.Item
                key={item.value}
                item={item}
                className={styles.select_item}
              >
                <ArkSelect.ItemText>{item.label}</ArkSelect.ItemText>
                <ArkSelect.ItemIndicator
                  className={styles.select_itemIndicator}
                >
                  <Check size={16} />
                </ArkSelect.ItemIndicator>
              </ArkSelect.Item>
            ))}
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
    </ArkSelect.Root>
  );
};

export { createListCollection };
export type {
  SelectProps,
  SelectItem,
  SelectValueChangeDetails,
  SelectVariant,
};

'use client';

import {
  Combobox as ArkCombobox,
  type ComboboxInputValueChangeDetails,
  type ComboboxRootProps,
  type ComboboxValueChangeDetails,
  useListCollection,
} from '@ark-ui/react/combobox';
import { useFilter } from '@ark-ui/react/locale';
import { Portal } from '@ark-ui/react/portal';
import { Check, ChevronDown, X } from 'lucide-react';

import * as styles from './styles';

type ComboboxItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

type ComboboxProps = {
  /** 選択肢リスト */
  items: ComboboxItem[];
  /** 選択中の値（配列形式） */
  value?: string[];
  /** 値変更時のコールバック */
  onValueChange?: (details: ComboboxValueChangeDetails<ComboboxItem>) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素の名前 */
  name?: string;
  /** 複数選択を許可 */
  multiple?: boolean;
  /** 検索結果なし時のテキスト */
  noResultsText?: string;
  /** 入力要素のID */
  id?: string;
} & Omit<
  ComboboxRootProps<ComboboxItem>,
  'collection' | 'value' | 'onValueChange' | 'multiple'
>;

/**
 * コンボボックスコンポーネント（検索可能なセレクト）
 *
 * Ark UI Comboboxをベースに、プロジェクトのデザインシステムに合わせてスタイリング
 *
 * @example
 * const items = [
 *   { label: 'React', value: 'react' },
 *   { label: 'Vue', value: 'vue' },
 * ];
 *
 * <Combobox
 *   items={items}
 *   value={value}
 *   onValueChange={(details) => setValue(details.value)}
 *   placeholder="フレームワークを検索"
 * />
 */
export const Combobox = ({
  items,
  value,
  onValueChange,
  placeholder = '検索してください',
  disabled,
  name,
  multiple = false,
  noResultsText = '該当する項目がありません',
  id,
  ...rest
}: ComboboxProps) => {
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection, filter } = useListCollection({
    initialItems: items,
    filter: contains,
  });

  const handleInputChange = (details: ComboboxInputValueChangeDetails) => {
    filter(details.inputValue);
  };

  return (
    <ArkCombobox.Root
      collection={collection}
      value={value}
      onValueChange={onValueChange}
      onInputValueChange={handleInputChange}
      disabled={disabled}
      name={name}
      multiple={multiple}
      className={styles.combobox_root}
      openOnClick
      {...rest}
    >
      <ArkCombobox.Control className={styles.combobox_control}>
        <ArkCombobox.Input
          id={id}
          placeholder={placeholder}
          className={styles.combobox_input}
        />
        <ArkCombobox.ClearTrigger className={styles.combobox_clearTrigger}>
          <X size={16} />
        </ArkCombobox.ClearTrigger>
        <ArkCombobox.Trigger className={styles.combobox_trigger}>
          <ChevronDown size={16} />
        </ArkCombobox.Trigger>
      </ArkCombobox.Control>
      <Portal>
        <ArkCombobox.Positioner className={styles.combobox_positioner}>
          <ArkCombobox.Content className={styles.combobox_content}>
            {collection.items.length === 0 ? (
              <div className={styles.combobox_noResults}>{noResultsText}</div>
            ) : (
              collection.items.map((item) => (
                <ArkCombobox.Item
                  key={item.value}
                  item={item}
                  className={styles.combobox_item}
                >
                  <ArkCombobox.ItemText>{item.label}</ArkCombobox.ItemText>
                  <ArkCombobox.ItemIndicator
                    className={styles.combobox_itemIndicator}
                  >
                    <Check size={16} />
                  </ArkCombobox.ItemIndicator>
                </ArkCombobox.Item>
              ))
            )}
          </ArkCombobox.Content>
        </ArkCombobox.Positioner>
      </Portal>
    </ArkCombobox.Root>
  );
};

export type {
  ComboboxProps,
  ComboboxItem,
  ComboboxValueChangeDetails,
  ComboboxInputValueChangeDetails,
};

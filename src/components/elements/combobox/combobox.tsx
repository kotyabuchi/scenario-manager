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
import { CaretDown, Check, X } from '@phosphor-icons/react/ssr';

import { noResultsStyle } from './styles';

import { createStyleContext } from '@/lib/create-style-context';
import { type ComboboxVariantProps, combobox } from '@/styled-system/recipes';

import type { ComponentPropsWithoutRef } from 'react';

const { withProvider, withContext } = createStyleContext(combobox);

// Styled components
const Root = withProvider<
  HTMLDivElement,
  ComboboxRootProps<ComboboxItem> & ComboboxVariantProps
>(ArkCombobox.Root, 'root');

const Control = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.Control>
>(ArkCombobox.Control, 'control');

const Input = withContext<
  HTMLInputElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.Input>
>(ArkCombobox.Input, 'input');

const Trigger = withContext<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.Trigger>
>(ArkCombobox.Trigger, 'trigger');

const ClearTrigger = withContext<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.ClearTrigger>
>(ArkCombobox.ClearTrigger, 'clearTrigger');

const Positioner = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.Positioner>
>(ArkCombobox.Positioner, 'positioner');

const Content = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.Content>
>(ArkCombobox.Content, 'content');

const Item = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.Item>
>(ArkCombobox.Item, 'item');

const ItemText = withContext<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.ItemText>
>(ArkCombobox.ItemText, 'itemText');

const ItemIndicator = withContext<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof ArkCombobox.ItemIndicator>
>(ArkCombobox.ItemIndicator, 'itemIndicator');

type ComboboxItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

type ComboboxVariant = 'form' | 'minimal';

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
  /** スタイルバリアント: form（灰色背景）/ minimal（白背景） */
  variant?: ComboboxVariant;
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
  variant = 'form',
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
    <Root
      collection={collection}
      value={value}
      onValueChange={onValueChange}
      onInputValueChange={handleInputChange}
      disabled={disabled}
      name={name}
      multiple={multiple}
      openOnClick
      variant={variant}
      {...rest}
    >
      <Control>
        <Input id={id} placeholder={placeholder} />
        <ClearTrigger>
          <X size={16} />
        </ClearTrigger>
        <Trigger>
          <CaretDown size={16} />
        </Trigger>
      </Control>
      <Portal>
        <Positioner>
          <Content>
            {collection.items.length === 0 ? (
              <div className={noResultsStyle}>{noResultsText}</div>
            ) : (
              collection.items.map((item) => (
                <Item key={item.value} item={item}>
                  <ItemText>{item.label}</ItemText>
                  <ItemIndicator>
                    <Check size={16} />
                  </ItemIndicator>
                </Item>
              ))
            )}
          </Content>
        </Positioner>
      </Portal>
    </Root>
  );
};

export type {
  ComboboxProps,
  ComboboxItem,
  ComboboxValueChangeDetails,
  ComboboxInputValueChangeDetails,
  ComboboxVariant,
};

'use client';

import { Portal } from '@ark-ui/react/portal';
import {
  Select as ArkSelect,
  createListCollection,
  type SelectRootProps,
  type SelectValueChangeDetails,
} from '@ark-ui/react/select';
import { CaretDown, Check } from '@phosphor-icons/react/ssr';

import { createStyleContext } from '@/lib/create-style-context';
import { type SelectVariantProps, select } from '@/styled-system/recipes';

import type { ComponentPropsWithoutRef } from 'react';

const { withProvider, withContext } = createStyleContext(select);

// Styled components
const Root = withProvider<
  HTMLDivElement,
  SelectRootProps<SelectItem> & SelectVariantProps
>(ArkSelect.Root, 'root');

const Trigger = withContext<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof ArkSelect.Trigger>
>(ArkSelect.Trigger, 'trigger');

const Indicator = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkSelect.Indicator>
>(ArkSelect.Indicator, 'indicator');

const Positioner = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkSelect.Positioner>
>(ArkSelect.Positioner, 'positioner');

const Content = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkSelect.Content>
>(ArkSelect.Content, 'content');

const Item = withContext<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ArkSelect.Item>
>(ArkSelect.Item, 'item');

const ItemText = withContext<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof ArkSelect.ItemText>
>(ArkSelect.ItemText, 'itemText');

const ItemIndicator = withContext<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof ArkSelect.ItemIndicator>
>(ArkSelect.ItemIndicator, 'itemIndicator');

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
  /** トリガーボタンのアクセシブル名 */
  'aria-label'?: string;
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
  'aria-label': ariaLabel,
  ...rest
}: SelectProps) => {
  const collection = createListCollection({ items });

  return (
    <Root
      collection={collection}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      multiple={multiple}
      variant={variant}
      {...rest}
    >
      <ArkSelect.HiddenSelect />
      <ArkSelect.Control>
        <Trigger aria-label={ariaLabel}>
          <ArkSelect.ValueText placeholder={placeholder} />
          <Indicator>
            <CaretDown size={16} />
          </Indicator>
        </Trigger>
      </ArkSelect.Control>
      <Portal>
        <Positioner>
          <Content>
            {collection.items.map((item) => (
              <Item key={item.value} item={item}>
                <ItemText>{item.label}</ItemText>
                <ItemIndicator>
                  <Check size={16} />
                </ItemIndicator>
              </Item>
            ))}
          </Content>
        </Positioner>
      </Portal>
    </Root>
  );
};

export { createListCollection };
export type {
  SelectProps,
  SelectItem,
  SelectValueChangeDetails,
  SelectVariant,
};

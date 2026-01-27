import { useState } from 'react';
import { LayoutGrid, List, Menu, Table } from 'lucide-react';

import { ToggleGroup } from './toggle-group';

import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';
import type { ToggleItem } from './toggle-group';

const meta = {
  title: 'Elements/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultItems: ToggleItem[] = [
  { value: 'menu', icon: <Menu size={20} />, label: 'メニュー表示' },
  { value: 'list', icon: <List size={20} />, label: 'リスト表示' },
  { value: 'grid', icon: <LayoutGrid size={20} />, label: 'グリッド表示' },
  { value: 'table', icon: <Table size={20} />, label: 'テーブル表示' },
];

/**
 * デフォルト（単一選択）
 */
export const Default: Story = {
  args: {
    items: defaultItems,
    defaultValue: ['menu'],
  },
};

/**
 * 複数選択
 */
export const Multiple: Story = {
  args: {
    items: defaultItems,
    defaultValue: ['menu', 'list'],
    multiple: true,
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    items: defaultItems,
    defaultValue: ['menu'],
    disabled: true,
  },
};

/**
 * 選択なし
 */
export const NoSelection: Story = {
  args: {
    items: defaultItems,
    defaultValue: [],
  },
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  args: {
    items: defaultItems,
  },
  render: () => {
    const [value, setValue] = useState(['menu']);
    return (
      <div>
        <ToggleGroup
          value={value}
          onValueChange={(details) => setValue(details.value)}
          items={defaultItems}
        />
        <p className={css({ mt: '16px', fontSize: '14px', color: '#6B7280' })}>
          選択中: {value.join(', ') || 'なし'}
        </p>
      </div>
    );
  },
};

/**
 * 複数選択インタラクティブ
 */
export const MultipleInteractive: Story = {
  args: {
    items: defaultItems,
    multiple: true,
  },
  render: () => {
    const [value, setValue] = useState(['menu']);
    return (
      <div>
        <ToggleGroup
          value={value}
          onValueChange={(details) => setValue(details.value)}
          items={defaultItems}
          multiple
        />
        <p className={css({ mt: '16px', fontSize: '14px', color: '#6B7280' })}>
          選択中: {value.join(', ') || 'なし'}
        </p>
      </div>
    );
  },
};

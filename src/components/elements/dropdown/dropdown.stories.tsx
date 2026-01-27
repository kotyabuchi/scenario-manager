import { useState } from 'react';

import { Dropdown } from './dropdown';

import type { Meta, StoryObj } from '@storybook/react';
import type { DropdownItem } from './dropdown';

const meta = {
  title: 'Elements/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
      description: '表示位置',
    },
  },
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

const sortItems: DropdownItem[] = [
  { value: 'newest', label: '新着順' },
  { value: 'rating', label: '高評価順' },
  { value: 'playtime', label: 'プレイ時間順' },
  { value: 'players', label: '人数順' },
];

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    items: sortItems,
    value: 'newest',
  },
};

/**
 * 選択なし
 */
export const NoSelection: Story = {
  args: {
    items: sortItems,
  },
};

/**
 * 無効なアイテムあり
 */
export const WithDisabledItem: Story = {
  args: {
    items: [
      { value: 'newest', label: '新着順' },
      { value: 'rating', label: '高評価順' },
      { value: 'playtime', label: 'プレイ時間順', disabled: true },
      { value: 'players', label: '人数順' },
    ],
    value: 'newest',
  },
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  args: {
    items: sortItems,
    value: 'newest',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '');
    return <Dropdown {...args} value={value} onValueChange={setValue} />;
  },
};

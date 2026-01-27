import { useState } from 'react';

import { Tabs } from './tabs';

import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';
import type { TabItem } from './tabs';

const meta = {
  title: 'Elements/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultItems: TabItem[] = [
  { value: 'tab1', label: 'タブ1', content: <div>タブ1の内容です</div> },
  { value: 'tab2', label: 'タブ2', content: <div>タブ2の内容です</div> },
  { value: 'tab3', label: 'タブ3', content: <div>タブ3の内容です</div> },
];

/**
 * デフォルトスタイル
 */
export const Default: Story = {
  args: {
    items: defaultItems,
    defaultValue: 'tab1',
  },
};

/**
 * アンダーラインスタイル
 */
export const Underline: Story = {
  args: {
    items: defaultItems,
    defaultValue: 'tab1',
    variant: 'underline',
  },
};

/**
 * 無効タブあり
 */
export const WithDisabled: Story = {
  args: {
    items: [
      { value: 'tab1', label: 'タブ1', content: <div>タブ1の内容です</div> },
      {
        value: 'tab2',
        label: 'タブ2（無効）',
        disabled: true,
        content: <div>タブ2の内容です</div>,
      },
      { value: 'tab3', label: 'タブ3', content: <div>タブ3の内容です</div> },
    ],
    defaultValue: 'tab1',
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
    const [value, setValue] = useState('tab1');
    return (
      <div>
        <Tabs
          value={value}
          onValueChange={(details) => setValue(details.value)}
          items={defaultItems}
        />
        <p className={css({ mt: '16px', fontSize: '14px', color: '#6B7280' })}>
          選択中: {value}
        </p>
      </div>
    );
  },
};

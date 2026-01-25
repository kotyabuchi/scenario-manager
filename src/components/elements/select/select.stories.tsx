import { useState } from 'react';

import { Select } from './select';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'プレースホルダー',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    multiple: {
      control: 'boolean',
      description: '複数選択',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

const systems = [
  { label: 'クトゥルフ神話TRPG 第7版', value: 'coc7' },
  { label: 'ダンジョンズ＆ドラゴンズ 5版', value: 'dnd5e' },
  { label: 'ソード・ワールド2.5', value: 'sw25' },
  { label: 'アリアンロッド2E', value: 'ar2e' },
  { label: 'インセイン', value: 'insane' },
];

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    items: systems,
    placeholder: 'システムを選択',
  },
};

/**
 * 選択済み
 */
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState(['coc7']);
    return (
      <Select
        items={systems}
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="システムを選択"
      />
    );
  },
};

/**
 * 複数選択
 */
export const Multiple: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <Select
        items={systems}
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="システムを選択（複数可）"
        multiple
      />
    );
  },
};

/**
 * 無効な選択肢を含む
 */
export const WithDisabledItems: Story = {
  args: {
    items: [
      { label: '利用可能', value: 'available' },
      { label: '準備中', value: 'preparing', disabled: true },
      { label: '利用可能2', value: 'available2' },
    ],
    placeholder: 'オプションを選択',
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    items: systems,
    placeholder: '選択できません',
    disabled: true,
  },
};

/**
 * 長いリスト
 */
export const LongList: Story = {
  args: {
    items: Array.from({ length: 20 }).map((_, i) => ({
      label: `オプション ${i + 1}`,
      value: `option-${i + 1}`,
    })),
    placeholder: 'オプションを選択',
  },
};

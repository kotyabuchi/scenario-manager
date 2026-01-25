import { useState } from 'react';

import { Combobox } from './combobox';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Combobox> = {
  title: 'UI/Combobox',
  component: Combobox,
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
    noResultsText: {
      control: 'text',
      description: '検索結果なし時のテキスト',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Combobox>;

const tags = [
  { label: 'ホラー', value: 'horror' },
  { label: 'ファンタジー', value: 'fantasy' },
  { label: 'SF', value: 'sf' },
  { label: '現代', value: 'modern' },
  { label: '歴史', value: 'history' },
  { label: 'ミステリー', value: 'mystery' },
  { label: 'コメディ', value: 'comedy' },
  { label: 'アクション', value: 'action' },
];

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    items: tags,
    placeholder: 'タグを検索',
  },
};

/**
 * 選択済み
 */
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState(['horror']);
    return (
      <Combobox
        items={tags}
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="タグを検索"
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
      <Combobox
        items={tags}
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="タグを検索（複数可）"
        multiple
      />
    );
  },
};

/**
 * システム選択
 */
export const SystemSelect: Story = {
  args: {
    items: [
      { label: 'クトゥルフ神話TRPG 第7版', value: 'coc7' },
      { label: 'クトゥルフ神話TRPG 第6版', value: 'coc6' },
      { label: 'ダンジョンズ＆ドラゴンズ 5版', value: 'dnd5e' },
      { label: 'ソード・ワールド2.5', value: 'sw25' },
      { label: 'ソード・ワールド2.0', value: 'sw20' },
      { label: 'アリアンロッド2E', value: 'ar2e' },
      { label: 'インセイン', value: 'insane' },
      { label: 'シノビガミ', value: 'shinobigami' },
    ],
    placeholder: 'システムを検索',
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    items: tags,
    placeholder: '検索できません',
    disabled: true,
  },
};

/**
 * カスタム検索結果なしメッセージ
 */
export const CustomNoResults: Story = {
  args: {
    items: tags,
    placeholder: 'タグを検索',
    noResultsText: '一致するタグが見つかりません',
  },
};

import { Chip } from './Chip';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Chip> = {
  title: 'UI/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'チップのラベル',
    },
    selected: {
      control: 'boolean',
      description: '選択状態',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'サイズ',
    },
    removable: {
      control: 'boolean',
      description: '削除ボタンを表示',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Chip>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    label: 'CoC7版',
    selected: false,
    size: 'md',
  },
};

/**
 * 選択状態
 */
export const Selected: Story = {
  args: {
    label: 'CoC7版',
    selected: true,
    size: 'md',
  },
};

/**
 * サイズバリエーション
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Chip label="Small" size="sm" />
      <Chip label="Medium" size="md" />
      <Chip label="Large" size="lg" />
    </div>
  ),
};

/**
 * 削除可能なチップ
 */
export const Removable: Story = {
  args: {
    label: 'ホラー',
    removable: true,
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    label: '無効なチップ',
    disabled: true,
  },
};

/**
 * 選択可能なチップ一覧
 */
export const SelectableGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Chip label="ホラー" selected />
      <Chip label="ファンタジー" />
      <Chip label="SF" />
      <Chip label="現代" selected />
      <Chip label="歴史" />
    </div>
  ),
};

/**
 * 削除可能なチップ一覧（タグ表示）
 */
export const RemovableGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Chip label="ホラー" removable />
      <Chip label="初心者向け" removable />
      <Chip label="1時間以内" removable />
    </div>
  ),
};

import { Tag } from './Tag';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: { control: 'text' },
    color: { control: 'text' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 色付き（DB の OKLCH 基準色から bg/text を導出）
 */
export const Default: Story = {
  args: {
    label: 'ホラー',
    color: 'oklch(0.65 0.18 20)',
  },
};

/**
 * 色未設定（グレーにフォールバック）
 */
export const NoColor: Story = {
  args: {
    label: '未分類',
    color: null,
  },
};

/**
 * 多色（さまざまな色相で同じ淡色トーン・コントラストになる）
 */
export const Palette: Story = {
  args: { label: 'tag' },
  render: () => (
    <div
      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: 360 }}
    >
      <Tag label="ホラー" color="oklch(0.65 0.18 20)" />
      <Tag label="ファンタジー" color="oklch(0.65 0.15 150)" />
      <Tag label="SF" color="oklch(0.65 0.15 260)" />
      <Tag label="現代" color="oklch(0.65 0.13 300)" />
      <Tag label="和風" color="oklch(0.65 0.14 60)" />
      <Tag label="コメディ" color="oklch(0.7 0.16 100)" />
      <Tag label="シリアス" color="oklch(0.6 0.1 250)" />
      <Tag label="未分類" color={null} />
    </div>
  ),
};

/**
 * サイズ
 */
export const Sizes: Story = {
  args: { label: 'size' },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Tag label="Small" color="oklch(0.65 0.15 260)" size="sm" />
      <Tag label="Medium" color="oklch(0.65 0.15 260)" size="md" />
      <Tag label="Large" color="oklch(0.65 0.15 260)" size="lg" />
    </div>
  ),
};

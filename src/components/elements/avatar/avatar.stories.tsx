import { Avatar } from './avatar';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態（フォールバック表示）
 */
export const Default: Story = {
  args: {},
};

/**
 * 画像あり
 */
export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=user1',
    alt: 'ユーザーアバター',
  },
};

/**
 * フォールバック（画像なし）
 */
export const WithFallback: Story = {
  args: {
    alt: 'ユーザーアバター',
  },
};

/**
 * サイズ: xs（24px）
 */
export const SizeXs: Story = {
  args: {
    size: 'xs',
  },
};

/**
 * サイズ: sm（32px）
 */
export const SizeSm: Story = {
  args: {
    size: 'sm',
  },
};

/**
 * サイズ: md（40px、デフォルト）
 */
export const SizeMd: Story = {
  args: {
    size: 'md',
  },
};

/**
 * サイズ: lg（48px）
 */
export const SizeLg: Story = {
  args: {
    size: 'lg',
  },
};

/**
 * サイズ: xl（64px）
 */
export const SizeXl: Story = {
  args: {
    size: 'xl',
  },
};

/**
 * 全サイズ一覧
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Avatar size="xs" />
      <Avatar size="sm" />
      <Avatar size="md" />
      <Avatar size="lg" />
      <Avatar size="xl" />
    </div>
  ),
};

/**
 * カスタムフォールバック（イニシャル表示）
 */
export const CustomFallback: Story = {
  args: {
    fallback: (
      <span style={{ color: '#059568', fontWeight: 'bold', fontSize: '14px' }}>
        AB
      </span>
    ),
  },
};

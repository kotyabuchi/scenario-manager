import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonText,
} from './skeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（テキスト）
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 16,
  },
};

/**
 * 複数行テキスト
 */
export const TextLines: Story = {
  args: {
    variant: 'text',
    width: 200,
    lines: 3,
  },
};

/**
 * 円形
 */
export const Circle: Story = {
  args: {
    variant: 'circle',
    width: 48,
    height: 48,
  },
};

/**
 * 長方形
 */
export const Rectangle: Story = {
  args: {
    variant: 'rectangle',
    width: 200,
    height: 120,
  },
};

/**
 * アニメーションなし
 */
export const NoAnimation: Story = {
  args: {
    width: 200,
    height: 16,
    animate: false,
  },
};

/**
 * プリセット: テキスト
 */
export const PresetText: Story = {
  args: {
    width: 200,
    lines: 3,
  },
  render: () => <SkeletonText lines={3} />,
};

/**
 * プリセット: アバター
 */
export const PresetAvatar: Story = {
  args: {
    width: 200,
  },
  render: () => <SkeletonAvatar />,
};

/**
 * プリセット: カード
 */
export const PresetCard: Story = {
  args: {
    width: 240,
  },
  render: () => <SkeletonCard />,
};

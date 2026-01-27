import { Badge } from './badge';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'neutral'],
    },
    showDot: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態（neutral）
 */
export const Default: Story = {
  args: {
    children: 'Draft',
  },
};

/**
 * Success（公開中、完了）
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Active',
  },
};

/**
 * Warning（保留中、準備中）
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Pending',
  },
};

/**
 * Error（エラー、中止）
 */
export const ErrorVariant: Story = {
  name: 'Error',
  args: {
    variant: 'error',
    children: 'Error',
  },
};

/**
 * Neutral（下書き、非公開）
 */
export const Neutral: Story = {
  args: {
    variant: 'neutral',
    children: 'Draft',
  },
};

/**
 * ドットなし
 */
export const WithoutDot: Story = {
  args: {
    variant: 'success',
    children: 'Active',
    showDot: false,
  },
};

/**
 * 全バリアント一覧
 */
export const AllVariants: Story = {
  args: {
    children: 'All Variants',
  },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="neutral">Draft</Badge>
    </div>
  ),
};

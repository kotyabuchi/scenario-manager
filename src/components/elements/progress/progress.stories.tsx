import { Progress } from './progress';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
    },
    variant: {
      control: 'select',
      options: ['bar', 'circle'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（バー形式、65%）
 */
export const Default: Story = {
  args: {
    value: 65,
    label: 'Progress',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * 0%
 */
export const Empty: Story = {
  args: {
    value: 0,
    label: 'Progress',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * 100%
 */
export const Complete: Story = {
  args: {
    value: 100,
    label: 'Progress',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * ラベルなし
 */
export const NoLabel: Story = {
  args: {
    value: 50,
    showValue: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * サークル形式
 */
export const Circle: Story = {
  args: {
    value: 65,
    variant: 'circle',
  },
};

/**
 * サークル - サイズバリエーション
 */
export const CircleSizes: Story = {
  args: {
    value: 65,
    variant: 'circle',
  },
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Progress value={65} variant="circle" size="sm" />
      <Progress value={65} variant="circle" size="md" />
      <Progress value={65} variant="circle" size="lg" />
    </div>
  ),
};

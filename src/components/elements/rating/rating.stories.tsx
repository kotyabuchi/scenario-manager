import { useState } from 'react';

import { Rating } from './rating';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Rating',
  component: Rating,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 5 },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Rating>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（3/5）
 */
export const Default: Story = {
  args: {
    value: 3,
  },
};

/**
 * 0（空）
 */
export const Empty: Story = {
  args: {
    value: 0,
  },
};

/**
 * 5（満点）
 */
export const Full: Story = {
  args: {
    value: 5,
  },
};

/**
 * 読み取り専用
 */
export const ReadOnly: Story = {
  args: {
    value: 4,
    readOnly: true,
  },
};

/**
 * サイズバリエーション
 */
export const Sizes: Story = {
  args: {
    value: 3,
    size: 'md',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Rating value={3} size="sm" readOnly />
      <Rating value={3} size="md" readOnly />
      <Rating value={3} size="lg" readOnly />
    </div>
  ),
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  args: {
    value: 0,
  },
  render: () => {
    const [value, setValue] = useState(0);
    return (
      <div>
        <Rating value={value} onValueChange={setValue} />
        <p style={{ marginTop: 8, fontSize: 14, color: '#777E8C' }}>
          選択: {value}つ星
        </p>
      </div>
    );
  },
};

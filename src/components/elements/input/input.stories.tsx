import { Input } from './input';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'サイズバリアント',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'url', 'number', 'password', 'tel'],
      description: '入力タイプ',
    },
    placeholder: {
      control: 'text',
      description: 'プレースホルダー',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    placeholder: 'テキストを入力',
  },
};

/**
 * サイズバリエーション
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium（デフォルト）" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};

/**
 * 入力タイプバリエーション
 */
export const Types: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input type="text" placeholder="テキスト" />
      <Input type="email" placeholder="email@example.com" />
      <Input type="url" placeholder="https://example.com" />
      <Input type="number" placeholder="数値" />
      <Input type="password" placeholder="パスワード" />
      <Input type="tel" placeholder="電話番号" />
    </div>
  ),
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    placeholder: '入力できません',
    disabled: true,
  },
};

/**
 * 値入力済み
 */
export const WithValue: Story = {
  args: {
    defaultValue: '入力済みの値',
  },
};

/**
 * 数値入力（min/max指定）
 */
export const NumberWithRange: Story = {
  args: {
    type: 'number',
    min: 1,
    max: 20,
    placeholder: '1〜20の数値',
  },
};

import { Textarea } from './textarea';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'サイズバリアント',
    },
    placeholder: {
      control: 'text',
      description: 'プレースホルダー',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    rows: {
      control: 'number',
      description: '表示行数',
    },
  },
} satisfies Meta<typeof Textarea>;

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
      <Textarea size="sm" placeholder="Small" />
      <Textarea size="md" placeholder="Medium（デフォルト）" />
      <Textarea size="lg" placeholder="Large" />
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
    defaultValue:
      'これは入力済みのテキストです。\n複数行にわたる長いテキストを入力できます。\nテキストエリアは縦方向にリサイズ可能です。',
  },
};

/**
 * 長文入力用（行数指定）
 */
export const LongText: Story = {
  args: {
    placeholder: '詳細な説明を入力してください...',
    rows: 10,
  },
};

/**
 * 文字数制限付き
 */
export const WithMaxLength: Story = {
  args: {
    placeholder: '最大200文字まで',
    maxLength: 200,
  },
};

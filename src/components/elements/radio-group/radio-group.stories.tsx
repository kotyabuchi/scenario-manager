import { useState } from 'react';

import { RadioGroup } from './radio-group';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: '配置方向',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
  },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

const visibilityItems = [
  { label: '公開', value: 'public' },
  { label: '限定公開', value: 'limited' },
  { label: '非公開', value: 'private' },
];

/**
 * デフォルト（横並び）
 */
export const Default: Story = {
  args: {
    items: visibilityItems,
    defaultValue: 'public',
    name: 'visibility',
  },
};

/**
 * 縦並び
 */
export const Vertical: Story = {
  args: {
    items: visibilityItems,
    defaultValue: 'public',
    orientation: 'vertical',
    name: 'visibility-vertical',
  },
};

/**
 * 制御された状態
 */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('public');
    return (
      <div>
        <RadioGroup
          items={visibilityItems}
          value={value}
          onValueChange={(details) => setValue(details.value ?? 'public')}
          name="visibility-controlled"
        />
        <p style={{ marginTop: '16px', color: '#666' }}>選択中: {value}</p>
      </div>
    );
  },
};

/**
 * 一部無効な選択肢
 */
export const WithDisabledItems: Story = {
  args: {
    items: [
      { label: '通常', value: 'normal' },
      { label: 'プレミアム（準備中）', value: 'premium', disabled: true },
      { label: 'エンタープライズ', value: 'enterprise' },
    ],
    defaultValue: 'normal',
    name: 'plan',
  },
};

/**
 * 全体が無効
 */
export const Disabled: Story = {
  args: {
    items: visibilityItems,
    defaultValue: 'public',
    disabled: true,
    name: 'visibility-disabled',
  },
};

/**
 * 二択
 */
export const Binary: Story = {
  args: {
    items: [
      { label: 'はい', value: 'yes' },
      { label: 'いいえ', value: 'no' },
    ],
    defaultValue: 'yes',
    name: 'confirmation',
  },
};

/**
 * 難易度選択
 */
export const DifficultySelection: Story = {
  args: {
    items: [
      { label: '初心者向け', value: 'beginner' },
      { label: '中級者向け', value: 'intermediate' },
      { label: '上級者向け', value: 'advanced' },
    ],
    defaultValue: 'intermediate',
    name: 'difficulty',
  },
};

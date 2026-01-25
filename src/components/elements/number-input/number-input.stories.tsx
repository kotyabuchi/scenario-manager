import { useState } from 'react';

import { NumberInput } from './number-input';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NumberInput> = {
  title: 'UI/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: 'number',
      description: '最小値',
    },
    max: {
      control: 'number',
      description: '最大値',
    },
    step: {
      control: 'number',
      description: 'ステップ値',
    },
    label: {
      control: 'text',
      description: 'ラベル',
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
};

export default meta;

type Story = StoryObj<typeof NumberInput>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    placeholder: '数値を入力',
  },
};

/**
 * ラベル付き
 */
export const WithLabel: Story = {
  args: {
    label: 'プレイ人数',
    placeholder: '人数',
    min: 1,
    max: 20,
  },
};

/**
 * 範囲制限あり
 */
export const WithRange: Story = {
  args: {
    min: 1,
    max: 10,
    placeholder: '1〜10',
  },
};

/**
 * 制御された状態
 */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('5');
    return (
      <div>
        <NumberInput
          value={value}
          onValueChange={(details) => setValue(details.value)}
          label="数量"
          min={1}
          max={99}
        />
        <p style={{ marginTop: '8px', color: '#666' }}>現在の値: {value}</p>
      </div>
    );
  },
};

/**
 * ステップ指定
 */
export const WithStep: Story = {
  args: {
    label: '価格（100円単位）',
    min: 0,
    max: 10000,
    step: 100,
    placeholder: '価格',
  },
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
 * プレイ時間入力
 */
export const PlaytimeInput: Story = {
  args: {
    label: 'プレイ時間（時間）',
    min: 1,
    max: 24,
    step: 1,
    placeholder: '時間',
  },
};

/**
 * 参加費入力
 */
export const FeeInput: Story = {
  render: () => {
    const [value, setValue] = useState('0');
    return (
      <div>
        <NumberInput
          value={value}
          onValueChange={(details) => setValue(details.value)}
          label="参加費（円）"
          min={0}
          max={100000}
          step={100}
          placeholder="0"
        />
        <p style={{ marginTop: '8px', color: '#666' }}>
          {Number(value) === 0 ? '無料' : `${Number(value).toLocaleString()}円`}
        </p>
      </div>
    );
  },
};

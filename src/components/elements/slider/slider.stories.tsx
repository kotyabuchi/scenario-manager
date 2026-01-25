import { useState } from 'react';

import { Slider } from './slider';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
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
    showValue: {
      control: 'boolean',
      description: '値を表示',
    },
    range: {
      control: 'boolean',
      description: '範囲スライダー',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Slider>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [50],
    label: '音量',
    showValue: true,
  },
};

/**
 * 範囲スライダー
 */
export const Range: Story = {
  render: () => {
    const [value, setValue] = useState([20, 80]);
    return (
      <Slider
        value={value}
        onValueChange={(details) => setValue(details.value)}
        min={0}
        max={100}
        range
        label="価格帯"
        showValue
        formatValue={(v) => `¥${v.toLocaleString()}`}
      />
    );
  },
};

/**
 * プレイ時間スライダー
 */
export const PlaytimeSlider: Story = {
  render: () => {
    const [value, setValue] = useState([1, 4]);
    return (
      <Slider
        value={value}
        onValueChange={(details) => setValue(details.value)}
        min={1}
        max={8}
        step={1}
        range
        label="プレイ時間"
        showValue
        formatValue={(v) => `${v}時間`}
      />
    );
  },
};

/**
 * マーカー付き
 */
export const WithMarkers: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [50],
    label: '進捗',
    showValue: true,
    markers: [
      { value: 0, label: '0%' },
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 75, label: '75%' },
      { value: 100, label: '100%' },
    ],
  },
};

/**
 * カスタムフォーマット
 */
export const CustomFormat: Story = {
  args: {
    min: 1,
    max: 20,
    defaultValue: [4],
    label: 'プレイ人数',
    showValue: true,
    formatValue: (v: number) => `${v}人`,
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [50],
    label: '無効なスライダー',
    showValue: true,
    disabled: true,
  },
};

/**
 * ラベルなし
 */
export const NoLabel: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [30],
  },
};

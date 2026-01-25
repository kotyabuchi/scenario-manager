import { useState } from 'react';

import { DatePicker, parseDate } from './date-picker';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'プレースホルダー',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    selectionMode: {
      control: 'select',
      options: ['single', 'multiple', 'range'],
      description: '選択モード',
    },
    locale: {
      control: 'text',
      description: 'ロケール',
    },
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    placeholder: '日付を選択',
  },
};

/**
 * 初期値あり
 */
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState([parseDate('2024-06-15')]);
    return (
      <DatePicker
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="日付を選択"
      />
    );
  },
};

/**
 * 範囲選択
 */
export const RangeSelection: Story = {
  render: () => {
    const [value, setValue] = useState([
      parseDate('2024-06-01'),
      parseDate('2024-06-15'),
    ]);
    return (
      <DatePicker
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="期間を選択"
        selectionMode="range"
      />
    );
  },
};

/**
 * 複数日選択
 */
export const MultipleSelection: Story = {
  render: () => {
    const [value, setValue] = useState([
      parseDate('2024-06-01'),
      parseDate('2024-06-15'),
      parseDate('2024-06-22'),
    ]);
    return (
      <DatePicker
        value={value}
        onValueChange={(details) => setValue(details.value)}
        placeholder="複数の日付を選択"
        selectionMode="multiple"
      />
    );
  },
};

/**
 * 最小・最大日付制限
 */
export const WithMinMax: Story = {
  args: {
    placeholder: '予約可能日を選択',
    min: parseDate('2024-06-01'),
    max: parseDate('2024-12-31'),
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    placeholder: '選択できません',
    disabled: true,
  },
};

/**
 * 英語ロケール
 */
export const EnglishLocale: Story = {
  args: {
    placeholder: 'Select date',
    locale: 'en-US',
  },
};

/**
 * セッション開催日選択
 */
export const SessionDate: Story = {
  render: () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0] ?? '';
    const minDate = parseDate(todayString);

    return (
      <div>
        <DatePicker placeholder="開催日を選択" min={minDate} />
        <p style={{ marginTop: '8px', color: '#666' }}>
          本日以降の日付を選択できます
        </p>
      </div>
    );
  },
};

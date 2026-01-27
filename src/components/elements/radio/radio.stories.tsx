import { useState } from 'react';

import { Radio } from './radio';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（未選択）
 */
export const Default: Story = {
  args: {
    children: null,
  },
  render: (args) => (
    <Radio {...args}>
      <Radio.Item value="option1">オプション1</Radio.Item>
      <Radio.Item value="option2">オプション2</Radio.Item>
      <Radio.Item value="option3">オプション3</Radio.Item>
    </Radio>
  ),
};

/**
 * 選択済み
 */
export const Selected: Story = {
  args: {
    defaultValue: 'option2',
    children: null,
  },
  render: (args) => (
    <Radio {...args}>
      <Radio.Item value="option1">オプション1</Radio.Item>
      <Radio.Item value="option2">オプション2</Radio.Item>
      <Radio.Item value="option3">オプション3</Radio.Item>
    </Radio>
  ),
};

/**
 * 一部無効
 */
export const WithDisabledItem: Story = {
  args: {
    defaultValue: 'option1',
    children: null,
  },
  render: (args) => (
    <Radio {...args}>
      <Radio.Item value="option1">オプション1</Radio.Item>
      <Radio.Item value="option2">オプション2</Radio.Item>
      <Radio.Item value="option3" disabled>
        オプション3（無効）
      </Radio.Item>
    </Radio>
  ),
};

/**
 * 全体無効
 */
export const Disabled: Story = {
  args: {
    defaultValue: 'option1',
    disabled: true,
    children: null,
  },
  render: (args) => (
    <Radio {...args}>
      <Radio.Item value="option1">オプション1</Radio.Item>
      <Radio.Item value="option2">オプション2</Radio.Item>
      <Radio.Item value="option3">オプション3</Radio.Item>
    </Radio>
  ),
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  args: {
    children: null,
  },
  render: () => {
    const [value, setValue] = useState('option1');
    return (
      <Radio
        value={value}
        onValueChange={(details) => setValue(details.value ?? '')}
      >
        <Radio.Item value="option1">オプション1</Radio.Item>
        <Radio.Item value="option2">オプション2</Radio.Item>
        <Radio.Item value="option3">オプション3</Radio.Item>
      </Radio>
    );
  },
};

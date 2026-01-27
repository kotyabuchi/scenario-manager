import { useState } from 'react';

import { Checkbox } from './checkbox';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト状態
 */
export const Default: Story = {
  args: {},
};

/**
 * チェック済み
 */
export const Checked: Story = {
  args: {
    checked: true,
  },
};

/**
 * 未チェック
 */
export const Unchecked: Story = {
  args: {
    checked: false,
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/**
 * ラベル付き
 */
export const WithLabel: Story = {
  args: {
    children: '利用規約に同意する',
  },
};

/**
 * 制御コンポーネント
 */
export const Controlled: Story = {
  render: () => {
    const [isChecked, setIsChecked] = useState(false);
    return (
      <Checkbox
        checked={isChecked}
        onCheckedChange={(details) => setIsChecked(details.checked as boolean)}
      >
        {isChecked ? 'チェック済み' : '未チェック'}
      </Checkbox>
    );
  },
};

/**
 * フォームでの使用
 */
export const InForm: Story = {
  render: () => (
    <form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Checkbox name="terms" value="agreed">
          利用規約に同意する
        </Checkbox>
        <Checkbox name="newsletter" value="subscribed">
          ニュースレターを受け取る
        </Checkbox>
        <Checkbox name="marketing" value="opted-in" disabled>
          マーケティングメールを受け取る（現在利用不可）
        </Checkbox>
      </div>
    </form>
  ),
};

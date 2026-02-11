import { useState } from 'react';

import { Switch } from './switch';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（オフ）
 */
export const Default: Story = {
  args: {
    children: 'ラベル',
  },
};

/**
 * オン状態
 */
export const On: Story = {
  args: {
    defaultChecked: true,
    children: 'ラベル',
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'ラベル',
  },
};

/**
 * 無効 + オン状態
 */
export const DisabledOn: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
    children: 'ラベル',
  },
};

/**
 * ラベルなし
 */
export const NoLabel: Story = {
  args: {},
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  args: {
    children: '通知を有効にする',
  },
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div>
        <Switch
          checked={checked}
          onCheckedChange={(details) => setChecked(details.checked)}
        >
          通知を有効にする
        </Switch>
        <p style={{ marginTop: 8, fontSize: 14, color: '#777E8C' }}>
          状態: {checked ? 'オン' : 'オフ'}
        </p>
      </div>
    );
  },
};

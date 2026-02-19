import { fn } from '@storybook/test';

import { ScenarioSearchModal } from './ScenarioSearchModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/ScenarioSearchModal',
  component: ScenarioSearchModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onOpenChange: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof ScenarioSearchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * モーダルが開いた初期状態（検索結果なし）
 * 「シナリオ名を入力して検索してください」が表示される
 */
export const Default: Story = {
  args: {
    open: true,
    systems: [
      { systemId: '01HSYSTEM00000000001AA', name: 'クトゥルフ神話TRPG' },
      { systemId: '01HSYSTEM00000000002BB', name: 'ソード・ワールド2.5' },
      { systemId: '01HSYSTEM00000000003CC', name: 'インセイン' },
    ],
  },
};

/**
 * システム一覧なしの状態
 */
export const NoSystems: Story = {
  args: {
    open: true,
    systems: [],
  },
};

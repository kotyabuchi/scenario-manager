import { fn } from '@storybook/test';

import { ScenarioSelectedCard } from './ScenarioSelectedCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/ScenarioSelectedCard',
  component: ScenarioSelectedCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onClear: fn(),
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '480px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScenarioSelectedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * プレイ人数・プレイ時間が範囲指定のシナリオ
 */
export const Default: Story = {
  args: {
    scenario: {
      scenarioId: '01HTESTSCENARIO001AAAA',
      name: '深淵の呼び声',
      systemName: 'クトゥルフ神話TRPG',
      minPlayer: 3,
      maxPlayer: 5,
      minPlaytime: 120,
      maxPlaytime: 180,
    },
  },
};

/**
 * プレイ人数が固定のシナリオ
 */
export const FixedPlayers: Story = {
  args: {
    scenario: {
      scenarioId: '01HTESTSCENARIO002BBBB',
      name: '星辰の彼方へ',
      systemName: 'ソード・ワールド2.5',
      minPlayer: 4,
      maxPlayer: 4,
      minPlaytime: 60,
      maxPlaytime: 60,
    },
  },
};

/**
 * プレイ人数・プレイ時間が未設定のシナリオ
 */
export const Unset: Story = {
  args: {
    scenario: {
      scenarioId: '01HTESTSCENARIO003CCCC',
      name: '長いシナリオ名のテスト：これは非常に長いシナリオ名で、行を折り返して表示される場合の動作を確認するためのものです',
      systemName: 'インセイン',
      minPlayer: null,
      maxPlayer: null,
      minPlaytime: null,
      maxPlaytime: null,
    },
  },
};

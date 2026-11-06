import { SpeedDialFAB } from './SpeedDialFAB';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/SpeedDialFAB',
  component: SpeedDialFAB,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpeedDialFAB>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 認証済みユーザー: 7項目（作成・検索・シェア・フィードバック・サービス情報）
 */
export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
  },
};

/**
 * 未認証ユーザー: 4項目（シナリオ検索、シェア、ログイン、サービス情報）
 */
export const Unauthenticated: Story = {
  args: {
    isAuthenticated: false,
  },
};

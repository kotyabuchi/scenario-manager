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
 * 認証済みユーザー: 5項目（シナリオ登録、セッション募集、シナリオ検索、シェア、フィードバック）
 */
export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
  },
};

/**
 * 未認証ユーザー: 3項目（シナリオ検索、シェア、ログイン）
 */
export const Unauthenticated: Story = {
  args: {
    isAuthenticated: false,
  },
};

import { SessionForm } from './SessionForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/SessionForm',
  component: SessionForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SessionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示状態（空のフォーム）
 */
export const Default: Story = {
  args: {},
};

/**
 * シナリオ選択済み状態
 * 実際のULID形式のIDを使用
 */
export const WithScenario: Story = {
  args: {
    defaultValues: {
      scenarioId: '01HXY2345678901234567890A',
      sessionName: '狂気山脈セッション',
      sessionDescription: '狂気山脈を遊びましょう',
    },
  },
};

/**
 * 全項目入力済み状態
 */
export const Filled: Story = {
  args: {
    defaultValues: {
      sessionName: '週末CoC7版セッション',
      sessionDescription: '週末にCoC7版を遊びませんか？初心者歓迎です！',
      // scenarioIdはセレクトで選択するため、ここでは設定しない（未定状態）
      scheduledAt: '2026-02-01T20:00',
      recruitedPlayerCount: 4,
      tools: 'Discord + ココフォリア',
      isBeginnerFriendly: true,
      visibility: 'PUBLIC',
    },
  },
};

/**
 * 最小構成（必須項目のみ）
 */
export const MinimalRequired: Story = {
  args: {
    defaultValues: {
      sessionName: 'シンプルなセッション',
      sessionDescription: '気軽に遊びましょう',
    },
  },
};

/**
 * フォロワー限定公開
 */
export const FollowersOnly: Story = {
  args: {
    defaultValues: {
      sessionName: '身内向けセッション',
      sessionDescription: 'フォロワー限定で募集します',
      visibility: 'FOLLOWERS_ONLY',
    },
  },
};

/**
 * バリデーションエラー状態
 */
export const WithErrors: Story = {
  args: {
    errors: {
      sessionName: { message: 'セッション名は必須です', type: 'required' },
      sessionDescription: { message: '募集文は必須です', type: 'required' },
    },
  },
};

/**
 * 送信中状態
 */
export const Submitting: Story = {
  args: {
    isSubmitting: true,
    defaultValues: {
      sessionName: 'テストセッション',
      sessionDescription: 'テスト説明',
    },
  },
};

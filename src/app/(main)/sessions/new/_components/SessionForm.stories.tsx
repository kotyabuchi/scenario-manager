import { SessionForm } from './SessionForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/作成フォーム/SessionForm',
  component: SessionForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SessionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSystems = [
  { systemId: '01HSYSTEM00000000001AA', name: 'クトゥルフ神話TRPG' },
  { systemId: '01HSYSTEM00000000002BB', name: 'ソード・ワールド2.5' },
  { systemId: '01HSYSTEM00000000003CC', name: 'インセイン' },
];

/**
 * デフォルト表示状態（空のフォーム）
 */
export const Default: Story = {
  args: {
    systems: mockSystems,
  },
};

/**
 * シナリオ選択済み状態
 * 実際のULID形式のIDを使用
 */
export const WithScenario: Story = {
  args: {
    systems: mockSystems,
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
    systems: mockSystems,
    defaultValues: {
      sessionName: '週末CoC7版セッション',
      sessionDescription: '週末にCoC7版を遊びませんか？初心者歓迎です！',
      scheduleType: 'specify',
      scheduleCandidates: [
        { from: '2026-02-01T20:00', to: '2026-02-01T23:00' },
        { from: '2026-02-08T20:00' },
      ],
      recruitedPlayerCount: 4,
      tools: 'Discord + ココフォリア',
      isBeginnerFriendly: true,
      visibility: 'PUBLIC',
      creatorParticipantType: 'KEEPER',
    },
  },
};

/**
 * 最小構成（必須項目のみ）
 */
export const MinimalRequired: Story = {
  args: {
    systems: mockSystems,
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
    systems: mockSystems,
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
    systems: mockSystems,
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
    systems: mockSystems,
    isSubmitting: true,
    defaultValues: {
      sessionName: 'テストセッション',
      sessionDescription: 'テスト説明',
    },
  },
};

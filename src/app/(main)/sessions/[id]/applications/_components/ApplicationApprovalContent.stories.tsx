import { ApplicationApprovalContent } from './ApplicationApprovalContent';

import type { Meta, StoryObj } from '@storybook/react';
import type { ApplicationWithUser } from '../adapter';

// --- モックデータ ---

/** 基本のモック申請者ファクトリ */
const mockApplication = (
  overrides: Partial<ApplicationWithUser> = {},
): ApplicationWithUser => ({
  sessionId: '01HSESSION0000000000000001',
  userId: `01HUSER${String(Math.random()).slice(2, 16)}`,
  participantType: 'PLAYER',
  participantStatus: 'PENDING',
  applicationMessage: '参加希望です！よろしくお願いします。',
  appliedAt: '2026-02-10T12:00:00Z',
  approvedAt: null,
  user: {
    userId: '',
    userName: 'テストユーザー',
    nickname: '',
    image: '',
    bio: '',
  },
  ...overrides,
});

/** PENDING 申請: ユーザーA */
const pendingApplicationA: ApplicationWithUser = mockApplication({
  userId: '01HUSER0000000000000000001',
  applicationMessage: '初心者ですがぜひ参加させてください！',
  appliedAt: '2026-02-10T10:00:00Z',
  user: {
    userId: '01HUSER0000000000000000001',
    userName: 'yamada_taro',
    nickname: '山田太郎',
    image: null,
    bio: 'TRPGを始めて半年の初心者です。',
  },
});

/** PENDING 申請: ユーザーB */
const pendingApplicationB: ApplicationWithUser = mockApplication({
  userId: '01HUSER0000000000000000002',
  applicationMessage: '友人から誘われました。よろしくお願いします！',
  appliedAt: '2026-02-11T14:30:00Z',
  user: {
    userId: '01HUSER0000000000000000002',
    userName: 'suzuki_hanako',
    nickname: 'スズキハナコ',
    image: null,
    bio: null,
  },
});

/** CONFIRMED 申請: ユーザーC */
const confirmedApplicationC: ApplicationWithUser = mockApplication({
  userId: '01HUSER0000000000000000003',
  participantStatus: 'CONFIRMED',
  applicationMessage: 'いつもお世話になっています！',
  appliedAt: '2026-02-08T09:00:00Z',
  approvedAt: '2026-02-09T11:00:00Z',
  user: {
    userId: '01HUSER0000000000000000003',
    userName: 'tanaka_kenji',
    nickname: '田中ケンジ',
    image: null,
    bio: 'クトゥルフ神話TRPGが得意です。',
  },
});

/** CONFIRMED 申請: ユーザーD */
const confirmedApplicationD: ApplicationWithUser = mockApplication({
  userId: '01HUSER0000000000000000004',
  participantStatus: 'CONFIRMED',
  applicationMessage: null,
  appliedAt: '2026-02-07T16:00:00Z',
  approvedAt: '2026-02-08T10:00:00Z',
  user: {
    userId: '01HUSER0000000000000000004',
    userName: 'ito_sakura',
    nickname: '',
    image: '',
    bio: '',
  },
});

/** 多数のPENDING申請用モックデータ */
const manyPendingApplications: ApplicationWithUser[] = [
  pendingApplicationA,
  pendingApplicationB,
  mockApplication({
    userId: '01HUSER0000000000000000005',
    applicationMessage: 'シナリオのファンです！',
    appliedAt: '2026-02-12T08:00:00Z',
    user: {
      userId: '01HUSER0000000000000000005',
      userName: 'kobayashi_ryo',
      nickname: '小林良',
      image: null,
      bio: null,
    },
  }),
  mockApplication({
    userId: '01HUSER0000000000000000006',
    applicationMessage: '経験者です。何でもこなせます。',
    appliedAt: '2026-02-12T10:00:00Z',
    user: {
      userId: '01HUSER0000000000000000006',
      userName: 'nakamura_ai',
      nickname: '中村あい',
      image: null,
      bio: '5年以上のTRPG経験者。',
    },
  }),
  mockApplication({
    userId: '01HUSER0000000000000000007',
    applicationMessage: null,
    appliedAt: '2026-02-13T15:00:00Z',
    user: {
      userId: '01HUSER0000000000000000007',
      userName: 'sato_yuki',
      nickname: 'ゆきち',
      image: null,
      bio: null,
    },
  }),
];

// --- Meta ---

const meta = {
  title: 'Pages/Sessions/ApplicationApprovalContent',
  component: ApplicationApprovalContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ApplicationApprovalContent>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

/**
 * デフォルト状態。
 * PENDING 2件 + CONFIRMED 1件の合計3件。
 * フィルターバー（検索・ソート・フィルター）の動作を確認できる。
 */
export const Default: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    maxPlayer: null,
    applications: [
      pendingApplicationA,
      pendingApplicationB,
      confirmedApplicationC,
    ],
  },
};

/**
 * 申請0件の空状態。
 * 「申請はまだありません」メッセージが表示される。
 */
export const Empty: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    maxPlayer: null,
    applications: [],
  },
};

/**
 * 全員承認済み状態。
 * PENDING 0件、CONFIRMED 2件。
 * フィルターで「承認待ち」を選択すると空状態が表示される。
 */
export const AllConfirmed: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    maxPlayer: null,
    applications: [confirmedApplicationC, confirmedApplicationD],
  },
};

/**
 * 承認待ち多数の状態。
 * 5件の PENDING 申請が並ぶ。
 * カードグリッドのレイアウト確認に使用する。
 */
export const ManyPending: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    maxPlayer: null,
    applications: manyPendingApplications,
  },
};

/**
 * maxPlayer設定あり（4人）。
 * ヘッダーの承認済みバッジに「承認済み 2 / 4 件」と上限が表示される。
 */
export const WithMaxPlayer: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    maxPlayer: 4,
    applications: [
      pendingApplicationA,
      confirmedApplicationC,
      confirmedApplicationD,
    ],
  },
};

/**
 * ページネーション表示（8件）。
 * 1ページ6件で2ページに分割される。
 */
export const WithPagination: Story = {
  args: {
    sessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    maxPlayer: 10,
    applications: [
      ...manyPendingApplications,
      confirmedApplicationC,
      confirmedApplicationD,
      mockApplication({
        userId: '01HUSER0000000000000000008',
        applicationMessage: '新しいシステムに興味があります。',
        appliedAt: '2026-02-14T09:00:00Z',
        user: {
          userId: '01HUSER0000000000000000008',
          userName: 'watanabe_ken',
          nickname: '渡辺ケン',
          image: null,
          bio: null,
        },
      }),
    ],
  },
};

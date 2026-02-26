import { SessionDetailContent } from './SessionDetailContent';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  ParticipantWithUser,
  SessionDetail,
  SessionLink,
  TimelineEvent,
} from '../../interface';

// --- モックデータ ---

const mockKeeper = {
  userId: '01HKEEPER00000000000000001',
  userName: 'GM太郎',
};

const mockCreator = {
  userId: '01HCREATOR0000000000000001',
  userName: '作成者花子',
};

const mockParticipants: ParticipantWithUser[] = [
  {
    sessionId: '01HSESSION0000000000000001',
    userId: '01HKEEPER00000000000000001',
    participantType: 'KEEPER',
    participantStatus: 'CONFIRMED',
    applicationMessage: null,
    appliedAt: '2026-02-01T10:00:00Z',
    approvedAt: '2026-02-01T10:00:00Z',
    characterSheetUrl: null,
    withdrawalReason: null,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    user: {
      userId: '01HKEEPER00000000000000001',
      userName: 'GM太郎',
      nickname: 'GM太郎',
      authUserId: '00000000-0000-4000-8000-000000000021',
      discordAccountId: null,
      discordId: '123456789',
      image: null,
      bio: null,
      favoriteScenarios: null,
      role: 'MEMBER',
      lastloginAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
  {
    sessionId: '01HSESSION0000000000000001',
    userId: '01HPLAYER000000000000000001',
    participantType: 'PLAYER',
    participantStatus: 'CONFIRMED',
    applicationMessage: '参加希望です！',
    appliedAt: '2026-02-02T12:00:00Z',
    approvedAt: '2026-02-02T14:00:00Z',
    characterSheetUrl: 'https://example.com/sheet/1',
    withdrawalReason: null,
    createdAt: '2026-02-02T12:00:00Z',
    updatedAt: '2026-02-02T14:00:00Z',
    user: {
      userId: '01HPLAYER000000000000000001',
      userName: 'プレイヤーA',
      nickname: 'プレイヤーA',
      authUserId: '00000000-0000-4000-8000-000000000022',
      discordAccountId: null,
      discordId: '234567890',
      image: null,
      bio: null,
      favoriteScenarios: null,
      role: 'MEMBER',
      lastloginAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
  {
    sessionId: '01HSESSION0000000000000001',
    userId: '01HPLAYER000000000000000002',
    participantType: 'PLAYER',
    participantStatus: 'PENDING',
    applicationMessage: '初心者ですがよろしくお願いします',
    appliedAt: '2026-02-03T09:00:00Z',
    approvedAt: null,
    characterSheetUrl: null,
    withdrawalReason: null,
    createdAt: '2026-02-03T09:00:00Z',
    updatedAt: '2026-02-03T09:00:00Z',
    user: {
      userId: '01HPLAYER000000000000000002',
      userName: 'プレイヤーB',
      nickname: 'プレイヤーB',
      authUserId: '00000000-0000-4000-8000-000000000023',
      discordAccountId: null,
      discordId: '345678901',
      image: null,
      bio: null,
      favoriteScenarios: null,
      role: 'MEMBER',
      lastloginAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
];

const mockLinks: SessionLink[] = [
  {
    linkId: '01HLINK0000000000000000001',
    sessionId: '01HSESSION0000000000000001',
    linkType: 'DISCORD',
    url: 'https://discord.gg/example',
    label: 'セッション用Discordサーバー',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
];

const mockTimeline: TimelineEvent[] = [
  {
    type: 'created',
    date: '2026-02-01T10:00:00Z',
    description: 'セッション作成',
  },
  {
    type: 'applied',
    date: '2026-02-02T12:00:00Z',
    actor: { userId: '01HPLAYER000000000000000001', userName: 'プレイヤーA' },
    description: 'プレイヤーAが参加申請',
  },
  {
    type: 'applied',
    date: '2026-02-03T09:00:00Z',
    actor: { userId: '01HPLAYER000000000000000002', userName: 'プレイヤーB' },
    description: 'プレイヤーBが参加申請',
  },
];

const mockSession: SessionDetail = {
  gameSessionId: '01HSESSION0000000000000001',
  sessionName: '深淵の呼び声 - 第1回セッション',
  sessionPhase: 'RECRUITING',
  sessionDescription:
    'クトゥルフ神話TRPGのオンラインセッションです。初心者歓迎！',
  sessionMemo: 'プレイヤーBの承認を忘れずに。次回までにNPCの設定を確認。',
  scenarioId: '01HSCENARIO000000000000001',
  keeperId: '01HKEEPER00000000000000001',
  createdById: '01HCREATOR0000000000000001',
  maxParticipantCount: 5,
  remainingPlayerSlotCount: 3,
  recruitedPlayerCount: 4,
  scheduledAt: null,
  tools: null,
  completedAt: null,
  completionNote: null,
  cancelReason: null,
  isBeginnerFriendly: true,
  visibility: 'PUBLIC',
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-10T15:00:00Z',
  scenario: {
    scenarioId: '01HSCENARIO000000000000001',
    name: '深淵の呼び声',
    scenarioName: '深淵の呼び声',
    description: '古い洋館を舞台にしたホラーシナリオ',
    author: 'シナリオ作者',
    scenarioSystemId: '01HSYSTEM00000000000000001',
    scenarioImageUrl: null,
    distributeUrl: null,
    minPlayer: 2,
    maxPlayer: 4,
    minPlaytime: 180,
    maxPlaytime: 240,
    sortPlaytimeAsc: 180,
    sortPlaytimeDesc: 240,
    handoutType: 'PUBLIC',
    sourceType: null,
    sourceUrl: null,
    sourceFetchedAt: null,
    createdById: null,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    system: {
      systemId: '01HSYSTEM00000000000000001',
      name: 'クトゥルフ神話TRPG',
      systemName: 'クトゥルフ神話TRPG',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  } as SessionDetail['scenario'],
  schedule: null,
  scheduleSlots: [],
  participants: mockParticipants,
  links: mockLinks,
  keeper: mockKeeper,
  creator: mockCreator,
} as SessionDetail;

const emptySession: SessionDetail = {
  ...mockSession,
  sessionMemo: null,
  participants: [],
  links: [],
} as SessionDetail;

// --- Meta ---

const meta = {
  title: 'Pages/Sessions/SessionDetailContent',
  component: SessionDetailContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SessionDetailContent>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

/**
 * 基本的な表示。managerロールで参加者3人、タイムライン3件。
 */
export const Default: Story = {
  args: {
    session: mockSession,
    timeline: mockTimeline,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

/**
 * participantロールで表示。編集ボタン・GMメモは非表示。
 */
export const AsParticipant: Story = {
  args: {
    session: mockSession,
    timeline: mockTimeline,
    userRole: 'participant',
    currentUserId: '01HPLAYER000000000000000001',
  },
};

/**
 * guestロールで表示。編集ボタン・GMメモは非表示。
 */
export const AsGuest: Story = {
  args: {
    session: mockSession,
    timeline: mockTimeline,
    userRole: 'guest',
    currentUserId: null,
  },
};

/**
 * 参加者0人、タイムライン0件、リンク0件の空状態。
 */
export const Empty: Story = {
  args: {
    session: emptySession,
    timeline: [],
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
  },
};

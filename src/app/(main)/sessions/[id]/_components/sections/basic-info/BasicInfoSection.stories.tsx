import { createScenarioSystem } from '../../../../__mocks__/sessionMocks';
import { BasicInfoSection } from './BasicInfoSection';

import type { Meta, StoryObj } from '@storybook/react';
import type { ParticipantWithUser, SessionDetail } from '../../../../interface';

const meta = {
  title: 'Sessions/詳細/BasicInfoSection',
  component: BasicInfoSection,
  tags: ['autodocs'],
} satisfies Meta<typeof BasicInfoSection>;

export default meta;

type Story = StoryObj<typeof meta>;

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
      discordAccountId: '123456789',
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

const mockSession: SessionDetail = {
  gameSessionId: '01HSESSION0000000000000001',
  sessionName: '深淵の呼び声 - 第1回セッション',
  sessionPhase: 'RECRUITING',
  sessionDescription:
    'クトゥルフ神話TRPGのオンラインセッションです。初心者歓迎！',
  sessionMemo: null,
  scenarioId: '01HSCENARIO000000000000001',
  keeperId: '01HKEEPER00000000000000001',
  createdById: '01HCREATOR0000000000000001',
  maxParticipantCount: 5,
  remainingSeatCount: 3,
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
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  } as SessionDetail['scenario'],
  scheduleDate: null,
  schedulePhase: 'ADJUSTING',
  scheduleTimeBlocks: [],
  participants: mockParticipants,
  links: [],
  keeper: mockKeeper,
  creator: mockCreator,
} as SessionDetail;

const mockSystems = [
  createScenarioSystem({
    systemId: '01HSYSTEM00000000000000001',
    name: 'クトゥルフ神話TRPG',
  }),
  createScenarioSystem({
    systemId: '01HSYSTEM00000000000000002',
    name: 'ダブルクロス',
  }),
];

/**
 * 基本表示（managerビュー、編集ボタンあり）
 */
export const Default: Story = {
  args: {
    session: mockSession,
    showEditButton: true,
    systems: mockSystems,
  },
};

/**
 * participantビュー（編集ボタンなし）
 */
export const AsParticipant: Story = {
  args: {
    session: mockSession,
    showEditButton: false,
    systems: mockSystems,
  },
};

/**
 * シナリオ未設定の状態
 */
export const WithoutScenario: Story = {
  args: {
    session: {
      ...mockSession,
      scenario: null,
      scenarioId: null,
    } as SessionDetail,
    showEditButton: true,
    systems: mockSystems,
  },
};

import type {
  ParticipantWithUser,
  SessionDetail,
  SessionLink,
  TimelineEvent,
} from '../../interface';

// --- 基本モックデータ ---

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
      discordAccountId: '234567890',
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
      discordAccountId: '345678901',
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
      systemName: 'クトゥルフ神話TRPG',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  } as SessionDetail['scenario'],
  scheduleDate: null,
  schedulePhase: 'ADJUSTING',
  scheduleTimeBlocks: [],
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

// --- フェーズ別バリアント ---

export const preparationSession: SessionDetail = {
  ...mockSession,
  sessionPhase: 'PREPARATION',
  scheduleDate: '2026-03-20T14:00:00Z',
  schedulePhase: 'CONFIRMED',
} as SessionDetail;

export const inProgressSession: SessionDetail = {
  ...mockSession,
  sessionPhase: 'IN_PROGRESS',
  scheduledAt: '2026-03-20T14:00:00Z',
  scheduleDate: '2026-03-20T14:00:00Z',
  schedulePhase: 'CONFIRMED',
} as SessionDetail;

export const completedSession: SessionDetail = {
  ...mockSession,
  sessionPhase: 'COMPLETED',
  completedAt: '2026-03-20T18:00:00Z',
  completionNote: '全員生還！素晴らしいセッションでした。',
  scheduledAt: '2026-03-20T14:00:00Z',
  scheduleDate: '2026-03-20T14:00:00Z',
  schedulePhase: 'CONFIRMED',
} as SessionDetail;

export const cancelledSession: SessionDetail = {
  ...mockSession,
  sessionPhase: 'CANCELLED',
  cancelReason: '参加者の都合がつかなくなったため中止',
} as SessionDetail;

export {
  mockKeeper,
  mockCreator,
  mockParticipants,
  mockLinks,
  mockTimeline,
  mockSession,
  emptySession,
};

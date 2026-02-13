import type {
  ActivityItem,
  CalendarSessionDate,
  NewScenario,
  UpcomingSession,
} from '../interface';

// ── UpcomingSession モック ─────────────────────

const baseSession = {
  sessionDescription: '',
  sessionMemo: null,
  completionNote: null,
  isBeginnerFriendly: true,
  recruitedPlayerCount: 4,
  scheduledAt: null,
  tools: 'ココフォリア',
  visibility: 'PUBLIC' as const,
  createdAt: '2025-12-01T00:00:00Z',
  updatedAt: '2025-12-01T00:00:00Z',
} satisfies Partial<UpcomingSession>;

const baseUser = {
  discordId: 'discord-001',
  bio: null,
  role: 'MEMBER' as const,
  favoriteScenarios: null,
  lastloginAt: '2025-12-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const baseParticipant = {
  applicationMessage: null,
  appliedAt: '2025-12-01T00:00:00Z',
  approvedAt: '2025-12-01T00:00:00Z',
  characterSheetUrl: null,
  createdAt: '2025-12-01T00:00:00Z',
  updatedAt: '2025-12-01T00:00:00Z',
};

const baseScenario = {
  author: null,
  description: null,
  distributeUrl: null,
  handoutType: 'NONE' as const,
  maxPlayer: 5,
  maxPlaytime: 240,
  minPlayer: 3,
  minPlaytime: 120,
  scenarioImageUrl: null,
  sortPlaytimeAsc: 120,
  sortPlaytimeDesc: 240,
  sourceType: null,
  sourceUrl: null,
  sourceFetchedAt: null,
  createdById: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockUpcomingSessions: UpcomingSession[] = [
  {
    ...baseSession,
    gameSessionId: 'session-1',
    sessionName: '深淵の迷宮 初心者歓迎卓',
    sessionPhase: 'RECRUITING',
    scenarioId: 'scenario-1',
    keeperId: 'user-1',
    scheduledAt: '2026-03-15T21:00:00Z',
    scenario: {
      ...baseScenario,
      scenarioId: 'scenario-1',
      name: '深淵の迷宮',
      scenarioSystemId: 'system-1',
      system: {
        systemId: 'system-1',
        name: 'クトゥルフ神話TRPG',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    },
    participants: [
      {
        ...baseParticipant,
        sessionId: 'session-1',
        userId: 'user-1',
        participantType: 'KEEPER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-1',
          nickname: 'たろう',
          userName: 'taro',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taro',
        },
      },
      {
        ...baseParticipant,
        sessionId: 'session-1',
        userId: 'user-2',
        participantType: 'PLAYER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-2',
          nickname: 'はなこ',
          userName: 'hanako',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hanako',
        },
      },
      {
        ...baseParticipant,
        sessionId: 'session-1',
        userId: 'user-3',
        participantType: 'PLAYER',
        participantStatus: 'PENDING',
        user: {
          ...baseUser,
          userId: 'user-3',
          nickname: 'じろう',
          userName: 'jiro',
          image: null,
        },
      },
    ],
    schedule: {
      sessionId: 'session-1',
      scheduleDate: '2026-03-15',
      schedulePhase: 'CONFIRMED',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2025-12-01T00:00:00Z',
    },
  },
  {
    ...baseSession,
    gameSessionId: 'session-2',
    sessionName: '星降る夜の物語',
    sessionPhase: 'PREPARATION',
    scenarioId: 'scenario-2',
    keeperId: 'user-4',
    scheduledAt: '2026-03-22T20:00:00Z',
    scenario: {
      ...baseScenario,
      scenarioId: 'scenario-2',
      name: '星降る夜の物語',
      scenarioSystemId: 'system-2',
      system: {
        systemId: 'system-2',
        name: 'エモクロアTRPG',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    },
    participants: [
      {
        ...baseParticipant,
        sessionId: 'session-2',
        userId: 'user-4',
        participantType: 'KEEPER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-4',
          nickname: 'さくら',
          userName: 'sakura',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura',
        },
      },
    ],
    schedule: {
      sessionId: 'session-2',
      scheduleDate: '2026-03-22',
      schedulePhase: 'ADJUSTING',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2025-12-01T00:00:00Z',
    },
  },
  {
    ...baseSession,
    gameSessionId: 'session-3',
    sessionName: '黒き森の秘密',
    sessionPhase: 'IN_PROGRESS',
    scenarioId: 'scenario-3',
    keeperId: 'user-1',
    scheduledAt: '2026-02-10T20:00:00Z',
    scenario: {
      ...baseScenario,
      scenarioId: 'scenario-3',
      name: '黒き森の秘密',
      scenarioSystemId: 'system-1',
      system: {
        systemId: 'system-1',
        name: 'クトゥルフ神話TRPG',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    },
    participants: [
      {
        ...baseParticipant,
        sessionId: 'session-3',
        userId: 'user-1',
        participantType: 'KEEPER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-1',
          nickname: 'たろう',
          userName: 'taro',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taro',
        },
      },
      {
        ...baseParticipant,
        sessionId: 'session-3',
        userId: 'user-2',
        participantType: 'PLAYER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-2',
          nickname: 'はなこ',
          userName: 'hanako',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hanako',
        },
      },
      {
        ...baseParticipant,
        sessionId: 'session-3',
        userId: 'user-5',
        participantType: 'PLAYER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-5',
          nickname: 'ゆうき',
          userName: 'yuki',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki',
        },
      },
      {
        ...baseParticipant,
        sessionId: 'session-3',
        userId: 'user-6',
        participantType: 'PLAYER',
        participantStatus: 'CONFIRMED',
        user: {
          ...baseUser,
          userId: 'user-6',
          nickname: 'みさき',
          userName: 'misaki',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=misaki',
        },
      },
    ],
    schedule: {
      sessionId: 'session-3',
      scheduleDate: '2026-02-10',
      schedulePhase: 'CONFIRMED',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2025-12-01T00:00:00Z',
    },
  },
];

/** 完了済みセッション */
export const mockCompletedSession: UpcomingSession = {
  ...baseSession,
  gameSessionId: 'session-4',
  sessionName: '忘却の館',
  sessionPhase: 'COMPLETED',
  scenarioId: 'scenario-4',
  keeperId: 'user-4',
  completionNote: '全員生還！',
  scenario: {
    ...baseScenario,
    scenarioId: 'scenario-4',
    name: '忘却の館',
    scenarioSystemId: 'system-1',
    system: {
      systemId: 'system-1',
      name: 'クトゥルフ神話TRPG',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  },
  participants: [
    {
      ...baseParticipant,
      sessionId: 'session-4',
      userId: 'user-4',
      participantType: 'KEEPER',
      participantStatus: 'CONFIRMED',
      user: {
        ...baseUser,
        userId: 'user-4',
        nickname: 'さくら',
        userName: 'sakura',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura',
      },
    },
  ],
  schedule: {
    sessionId: 'session-4',
    scheduleDate: '2026-01-20',
    schedulePhase: 'CONFIRMED',
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
};

// ── ActivityItem モック ────────────────────────

const now = new Date();

export const mockActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'participant_joined',
    description: 'はなこが「深淵の迷宮 初心者歓迎卓」に参加申請しました',
    actorName: 'はなこ',
    targetName: '深淵の迷宮 初心者歓迎卓',
    timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    type: 'scenario_updated',
    description: 'たろうがシナリオ「黒き森の秘密」を更新しました',
    actorName: 'たろう',
    targetName: '黒き森の秘密',
    timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    type: 'session_completed',
    description: '「忘却の館」のセッションが完了しました',
    actorName: 'さくら',
    targetName: '忘却の館',
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    type: 'review_created',
    description: 'ゆうきが「忘却の館」のレビューを投稿しました',
    actorName: 'ゆうき',
    targetName: '忘却の館',
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── NewScenario モック ────────────────────────

const baseTag = {
  color: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockNewScenarios: NewScenario[] = [
  {
    ...baseScenario,
    scenarioId: 'scenario-new-1',
    name: '蒼い回廊の果てに',
    scenarioSystemId: 'system-1',
    description:
      '目を覚ますと、そこは見知らぬ青い回廊だった。記憶を辿りながら脱出を目指す。',
    minPlayer: 3,
    maxPlayer: 4,
    minPlaytime: 180,
    maxPlaytime: 240,
    system: {
      systemId: 'system-1',
      name: 'クトゥルフ神話TRPG',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    scenarioTags: [
      { tag: { ...baseTag, tagId: 'tag-1', name: 'ホラー' } },
      { tag: { ...baseTag, tagId: 'tag-2', name: '探索' } },
    ],
  },
  {
    ...baseScenario,
    scenarioId: 'scenario-new-2',
    name: '約束の花が咲く頃に',
    scenarioSystemId: 'system-2',
    description:
      '花祭りの夜、幼馴染の失踪事件を追う。感情が交差するシティシナリオ。',
    minPlayer: 2,
    maxPlayer: 4,
    minPlaytime: 120,
    maxPlaytime: 180,
    system: {
      systemId: 'system-2',
      name: 'エモクロアTRPG',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    scenarioTags: [
      { tag: { ...baseTag, tagId: 'tag-3', name: 'シティ' } },
      { tag: { ...baseTag, tagId: 'tag-4', name: '感情' } },
    ],
  },
  {
    ...baseScenario,
    scenarioId: 'scenario-new-3',
    name: '最果ての灯台にて',
    scenarioSystemId: 'system-1',
    description: '嵐の夜、灯台守から届いた一通の手紙。その謎を解き明かせ。',
    minPlayer: 2,
    maxPlayer: 3,
    minPlaytime: 90,
    maxPlaytime: 120,
    system: {
      systemId: 'system-1',
      name: 'クトゥルフ神話TRPG',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    scenarioTags: [
      { tag: { ...baseTag, tagId: 'tag-5', name: 'クローズド' } },
      { tag: { ...baseTag, tagId: 'tag-1', name: 'ホラー' } },
      { tag: { ...baseTag, tagId: 'tag-6', name: '短時間' } },
    ],
  },
];

// ── CalendarSessionDate モック ─────────────────

const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const mm = String(currentMonth).padStart(2, '0');

export const mockCalendarDates: CalendarSessionDate[] = [
  {
    scheduleDate: `${currentYear}-${mm}-05`,
    sessionId: 'session-cal-1',
    sessionName: '水曜定例卓',
  },
  {
    scheduleDate: `${currentYear}-${mm}-12`,
    sessionId: 'session-cal-2',
    sessionName: '週末卓',
  },
  {
    scheduleDate: `${currentYear}-${mm}-15`,
    sessionId: 'session-1',
    sessionName: '深淵の迷宮 初心者歓迎卓',
  },
  {
    scheduleDate: `${currentYear}-${mm}-22`,
    sessionId: 'session-2',
    sessionName: '星降る夜の物語',
  },
  {
    scheduleDate: `${currentYear}-${mm}-28`,
    sessionId: 'session-cal-3',
    sessionName: '月末卓',
  },
];

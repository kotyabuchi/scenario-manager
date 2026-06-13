import type {
  MySessionWithRole,
  ParticipantWithUser,
  PublicSession,
  ScenarioSystem,
  User,
} from '../interface';

// --- ヘルパー ---

const createUser = (overrides?: Partial<User>): User => ({
  userId: '01HUSER0000000000000000001',
  userName: 'テストユーザー',
  nickname: 'テストユーザー',
  authUserId: '00000000-0000-4000-8000-000000000001',
  discordAccountId: '100000000',
  image: null,
  bio: null,
  favoriteScenarios: null,
  role: 'MEMBER',
  lastloginAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

// --- 公開ファクトリ ---

const createPublicSession = (
  overrides?: Partial<PublicSession>,
): PublicSession => ({
  gameSessionId: '01HSESSION0000000000000001',
  sessionName: '深淵の呼び声 - 第1回セッション',
  sessionPhase: 'RECRUITING',
  scenarioId: '01HSCENARIO000000000000001',
  scenarioName: '深淵の呼び声',
  systemName: 'クトゥルフ神話TRPG',
  scheduleDate: null,
  schedulePhase: 'ADJUSTING',
  keeperName: 'GM太郎',
  keeperUserId: '01HKEEPER00000000000000001',
  participantCount: 2,
  maxPlayer: 4,
  minPlaytime: 180,
  maxPlaytime: 240,
  createdAt: '2026-02-01T10:00:00Z',
  ...overrides,
});

const createScenarioSystem = (
  overrides?: Partial<ScenarioSystem>,
): ScenarioSystem => ({
  systemId: '01HSYSTEM00000000000000001',
  name: 'クトゥルフ神話TRPG',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const createParticipant = (
  overrides?: Partial<ParticipantWithUser>,
): ParticipantWithUser => ({
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
  user: createUser(),
  ...overrides,
});

const createMySession = (
  overrides?: Partial<MySessionWithRole>,
): MySessionWithRole => {
  const defaultParticipant = createParticipant();
  return {
    gameSessionId: '01HSESSION0000000000000001',
    sessionName: '深淵の呼び声 - 第1回セッション',
    sessionPhase: 'RECRUITING',
    sessionDescription: 'クトゥルフ神話TRPGのセッション',
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
      description: 'ホラーシナリオ',
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
      system: createScenarioSystem(),
    } as NonNullable<MySessionWithRole['scenario']>,
    scheduleDate: null,
    schedulePhase: 'ADJUSTING',
    scheduleTimeBlocks: [],
    participants: [defaultParticipant],
    myRole: 'KEEPER',
    ...overrides,
  } as MySessionWithRole;
};

export {
  createUser,
  createPublicSession,
  createMySession,
  createScenarioSystem,
  createParticipant,
};

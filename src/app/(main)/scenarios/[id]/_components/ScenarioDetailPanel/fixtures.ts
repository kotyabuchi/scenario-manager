import type {
  ReviewWithUser,
  ScenarioDetail,
  VideoLinkWithSession,
} from '../../interface';

/** Storybookとテストで使う、DB由来の必須フィールドを満たした詳細データ。 */
export const scenarioFixture: ScenarioDetail = {
  scenarioId: 'scn_01',
  scenarioSystemId: 'sys_01',
  name: '海辺の町の怪奇譚',
  author: '名無しのGM',
  description: '閉ざされた港町で起きる連続失踪事件を追うシナリオ。',
  scenarioImageUrl: '/storybook/scenario-umibe.jpg',
  distributeUrl: 'https://example.com/scenarios/umibe',
  createdById: null,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  sourceType: 'manual',
  sourceUrl: null,
  sourceFetchedAt: null,
  sortPlaytimeAsc: 240,
  sortPlaytimeDesc: 360,
  minPlayer: 3,
  maxPlayer: 4,
  minPlaytime: 240,
  maxPlaytime: 360,
  handoutType: 'SECRET',
  system: {
    systemId: 'sys_01',
    name: 'クトゥルフ神話TRPG',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  tags: [
    {
      tagId: 't1',
      name: 'クローズド',
      color: 'oklch(0.65 0.15 25)',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T10:00:00Z',
    },
  ],
  avgRating: 4.3,
  reviewCount: 12,
};

export const reviewFixture: ReviewWithUser = {
  userReviewId: 'r1',
  scenarioId: 'scn_01',
  sessionId: null,
  userId: 'u1',
  rating: 5,
  openComment: '探索と会話を楽しめました。',
  spoilerComment: '失踪事件の真相に驚きました。',
  createdAt: '2026-06-02T12:00:00Z',
  updatedAt: '2026-06-02T12:00:00Z',
  user: { userId: 'u1', nickname: 'はるか', userName: 'haruka', image: null },
};

export const videoFixture: VideoLinkWithSession = {
  videoLinkId: 'v1',
  scenarioId: 'scn_01',
  sessionId: 'gs_01',
  createdById: 'u1',
  createdAt: '2026-06-02T12:00:00Z',
  updatedAt: '2026-06-02T12:00:00Z',
  videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  spoiler: true,
  session: { gameSessionId: 'gs_01' },
  user: { userId: 'u1', nickname: 'はるか' },
};

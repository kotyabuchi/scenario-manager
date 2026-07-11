import { useState } from 'react';

import {
  ScenarioDetailPanel,
  type ScenarioDetailPanelProps,
} from './ScenarioDetailPanel';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  ReviewWithUser,
  ScenarioDetail,
  SessionWithKeeper,
  VideoLinkWithSession,
} from '../../interface';

// ScenarioInfo が参照するフィールドを満たす最小モック
const mockScenario = {
  scenarioId: 'scn_01',
  name: '海辺の町の怪奇譚',
  author: '名無しのGM',
  description:
    '潮風が運ぶ不穏な噂。閉ざされた港町で起きる連続失踪事件を追う、現代日本クローズドシナリオ。',
  scenarioImageUrl: '/storybook/scenario-umibe.jpg',
  distributeUrl: null,
  sourceType: 'manual',
  minPlayer: 3,
  maxPlayer: 4,
  minPlaytime: 240,
  maxPlaytime: 360,
  handoutType: 'SECRET',
  system: { name: 'クトゥルフ神話TRPG' },
  tags: [
    { tagId: 't1', name: 'クローズド', color: 'oklch(0.65 0.15 25)' },
    { tagId: 't2', name: '現代日本', color: 'oklch(0.65 0.13 250)' },
    { tagId: 't3', name: 'ホラー', color: 'oklch(0.62 0.14 310)' },
  ],
  avgRating: 4.3,
  reviewCount: 12,
} as unknown as ScenarioDetail;

const mockSessions: SessionWithKeeper[] = [
  {
    gameSessionId: 'gs_01',
    sessionName: '海辺で過ごす、ゆるやかな時間',
    scenarioId: 'scn_01',
    sessionPhase: 'RECRUITING',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    keeper: {
      userId: 'u1',
      nickname: 'はるか',
      image: '/storybook/avatar-haruka.jpg',
    },
    participantCount: 2,
    scheduleDate: '2026-06-15T20:00:00Z',
  },
  {
    gameSessionId: 'gs_02',
    sessionName: '週末しっとり卓',
    scenarioId: 'scn_01',
    sessionPhase: 'COMPLETED',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
    keeper: {
      userId: 'u2',
      nickname: 'もふもふ',
      image: '/storybook/avatar-mofumofu.jpg',
    },
    participantCount: 4,
    scheduleDate: '2026-05-18T21:00:00Z',
  },
];

const mockVideos = [
  {
    videoLinkId: 'v1',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spoiler: false,
    session: { gameSessionId: 'gs_02' },
    user: { userId: 'u2', nickname: 'もふもふ' },
  },
  {
    videoLinkId: 'v2',
    videoUrl: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
    spoiler: true,
    session: { gameSessionId: 'gs_02' },
    user: { userId: 'u1', nickname: 'はるか' },
  },
  // ネタバレ動画を複数にして、個別表示と一括Switchの同期挙動を確認できるようにする
  {
    videoLinkId: 'v3',
    videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    spoiler: true,
    session: { gameSessionId: 'gs_02' },
    user: { userId: 'u3', nickname: 'レン' },
  },
] as unknown as VideoLinkWithSession[];

const mockReviews = [
  {
    userReviewId: 'r1',
    userId: 'u3',
    rating: 5,
    openComment: 'とても素敵なシナリオでした…！この余韻がたまりません。',
    spoilerComment: null,
    createdAt: '2026-06-02T12:00:00Z',
    user: {
      userId: 'u3',
      nickname: 'レン',
      userName: 'ren',
      image: '/storybook/avatar-ren.jpg',
    },
  },
  {
    userReviewId: 'r2',
    userId: 'u2',
    rating: 4,
    openComment:
      'HOごとの導線が丁寧に作られていて、初心者KPでも回しやすかったです！',
    spoilerComment: '終盤の選択肢の分岐が特に好みでした。',
    createdAt: '2026-05-28T12:00:00Z',
    user: {
      userId: 'u2',
      nickname: 'もふもふ',
      userName: 'mofumofu',
      image: '/storybook/avatar-mofumofu.jpg',
    },
  },
] as unknown as ReviewWithUser[];

/**
 * お気に入り状態をストーリー内で保持するラッパー。
 * useOptimistic は遷移完了後に props 値へ戻るため、
 * 静的 args のままだとトグルが定着しない（本番では revalidate で props が更新される）
 */
const InteractivePanel = (args: ScenarioDetailPanelProps) => {
  const [isFavorite, setIsFavorite] = useState(args.isFavorite ?? false);
  return (
    <ScenarioDetailPanel
      {...args}
      isFavorite={isFavorite}
      onToggleFavorite={async () => {
        setIsFavorite((prev) => !prev);
      }}
    />
  );
};

const meta = {
  title: 'Scenarios/ScenarioDetailPanel',
  component: ScenarioDetailPanel,
  tags: ['autodocs'],
  render: (args) => <InteractivePanel {...args} />,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  args: {
    scenario: mockScenario,
    sessions: mockSessions,
    videos: mockVideos,
    reviews: mockReviews,
    reviewTotalCount: mockReviews.length,
    isFavorite: false,
    isPlayed: false,
    isLoggedIn: true,
    onToggleFavorite: async () => {},
  },
} satisfies Meta<typeof ScenarioDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 広いペイン（目次カラム表示）
 */
export const Default: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          // モック画像の背景実測値（現行 canvas トークンより緑みが強い）
          background: '#f5f9f1',
          padding: 24,
          width: 1100,
          maxWidth: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * 狭いペイン（目次カラム非表示・1カラム）
 */
export const NarrowPane: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          // モック画像の背景実測値（現行 canvas トークンより緑みが強い）
          background: '#f5f9f1',
          padding: 24,
          width: 600,
          maxWidth: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * 単独ページ表示（直URL・リロード・狭い画面）。戻るリンクの文言が変わる
 */
export const PageVariant: Story = {
  args: {
    variant: 'page',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          background: '#f5f9f1',
          padding: 24,
          width: 1100,
          maxWidth: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * 関連データなし（各セクションの空状態）
 */
export const Empty: Story = {
  args: {
    sessions: [],
    videos: [],
    reviews: [],
    reviewTotalCount: 0,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          // モック画像の背景実測値（現行 canvas トークンより緑みが強い）
          background: '#f5f9f1',
          padding: 24,
          width: 1100,
          maxWidth: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

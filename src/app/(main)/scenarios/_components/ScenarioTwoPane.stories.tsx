import { useState } from 'react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

import {
  ScenarioDetailPanel,
  type ScenarioDetailPanelProps,
} from '../[id]/_components/ScenarioDetailPanel';
import {
  ScenarioListPanel,
  type ScenarioListPanelProps,
} from './ScenarioListPanel';
import { useScenarioListFixture } from './ScenarioListPanel/useScenarioListFixture';

import type { Meta, StoryObj } from '@storybook/react';
import type { SystemItem, TagItem } from '@/components/blocks/FilterPanel';
import type {
  ReviewWithUser,
  ScenarioDetail,
  SessionWithKeeper,
  VideoLinkWithSession,
} from '../[id]/interface';
import type { ScenarioWithRelations } from '../interface';

const systems: SystemItem[] = [
  { systemId: 'coc7', name: 'クトゥルフ神話TRPG' },
  { systemId: 'coc6', name: 'CoC 6版' },
  { systemId: 'sw25', name: 'ソード・ワールド2.5' },
  { systemId: 'emo', name: 'エモクロアTRPG' },
  { systemId: 'ins', name: 'インセイン' },
  { systemId: 'dx', name: 'ダブルクロス The 3rd' },
];

const tags: TagItem[] = [
  { tagId: 't1', name: 'クローズド' },
  { tagId: 't2', name: '現代日本' },
  { tagId: 't3', name: '青春' },
  { tagId: 't4', name: 'ホラー' },
  { tagId: 't5', name: '探索' },
  { tagId: 't6', name: '和風' },
];

const tag = (id: string, name: string, hue: number) => ({
  tagId: id,
  name,
  color: `oklch(0.674 0.103 ${hue})`,
});

const mk = (
  over: Partial<{
    scenarioId: string;
    name: string;
    system: { systemId: string; name: string };
    tags: { tagId: string; name: string; color: string | null }[];
    minPlayer: number;
    maxPlayer: number;
    minPlaytime: number;
    maxPlaytime: number;
    createdAt: string;
  }>,
): ScenarioWithRelations =>
  ({
    scenarioId: 's',
    name: 'シナリオ',
    description: '夏の海辺の町を舞台にした、探索とRPを中心としたシナリオです。',
    minPlayer: 3,
    maxPlayer: 4,
    minPlaytime: 180,
    maxPlaytime: 300,
    scenarioImageUrl: null,
    system: { systemId: 'coc6', name: 'CoC 6版' },
    tags: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }) as unknown as ScenarioWithRelations;

const scenarios: ScenarioWithRelations[] = [
  mk({
    scenarioId: 'scn_01',
    name: '海辺の町の怪奇譚',
    system: { systemId: 'coc7', name: 'クトゥルフ神話TRPG' },
    tags: [tag('t1', 'クローズド', 20), tag('t2', '現代日本', 245)],
  }),
  mk({
    scenarioId: '2',
    name: '黄昏の街で、きみに問う',
    system: { systemId: 'coc7', name: 'クトゥルフ神話TRPG' },
    tags: [tag('t1', 'クローズド', 20), tag('t5', '探索', 90)],
    minPlayer: 2,
    maxPlayer: 3,
    minPlaytime: 60,
    maxPlaytime: 120,
    createdAt: '2026-07-02T00:00:00.000Z',
  }),
  mk({
    scenarioId: '3',
    name: '夢のつづきは、花のあとで',
    system: { systemId: 'emo', name: 'エモクロアTRPG' },
    tags: [tag('t6', '和風', 140), tag('t3', '青春', 312)],
    minPlaytime: 360,
    maxPlaytime: 480,
    createdAt: '2026-07-03T00:00:00.000Z',
  }),
];

const scenario = {
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

const sessions: SessionWithKeeper[] = [
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

const videos = [
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
] as unknown as VideoLinkWithSession[];

const reviews = [
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

const detailPanelProps: ScenarioDetailPanelProps = {
  scenario,
  sessions,
  videos,
  reviews,
  reviewTotalCount: reviews.length,
  isFavorite: false,
  isPlayed: false,
  isLoggedIn: true,
  onToggleFavorite: async () => {},
};

const TwoPane = () => {
  const listFixture = useScenarioListFixture(scenarios);
  const [isFavorite, setIsFavorite] = useState(false);

  const listPanelProps: ScenarioListPanelProps = {
    systems,
    tags,
    ...listFixture,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 24,
        minWidth: 740,
      }}
    >
      {/* 一覧ペインは自身で面（枠+影）を持つ（ScenarioListPanel.styles.panel）。
          詳細ペインは枠で囲まない。minWidth:0 は grid 縮小のためのみ。 */}
      <div style={{ minWidth: 0 }}>
        <ScenarioListPanel {...listPanelProps} />
      </div>
      <div style={{ minWidth: 0 }}>
        <ScenarioDetailPanel
          {...detailPanelProps}
          isFavorite={isFavorite}
          onToggleFavorite={async () => {
            setIsFavorite((previous) => !previous);
          }}
        />
      </div>
    </div>
  );
};

const meta = {
  title: 'Scenarios/TwoPane',
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <NuqsTestingAdapter hasMemory>
        <div style={{ background: '#f5f9f1', padding: 24, overflowX: 'auto' }}>
          <Story />
        </div>
      </NuqsTestingAdapter>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <TwoPane />,
};

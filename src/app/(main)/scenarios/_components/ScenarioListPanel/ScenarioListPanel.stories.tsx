import { useState } from 'react';

import { ScenarioListPanel } from './ScenarioListPanel';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  SystemItem,
  TagItem,
  UseFilterDraftReturn,
} from '@/components/blocks/FilterPanel';
import type { ScenarioWithRelations, SortOption } from '../../interface';

// ===== モックデータ =====

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
    ...over,
  }) as unknown as ScenarioWithRelations;

const scenarios: ScenarioWithRelations[] = [
  mk({
    scenarioId: '1',
    name: '海辺のあいまいな約束',
    tags: [tag('a', 'クローズド', 20), tag('b', '現代日本', 245)],
  }),
  mk({
    scenarioId: '2',
    name: '黄昏の街で、きみに問う',
    system: { systemId: 'coc7', name: 'クトゥルフ神話TRPG' },
    tags: [tag('d', 'クローズド', 20), tag('e', '探索', 90)],
    minPlayer: 2,
    maxPlayer: 3,
  }),
  mk({
    scenarioId: '3',
    name: '夢のつづきは、花のあとで',
    system: { systemId: 'emo', name: 'エモクロアTRPG' },
    tags: [tag('f', '和風', 140), tag('g', '感情RP', 312)],
  }),
  mk({
    scenarioId: '4',
    name: '雨上がりに君と',
    system: { systemId: 'coc7', name: 'CoC 7版' },
  }),
  mk({
    scenarioId: '5',
    name: '箱庭の観測者',
    system: { systemId: 'ins', name: 'インセイン' },
    tags: [tag('h', 'シリアス', 282), tag('i', '考察', 255)],
  }),
  mk({
    scenarioId: '6',
    name: '終末にさよなら',
    system: { systemId: 'dx', name: 'ダブルクロス The 3rd' },
    tags: [tag('j', '戦闘', 20)],
  }),
];

const emptyParams = {
  systems: [],
  tags: [],
  minPlayer: null,
  maxPlayer: null,
  minPlaytime: null,
  maxPlaytime: null,
  q: '',
};

const mkDraft = (): UseFilterDraftReturn =>
  ({
    mode: 'draft',
    params: emptyParams,
    draft: emptyParams,
    committed: emptyParams,
    isPending: false,
    isDirty: false,
    activeFilterCount: 0,
    toggleSystem: () => {},
    setSystems: () => {},
    toggleTag: () => {},
    setPlayerRange: () => {},
    setPlaytimeRange: () => {},
    setKeyword: () => {},
    clearAll: () => {},
    commit: () => {},
  }) as unknown as UseFilterDraftReturn;

/**
 * sort をストーリー内でローカル保持するラッパー。
 */
const InteractivePanel = ({
  hasMore = false,
  empty = false,
  width = 680,
}: {
  hasMore?: boolean;
  empty?: boolean;
  /** ペイン幅（px）。広さで列数が変わることを確認する */
  width?: number;
}) => {
  const [sort, setSort] = useState<SortOption>('newest');
  const list = empty ? [] : scenarios;
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <ScenarioListPanel
        systems={systems}
        tags={tags}
        draftState={mkDraft()}
        scenarios={list}
        totalCount={list.length}
        sort={sort}
        onSortChange={setSort}
        hasMore={hasMore}
      />
    </div>
  );
};

const meta = {
  title: 'Scenarios/ScenarioListPanel',
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          // ScenarioDetailPanel のストーリー背景に合わせる（モック実測の緑みの白）
          background: '#f5f9f1',
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 一覧ペイン（既定）
 */
export const Default: Story = {
  render: () => <InteractivePanel />,
};

/**
 * 「もっと見る」あり
 */
export const WithLoadMore: Story = {
  render: () => <InteractivePanel hasMore />,
};

/**
 * 空状態（0件）
 */
export const Empty: Story = {
  render: () => <InteractivePanel empty />,
};

/**
 * シナリオ一覧だけを表示する単独ページ相当（広め）。
 * この幅ではカードが3列で並ぶ。
 */
export const Wide: Story = {
  render: () => <InteractivePanel width={900} />,
};

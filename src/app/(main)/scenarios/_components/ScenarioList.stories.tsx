import { ScenarioCardAlt } from './ScenarioCardAlt';
import { ScenarioList } from './ScenarioList';
import * as styles from './styles';

import type { Meta, StoryObj } from '@storybook/react';
import type { BadgeVariant } from '@/components/elements/badge';
import type { ScenarioWithRelations } from '../interface';

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
    tags: [
      tag('a', 'クローズド', 20),
      tag('b', '現代日本', 245),
      tag('c', '青春', 312),
    ],
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
    tags: [],
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

const badges: ({ label: string; variant: BadgeVariant } | undefined)[] = [
  { label: '人気', variant: 'recruiting' },
  { label: '新着', variant: 'neutral' },
  { label: 'おすすめ', variant: 'warning' },
  undefined,
  { label: '人気', variant: 'recruiting' },
  undefined,
];

const meta = {
  title: 'Scenarios/ScenarioList',
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      // ScenarioDetailPanel のストーリー背景に合わせる
      // （モック画像の背景実測値。現行 canvas トークンより緑みが強い）
      <div style={{ background: '#f5f9f1', padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 現行カードの一覧
 */
export const Current: Story = {
  render: () => <ScenarioList scenarios={scenarios} />,
};

/**
 * Alt カードの一覧
 */
export const Alt: Story = {
  render: () => (
    <div className={styles.scenarioListContainer}>
      {scenarios.map((scenario, i) => (
        <ScenarioCardAlt
          key={scenario.scenarioId}
          scenario={scenario}
          {...(badges[i] ? { badge: badges[i] } : {})}
        />
      ))}
    </div>
  ),
};

/**
 * 現行 vs Alt を縦に並べて比較
 */
export const Comparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          現行 ScenarioCard
        </h3>
        <ScenarioList scenarios={scenarios} />
      </section>
      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />
      <section>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Alt（ノッチ無し/バッジ/フルブリード/概要なし）
        </h3>
        <div className={styles.scenarioListContainer}>
          {scenarios.map((scenario, i) => (
            <ScenarioCardAlt
              key={scenario.scenarioId}
              scenario={scenario}
              {...(badges[i] ? { badge: badges[i] } : {})}
            />
          ))}
        </div>
      </section>
    </div>
  ),
};

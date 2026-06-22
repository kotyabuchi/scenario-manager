import { ScenarioCard } from './ScenarioCard';
import { ScenarioCardAlt } from './ScenarioCardAlt';

import type { Meta, StoryObj } from '@storybook/react';
import type { ScenarioWithRelations } from '../interface';

const baseScenario = {
  scenarioId: 's1',
  name: '海辺のあいまいな約束',
  description:
    '夏の海辺の町を舞台にした、探索とRPを中心としたシナリオです。とある約束にまつわる、些細で大切な物語。',
  minPlayer: 3,
  maxPlayer: 4,
  minPlaytime: 180,
  maxPlaytime: 300,
  scenarioImageUrl: null,
  system: { systemId: 'coc6', name: 'CoC 6版' },
  tags: [
    { tagId: 't1', name: 'クローズド', color: 'oklch(0.674 0.103 20)' },
    { tagId: 't2', name: '現代日本', color: 'oklch(0.674 0.103 245)' },
    { tagId: 't3', name: '青春', color: 'oklch(0.674 0.103 312)' },
  ],
} as unknown as ScenarioWithRelations;

const meta = {
  title: 'Scenarios/ScenarioCardAlt',
  component: ScenarioCardAlt,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof ScenarioCardAlt>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 単体（人気バッジ）
 */
export const Default: Story = {
  args: {
    scenario: baseScenario,
    badge: { label: '人気', variant: 'recruiting' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * バッジ各種（人気/新着/おすすめ/なし）。狭い画面では折り返す。
 */
export const Badges: Story = {
  args: { scenario: baseScenario },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <ScenarioCardAlt
          scenario={baseScenario}
          badge={{ label: '人気', variant: 'recruiting' }}
        />
      </div>
      <div style={{ width: 220, flexShrink: 0 }}>
        <ScenarioCardAlt
          scenario={baseScenario}
          badge={{ label: '新着', variant: 'neutral' }}
        />
      </div>
      <div style={{ width: 220, flexShrink: 0 }}>
        <ScenarioCardAlt
          scenario={baseScenario}
          badge={{ label: 'おすすめ', variant: 'warning' }}
        />
      </div>
      <div style={{ width: 220, flexShrink: 0 }}>
        <ScenarioCardAlt scenario={baseScenario} />
      </div>
    </div>
  ),
};

/**
 * 現行 vs Alt の比較（同データ）。狭い画面では縦に積まれる。
 */
export const Comparison: Story = {
  args: { scenario: baseScenario },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      <div style={{ width: 280, maxWidth: '100%', flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          現行 ScenarioCard
        </p>
        <ScenarioCard scenario={baseScenario} />
      </div>
      <div style={{ width: 280, maxWidth: '100%', flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          Alt（ノッチ無し/バッジ/フルブリード/概要なし）
        </p>
        <ScenarioCardAlt
          scenario={baseScenario}
          badge={{ label: '人気', variant: 'recruiting' }}
        />
      </div>
    </div>
  ),
};

/**
 * Alt をグリッドで複数（実リスト想定・レスポンシブ）
 */
export const Grid: Story = {
  args: { scenario: baseScenario },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 20,
      }}
    >
      <ScenarioCardAlt
        scenario={baseScenario}
        badge={{ label: '人気', variant: 'recruiting' }}
      />
      <ScenarioCardAlt
        scenario={{ ...baseScenario, name: '黄昏の街で、きみに問う' }}
        badge={{ label: '新着', variant: 'neutral' }}
      />
      <ScenarioCardAlt
        scenario={{ ...baseScenario, name: '夢のつづきは、花のあとで' }}
        badge={{ label: 'おすすめ', variant: 'warning' }}
      />
      <ScenarioCardAlt scenario={baseScenario} />
      <ScenarioCardAlt scenario={{ ...baseScenario, name: '雨上がりに君と' }} />
      <ScenarioCardAlt scenario={{ ...baseScenario, name: '終末にさよなら' }} />
    </div>
  ),
};

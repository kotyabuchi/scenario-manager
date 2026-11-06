import { ScenarioCard } from './ScenarioCard';

import type { Meta, StoryObj } from '@storybook/react';
import type { ScenarioWithRelations } from '../interface';

// モックデータ（型の全フィールドは持たないため Story 用にキャスト）
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
  title: 'Scenarios/ScenarioCard',
  component: ScenarioCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScenarioCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト（画像なし＝プレースホルダー、カラータグ）
 */
export const Default: Story = {
  args: { scenario: baseScenario },
};

/**
 * 色未設定タグ（グレーにフォールバック）
 */
export const TagsWithoutColor: Story = {
  args: {
    scenario: {
      ...baseScenario,
      tags: [
        { tagId: 't1', name: 'クローズド', color: null },
        { tagId: 't2', name: '未分類', color: null },
      ],
    } as unknown as ScenarioWithRelations,
  },
};

/**
 * 長いタイトル＋多数タグ（3件で打ち切り）
 */
export const LongTitleManyTags: Story = {
  args: {
    scenario: {
      ...baseScenario,
      name: '終わらない夏のループの果てに、きみと交わした約束のかけら',
      tags: [
        { tagId: 't1', name: 'クローズド', color: 'oklch(0.674 0.103 20)' },
        { tagId: 't2', name: '現代日本', color: 'oklch(0.674 0.103 245)' },
        { tagId: 't3', name: '青春', color: 'oklch(0.674 0.103 312)' },
        { tagId: 't4', name: '感動', color: 'oklch(0.674 0.103 90)' },
        { tagId: 't5', name: '切ない', color: 'oklch(0.674 0.103 282)' },
      ],
    } as unknown as ScenarioWithRelations,
  },
};

/**
 * 概要なし・タグなし（最小）
 */
export const Minimal: Story = {
  args: {
    scenario: {
      ...baseScenario,
      description: null,
      tags: [],
    } as unknown as ScenarioWithRelations,
  },
};

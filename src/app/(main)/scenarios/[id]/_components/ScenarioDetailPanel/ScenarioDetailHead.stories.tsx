import { ScenarioDetailHead } from './ScenarioDetailHead';

import type { Meta, StoryObj } from '@storybook/react';
import type { ScenarioDetail } from '../../interface';

const base = {
  scenarioId: 'scn_01',
  name: '海辺のあいまいな約束',
  author: '名無しのGM',
  description:
    '海辺の街の不思議な噂を追う、探索とRPを中心とした現代日本クローズドシナリオです。',
  scenarioImageUrl: 'https://picsum.photos/seed/umibe/600/450',
  distributeUrl: 'https://example.com',
  sourceType: 'manual',
  minPlayer: 3,
  maxPlayer: 4,
  minPlaytime: 180,
  maxPlaytime: 300,
  handoutType: 'SECRET',
  system: { name: 'CoC 6版' },
  tags: [
    { tagId: 't1', name: 'クローズド', color: 'oklch(0.65 0.15 25)' },
    { tagId: 't2', name: '現代日本', color: 'oklch(0.65 0.13 250)' },
    { tagId: 't3', name: '青春', color: 'oklch(0.70 0.12 150)' },
    { tagId: 't4', name: 'RP重視', color: 'oklch(0.62 0.14 310)' },
  ],
  avgRating: 4.2,
  reviewCount: 12,
} as unknown as ScenarioDetail;

const meta = {
  title: 'Scenarios/ScenarioDetailHead',
  component: ScenarioDetailHead,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--colors-white)',
          padding: 24,
          maxWidth: 760,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScenarioDetailHead>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 画像あり（通常）。新着バッジ＋評価 */
export const Default: Story = {
  args: { scenario: base, badges: [{ label: '新着', variant: 'success' }] },
};

/** 画像なし（プレースホルダー） */
export const NoImage: Story = {
  args: {
    scenario: { ...base, scenarioImageUrl: null } as unknown as ScenarioDetail,
  },
};

/** 複数バッジ（左寄せ）＋評価（右寄せ・縮小なし） */
export const WithBadges: Story = {
  args: {
    scenario: base,
    badges: [
      { label: '新着', variant: 'success' },
      { label: '募集中', variant: 'recruiting' },
    ],
  },
};

/** 評価・概要なし（最小） */
export const Minimal: Story = {
  args: {
    scenario: {
      ...base,
      description: null,
      avgRating: null,
      author: null,
      tags: [],
    } as unknown as ScenarioDetail,
  },
};

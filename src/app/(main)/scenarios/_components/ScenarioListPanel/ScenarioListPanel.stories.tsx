import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

import { createScenario, scenarios, systems, tags } from './fixtures';
import { ScenarioListPanel } from './ScenarioListPanel';
import { useScenarioListFixture } from './useScenarioListFixture';

import type { Meta, StoryObj } from '@storybook/react';
import type { ScenarioWithRelations } from '../../interface';

type PreviewProps = {
  paginated?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  items?: ScenarioWithRelations[];
  width?: number | string;
};

/** 実際のドラフトフックと、通信なしの一覧データを組み合わせた操作用fixture。 */
const InteractivePanel = ({
  paginated = false,
  isLoading = false,
  isLoadingMore = false,
  items = scenarios,
  width = 680,
}: PreviewProps) => {
  const listProps = useScenarioListFixture(items, paginated);

  return (
    <div style={{ width, maxWidth: '100%' }}>
      <ScenarioListPanel
        systems={systems}
        tags={tags}
        {...listProps}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
};

const meta = {
  title: 'Scenarios/ScenarioListPanel',
  component: InteractivePanel,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <NuqsTestingAdapter hasMemory>
        <div style={{ background: 'var(--colors-canvas)', padding: 24 }}>
          <Story />
        </div>
      </NuqsTestingAdapter>
    ),
  ],
} satisfies Meta<typeof InteractivePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithLoadMore: Story = { args: { paginated: true } };
export const LoadingMore: Story = {
  args: { paginated: true, isLoadingMore: true },
};
export const Loading: Story = { args: { isLoading: true } };
export const Empty: Story = { args: { items: [] } };
export const Wide: Story = { args: { width: '100%' } };
export const LongContent: Story = {
  args: {
    width: 360,
    items: [
      createScenario({
        name: 'これは長いシナリオ名が折り返されても検索結果から詳細ページへ進めることを確認する物語',
        description: '概要が長い場合も、カードから詳細へ移動できます。'.repeat(
          12,
        ),
        scenarioImageUrl: null,
        minPlayer: null,
        maxPlayer: null,
        minPlaytime: null,
        maxPlaytime: null,
      }),
    ],
  },
};

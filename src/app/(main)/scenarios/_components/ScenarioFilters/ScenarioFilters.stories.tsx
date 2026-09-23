import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

import { systems, tags } from '../ScenarioListPanel/fixtures';
import { ScenarioFilters, type ScenarioFiltersProps } from './ScenarioFilters';

import { useFilterDraft } from '@/components/blocks/FilterPanel';

import type { Meta, StoryObj } from '@storybook/react';

const DraftFilters = (props: Omit<ScenarioFiltersProps, 'draftState'>) => (
  <ScenarioFilters {...props} draftState={useFilterDraft()} />
);

const InteractiveFilters = ({
  initialSearchParams = '',
  ...props
}: Omit<ScenarioFiltersProps, 'draftState'> & {
  initialSearchParams?: string;
}) => (
  <NuqsTestingAdapter searchParams={initialSearchParams} hasMemory>
    <DraftFilters {...props} />
  </NuqsTestingAdapter>
);

const meta = {
  title: 'Scenarios/ScenarioFilters',
  component: InteractiveFilters,
  tags: ['autodocs'],
  args: { systems, tags },
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--colors-canvas)', padding: 24 }}>
        <div style={{ maxWidth: 760, width: '100%' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof InteractiveFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 入力と選択を編集し、「この条件で検索」で確定できる。 */
export const Collapsed: Story = {};

export const Expanded: Story = { args: { defaultExpanded: true } };

export const WithActiveFilters: Story = {
  args: {
    initialSearchParams:
      '?systems=coc7&tags=closed,horror&q=海辺&minPlayer=3&maxPlayer=5&minPlaytime=4&maxPlaytime=8',
    defaultExpanded: true,
  },
};

export const KeywordOnly: Story = {
  args: { initialSearchParams: '?q=海辺' },
};

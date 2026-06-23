import { ScenarioFilters } from './ScenarioFilters';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  SystemItem,
  TagItem,
  UseFilterDraftReturn,
} from '@/components/blocks/FilterPanel';

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

type DraftOver = {
  systems?: string[];
  tags?: string[];
  q?: string;
};

const emptyParams = {
  systems: [],
  tags: [],
  minPlayer: null,
  maxPlayer: null,
  minPlaytime: null,
  maxPlaytime: null,
  q: '',
};

const mkDraft = (over: DraftOver = {}): UseFilterDraftReturn => {
  const params = { ...emptyParams, ...over };
  return {
    mode: 'draft',
    params,
    draft: params,
    committed: emptyParams,
    isPending: false,
    isDirty: false,
    activeFilterCount: (over.systems?.length ?? 0) + (over.tags?.length ?? 0),
    toggleSystem: () => {},
    setSystems: () => {},
    toggleTag: () => {},
    setPlayerRange: () => {},
    setPlaytimeRange: () => {},
    setKeyword: () => {},
    clearAll: () => {},
    commit: () => {},
  } as unknown as UseFilterDraftReturn;
};

const meta = {
  title: 'Scenarios/ScenarioFilters',
  component: ScenarioFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--colors-canvas)', padding: 24 }}>
        <div style={{ maxWidth: 760, width: '100%' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ScenarioFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 折りたたみ（基本行のみ）
 */
export const Collapsed: Story = {
  args: { systems, tags, draftState: mkDraft() },
};

/**
 * 詳細フィルター展開
 */
export const Expanded: Story = {
  args: { systems, tags, draftState: mkDraft(), defaultExpanded: true },
};

/**
 * フィルター適用中（バッジ・クリア表示、選択チップ）
 */
export const WithActiveFilters: Story = {
  args: {
    systems,
    tags,
    draftState: mkDraft({ systems: ['coc7'], tags: ['t1', 't4'], q: '海辺' }),
    defaultExpanded: true,
  },
};

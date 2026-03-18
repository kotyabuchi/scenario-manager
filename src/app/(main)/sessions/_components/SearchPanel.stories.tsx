import { fn } from '@storybook/test';

import { createScenarioSystem } from '../__mocks__/sessionMocks';
import { SearchPanel } from './SearchPanel';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/一覧/SearchPanel',
  component: SearchPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof SearchPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockSystems = [
  createScenarioSystem({
    systemId: '01HSYSTEM00000000000000001',
    name: 'クトゥルフ神話TRPG',
  }),
  createScenarioSystem({
    systemId: '01HSYSTEM00000000000000002',
    name: 'ダブルクロス',
  }),
  createScenarioSystem({
    systemId: '01HSYSTEM00000000000000003',
    name: 'アリアンロッド',
  }),
];

/**
 * 全フィルタ未選択の初期状態
 */
export const Default: Story = {
  args: {
    systems: mockSystems,
    selectedSystems: [],
    selectedPhases: [],
    dateFrom: '',
    dateTo: '',
    scenarioName: '',
    onSearch: fn(),
  },
};

/**
 * システムとフェーズ選択済み、シナリオ名入力済みの状態
 */
export const WithFilters: Story = {
  args: {
    systems: mockSystems,
    selectedSystems: [
      '01HSYSTEM00000000000000001',
      '01HSYSTEM00000000000000002',
    ],
    selectedPhases: ['RECRUITING', 'PREPARATION'],
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    scenarioName: '深淵の呼び声',
    onSearch: fn(),
  },
};

import { fn } from '@storybook/test';

import { createScenarioSystem } from '../__mocks__/sessionMocks';
import { FilterPanel } from './FilterPanel';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/一覧/FilterPanel',
  component: FilterPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    systems: [
      createScenarioSystem(),
      createScenarioSystem({
        systemId: '01HSYSTEM00000000000000002',
        name: 'インセイン',
      }),
      createScenarioSystem({
        systemId: '01HSYSTEM00000000000000003',
        name: 'エモクロアTRPG',
      }),
    ],
    selectedRoles: [],
    selectedStatuses: [],
    selectedSystems: [],
    onFilterChange: fn(),
  },
};

export const WithSelections: Story = {
  args: {
    systems: [
      createScenarioSystem(),
      createScenarioSystem({
        systemId: '01HSYSTEM00000000000000002',
        name: 'インセイン',
      }),
    ],
    selectedRoles: ['keeper'],
    selectedStatuses: ['completed'],
    selectedSystems: ['01HSYSTEM00000000000000001'],
    onFilterChange: fn(),
  },
};

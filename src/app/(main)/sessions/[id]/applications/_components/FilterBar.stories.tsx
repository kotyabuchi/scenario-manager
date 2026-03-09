import { FilterBar } from './FilterBar';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    searchQuery: '',
    onSearchChange: () => {},
    sortValue: 'newest',
    onSortChange: () => {},
    filterValue: 'all',
    onFilterChange: () => {},
  },
};

export const WithSearchQuery: Story = {
  args: {
    searchQuery: '山田',
    onSearchChange: () => {},
    sortValue: 'newest',
    onSortChange: () => {},
    filterValue: 'all',
    onFilterChange: () => {},
  },
};

export const FilteredPending: Story = {
  args: {
    searchQuery: '',
    onSearchChange: () => {},
    sortValue: 'oldest',
    onSortChange: () => {},
    filterValue: 'pending',
    onFilterChange: () => {},
  },
};

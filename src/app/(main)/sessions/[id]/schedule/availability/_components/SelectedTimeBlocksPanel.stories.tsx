import { fn } from '@storybook/test';

import { SelectedTimeBlocksPanel } from './SelectedTimeBlocksPanel';

import type { Meta, StoryObj } from '@storybook/react';
import type { AvailabilityTimeBlockInput } from '../interface';

const sampleTimeBlocks: AvailabilityTimeBlockInput[] = [
  {
    startAt: '2026-03-15T13:00:00.000Z',
    endAt: '2026-03-15T16:00:00.000Z',
  },
  {
    startAt: '2026-03-16T18:00:00.000Z',
    endAt: '2026-03-16T22:00:00.000Z',
  },
  {
    startAt: '2026-03-22T10:00:00.000Z',
    endAt: '2026-03-22T13:00:00.000Z',
  },
];

const meta = {
  title: 'Sessions/日程調整/SelectedTimeBlocksPanel',
  component: SelectedTimeBlocksPanel,
  tags: ['autodocs'],
  args: {
    minPlaytimeMinutes: 360,
    onRemoveTimeBlock: fn(),
  },
} satisfies Meta<typeof SelectedTimeBlocksPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default（複数タイムブロック選択済み）',
  args: {
    timeBlocks: sampleTimeBlocks,
  },
};

export const Empty: Story = {
  name: 'Empty（タイムブロックなし）',
  args: {
    timeBlocks: [],
  },
};

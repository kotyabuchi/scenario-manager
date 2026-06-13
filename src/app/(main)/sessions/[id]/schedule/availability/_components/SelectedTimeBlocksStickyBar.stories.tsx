import { SelectedTimeBlocksStickyBar } from './SelectedTimeBlocksStickyBar';

import {
  BottomNavSlotProvider,
  useBottomNavSlotTarget,
} from '@/hooks/useBottomNavSlot';

import type { Meta, StoryObj } from '@storybook/react';
import type { AvailabilityTimeBlockInput } from '../interface';

/** Storybook/テスト用: BottomNavSlotPortal の描画先を提供する */
const BottomNavSlotTargetStub = () => {
  const ref = useBottomNavSlotTarget();
  return <div ref={ref} />;
};

const sampleTimeBlocks: AvailabilityTimeBlockInput[] = [
  {
    startAt: '2026-03-15T13:00:00.000Z',
    endAt: '2026-03-15T16:00:00.000Z',
  },
  {
    startAt: '2026-03-16T18:00:00.000Z',
    endAt: '2026-03-16T22:00:00.000Z',
  },
];

const meta = {
  title: 'Sessions/日程調整/SelectedTimeBlocksStickyBar',
  component: SelectedTimeBlocksStickyBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BottomNavSlotProvider>
        <div style={{ minHeight: '200px', padding: 24, background: '#eef2f5' }}>
          <Story />
        </div>
        <BottomNavSlotTargetStub />
      </BottomNavSlotProvider>
    ),
  ],
  args: {
    primaryActionLabel: 'スケジュールを提出',
    minPlaytimeMinutes: 360,
  },
} satisfies Meta<typeof SelectedTimeBlocksStickyBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default（選択済みブロックあり）',
  args: {
    timeBlocks: sampleTimeBlocks,
    sidebarToggleLabel: '選択中の日程',
    sidebarOpen: false,
    primaryDisabled: false,
  },
};

export const Empty: Story = {
  name: 'Empty（タイムブロックなし）',
  args: {
    timeBlocks: [],
    sidebarToggleLabel: '選択中の日程',
    sidebarOpen: false,
    primaryDisabled: true,
  },
};

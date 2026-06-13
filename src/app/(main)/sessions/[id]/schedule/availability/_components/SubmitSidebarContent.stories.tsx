import { fn } from '@storybook/test';

import { SubmitSidebarContent } from './SubmitSidebarContent';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  AvailabilityTimeBlockInput,
  AvailabilityTimeBlockWithUser,
} from '../interface';

const makeIso = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) => new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)).toISOString();

const myTimeBlocks: AvailabilityTimeBlockInput[] = [
  {
    startAt: makeIso(2026, 3, 1, 12),
    endAt: makeIso(2026, 3, 1, 15),
  },
];

const otherUserTimeBlocks: AvailabilityTimeBlockWithUser[] = [
  {
    availabilityTimeBlockId: '01JAVAIL000000000000000001',
    sessionId: '01JSESSIONAVAILTEST0000000001',
    userId: '01JUSERKEEPER0000000000001',
    startAt: makeIso(2026, 3, 1, 12),
    endAt: makeIso(2026, 3, 1, 15),
    createdAt: makeIso(2026, 2, 1, 10),
    updatedAt: makeIso(2026, 2, 1, 10),
    userName: 'GM 佐藤',
    participantType: 'KEEPER',
    isHost: true,
  },
  {
    availabilityTimeBlockId: '01JAVAIL000000000000000002',
    sessionId: '01JSESSIONAVAILTEST0000000001',
    userId: '01JUSERPLAYER0000000000001',
    startAt: makeIso(2026, 3, 1, 18),
    endAt: makeIso(2026, 3, 1, 22),
    createdAt: makeIso(2026, 2, 1, 10),
    updatedAt: makeIso(2026, 2, 1, 10),
    userName: 'PL 田中',
    participantType: 'PLAYER',
    isHost: false,
  },
  {
    availabilityTimeBlockId: '01JAVAIL000000000000000003',
    sessionId: '01JSESSIONAVAILTEST0000000001',
    userId: '01JUSERSPECT0000000000001',
    startAt: makeIso(2026, 3, 1, 12),
    endAt: makeIso(2026, 3, 1, 14),
    createdAt: makeIso(2026, 2, 1, 10),
    updatedAt: makeIso(2026, 2, 1, 10),
    userName: '見学 鈴木',
    participantType: 'SPECTATOR',
    isHost: false,
  },
];

const meta = {
  title: 'Sessions/日程調整/SubmitSidebarContent',
  component: SubmitSidebarContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onClickTimeBlock: fn(),
  },
} satisfies Meta<typeof SubmitSidebarContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    myTimeBlocks,
    otherUserTimeBlocks,
  },
};

export const Empty: Story = {
  args: {
    myTimeBlocks: [],
    otherUserTimeBlocks: [],
  },
};

export const WithError: Story = {
  args: {
    myTimeBlocks,
    otherUserTimeBlocks,
    errorMessage: '保存中にエラーが発生しました。再度お試しください。',
  },
};

import { fn } from '@storybook/test';

import { ConfirmSidebarContent } from './ConfirmSidebarContent';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  AvailabilityTimeBlockInput,
  RecommendationGroup,
} from '../interface';

const makeIso = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) => new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)).toISOString();

const selectedTimeBlocks: AvailabilityTimeBlockInput[] = [
  {
    startAt: makeIso(2026, 3, 1, 12),
    endAt: makeIso(2026, 3, 1, 15),
  },
];

const recommendationGroups: RecommendationGroup[] = [
  {
    group: 'all_users',
    title: '全ユーザー参加できる候補',
    items: [
      {
        recommendationId: 'rec-1',
        kind: 'single',
        group: 'all_users',
        timeBlocks: [
          {
            startAt: makeIso(2026, 3, 1, 12),
            endAt: makeIso(2026, 3, 1, 15),
          },
        ],
        totalMinutes: 180,
        meetsMinPlaytime: false,
        coverage: {
          totalRequiredUsers: 3,
          totalSpectators: 1,
          coveredRequiredUsers: 3,
          coveredSpectators: 1,
        },
        reasonLabels: ['全ユーザー参加可', '共通 3時間'],
        rankingScore: {
          priorityBucket: 1,
          durationMinutes: 180,
          compactnessScore: 0,
        },
      },
    ],
  },
  {
    group: 'required_users_only',
    title: '見学者を除けば参加できる候補',
    note: 'ここから下は見学者が参加できない候補です',
    items: [
      {
        recommendationId: 'rec-2',
        kind: 'single',
        group: 'required_users_only',
        timeBlocks: [
          {
            startAt: makeIso(2026, 3, 1, 18),
            endAt: makeIso(2026, 3, 1, 22),
          },
        ],
        totalMinutes: 240,
        meetsMinPlaytime: false,
        coverage: {
          totalRequiredUsers: 3,
          totalSpectators: 1,
          coveredRequiredUsers: 3,
          coveredSpectators: 0,
        },
        reasonLabels: ['見学者を除けば全員参加可', '共通 4時間'],
        rankingScore: {
          priorityBucket: 1,
          durationMinutes: 240,
          compactnessScore: 0,
        },
      },
      {
        recommendationId: 'rec-3',
        kind: 'combo',
        group: 'required_users_only',
        timeBlocks: [
          {
            startAt: makeIso(2026, 3, 1, 18),
            endAt: makeIso(2026, 3, 1, 22),
          },
          {
            startAt: makeIso(2026, 3, 2, 21),
            endAt: makeIso(2026, 3, 3, 1),
          },
        ],
        totalMinutes: 480,
        meetsMinPlaytime: true,
        coverage: {
          totalRequiredUsers: 3,
          totalSpectators: 1,
          coveredRequiredUsers: 3,
          coveredSpectators: 0,
        },
        reasonLabels: ['2件で最低プレイ時間を満たす', '合計 8時間'],
        rankingScore: {
          priorityBucket: 2,
          durationMinutes: 480,
          compactnessScore: -600,
        },
      },
    ],
  },
];

const meta = {
  title: 'Sessions/日程調整/ConfirmSidebarContent',
  component: ConfirmSidebarContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onClickRecommendation: fn(),
  },
} satisfies Meta<typeof ConfirmSidebarContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groups: recommendationGroups,
    selectedTimeBlocks,
  },
};

export const NoCandidates: Story = {
  args: {
    groups: [],
    selectedTimeBlocks: [],
  },
};

export const WithError: Story = {
  args: {
    groups: recommendationGroups,
    selectedTimeBlocks,
    errorMessage: '候補の取得中にエラーが発生しました。',
  },
};

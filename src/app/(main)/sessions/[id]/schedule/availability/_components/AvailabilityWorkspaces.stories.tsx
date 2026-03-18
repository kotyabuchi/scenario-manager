import { useMemo } from 'react';

import { ConfirmAvailabilityWorkspace } from './ConfirmAvailabilityWorkspace';
import { SubmitAvailabilityWorkspace } from './SubmitAvailabilityWorkspace';

import {
  BottomNavSlotProvider,
  useBottomNavSlotTarget,
} from '@/hooks/useBottomNavSlot';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  AvailabilityWorkspaceData,
  RecommendationGroup,
} from '../interface';

/** Storybook/テスト用: BottomNavSlotPortal の描画先を提供する */
const BottomNavSlotTargetStub = () => {
  const ref = useBottomNavSlotTarget();
  return <div ref={ref} />;
};

const makeIso = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) => new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)).toISOString();

const workspaceDataBase: AvailabilityWorkspaceData = {
  sessionId: '01JSESSIONAVAILTEST0000000001',
  sessionName: '雪山密室セッション',
  minPlaytimeMinutes: 360,
  currentUserId: '01JUSERCURRENT0000000000001',
  currentUserParticipantType: 'PLAYER',
  currentUserIsHost: false,
  myAvailabilityTimeBlocks: [
    {
      availabilityTimeBlockId: '01JAVAIL000000000000000001',
      sessionId: '01JSESSIONAVAILTEST0000000001',
      userId: '01JUSERCURRENT0000000000001',
      startAt: makeIso(2026, 3, 1, 12),
      endAt: makeIso(2026, 3, 1, 15),
      createdAt: makeIso(2026, 2, 1, 10),
      updatedAt: makeIso(2026, 2, 1, 10),
    },
  ],
  otherUserAvailabilityTimeBlocks: [
    {
      availabilityTimeBlockId: '01JAVAIL000000000000000002',
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
      availabilityTimeBlockId: '01JAVAIL000000000000000003',
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
      availabilityTimeBlockId: '01JAVAIL000000000000000004',
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
    {
      availabilityTimeBlockId: '01JAVAIL000000000000000005',
      sessionId: '01JSESSIONAVAILTEST0000000001',
      userId: '01JUSERPLAYER0000000000002',
      startAt: makeIso(2026, 3, 2, 21),
      endAt: makeIso(2026, 3, 3, 1),
      createdAt: makeIso(2026, 2, 1, 10),
      updatedAt: makeIso(2026, 2, 1, 10),
      userName: 'PL 高橋',
      participantType: 'PLAYER',
      isHost: false,
    },
  ],
  confirmedScheduleTimeBlocks: [
    {
      gameScheduleTimeBlockId: '01JCONFIRMSLOT000000000001',
      sessionId: '01JSESSIONAVAILTEST0000000001',
      startAt: makeIso(2026, 3, 1, 12),
      endAt: makeIso(2026, 3, 1, 15),
      blockOrder: 1,
      createdAt: makeIso(2026, 2, 3, 10),
      updatedAt: makeIso(2026, 2, 3, 10),
      createdBy: '01JUSERKEEPER0000000000001',
    },
  ],
};

const recommendationGroupsBase: RecommendationGroup[] = [
  {
    group: 'all_users',
    title: '全ユーザー参加できる候補',
    items: [
      {
        recommendationId: 'rec-1',
        kind: 'single',
        group: 'all_users',
        timeBlocks: [
          { startAt: makeIso(2026, 3, 1, 12), endAt: makeIso(2026, 3, 1, 15) },
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
          { startAt: makeIso(2026, 3, 1, 18), endAt: makeIso(2026, 3, 1, 22) },
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
          { startAt: makeIso(2026, 3, 1, 18), endAt: makeIso(2026, 3, 1, 22) },
          { startAt: makeIso(2026, 3, 2, 21), endAt: makeIso(2026, 3, 3, 1) },
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
  title: 'Sessions/日程調整/AvailabilityWorkspaces',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BottomNavSlotProvider>
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: '#eef2f5',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <Story />
          </div>
        </div>
        <BottomNavSlotTargetStub />
      </BottomNavSlotProvider>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Submit: Story = {
  render: () => {
    const data = useMemo(() => workspaceDataBase, []);
    return <SubmitAvailabilityWorkspace workspaceData={data} />;
  },
};

export const Confirm: Story = {
  render: () => {
    const data = useMemo(
      () => ({
        ...workspaceDataBase,
        currentUserIsHost: true,
        currentUserParticipantType: 'KEEPER' as const,
      }),
      [],
    );
    const groups = useMemo(() => recommendationGroupsBase, []);
    return (
      <ConfirmAvailabilityWorkspace
        workspaceData={data}
        recommendationGroups={groups}
      />
    );
  },
};

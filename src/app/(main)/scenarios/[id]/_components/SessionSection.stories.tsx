import { SessionSection } from './SessionSection';

import type { Meta, StoryObj } from '@storybook/react';
import type { SessionWithKeeper } from '../interface';

const meta = {
  title: 'Scenarios/Detail/SessionSection',
  component: SessionSection,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'gray',
      values: [{ name: 'gray', value: '#F9FAFB' }],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ
const mockSessions: SessionWithKeeper[] = [
  {
    gameSessionId: 'session-1',
    sessionName: 'はじめてのCoC',
    scenarioId: 'scenario-1',
    sessionPhase: 'RECRUITING',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    keeper: {
      userId: 'user-1',
      nickname: 'たろう',
      image: null,
    },
    participantCount: 3,
    scheduleDate: new Date('2024-02-10'),
  },
  {
    gameSessionId: 'session-2',
    sessionName: '',
    scenarioId: 'scenario-1',
    sessionPhase: 'IN_PROGRESS',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    keeper: {
      userId: 'user-2',
      nickname: 'はなこ',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hanako',
    },
    participantCount: 5,
    scheduleDate: new Date('2024-01-20'),
  },
  {
    gameSessionId: 'session-3',
    sessionName: '初心者歓迎卓',
    scenarioId: 'scenario-1',
    sessionPhase: 'RECRUITING',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    keeper: {
      userId: 'user-3',
      nickname: 'じろう',
      image: null,
    },
    participantCount: 2,
    scheduleDate: null,
  },
  {
    gameSessionId: 'session-4',
    sessionName: '経験者向け',
    scenarioId: 'scenario-1',
    sessionPhase: 'COMPLETED',
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2023-12-20'),
    keeper: null,
    participantCount: 4,
    scheduleDate: new Date('2024-01-05'),
  },
];

/**
 * 複数のセッションがある状態
 */
export const Default: Story = {
  args: {
    scenarioId: 'scenario-1',
    sessions: mockSessions,
  },
};

/**
 * セッションが1件のみ
 */
export const SingleSession: Story = {
  args: {
    scenarioId: 'scenario-1',
    sessions: mockSessions.slice(0, 1),
  },
};

/**
 * セッションがない状態（空状態）
 */
export const Empty: Story = {
  args: {
    scenarioId: 'scenario-1',
    sessions: [],
  },
};

/**
 * 多数のセッションがある状態（横スクロール確認用）
 */
export const ManySession: Story = {
  args: {
    scenarioId: 'scenario-1',
    sessions: [
      ...mockSessions,
      {
        gameSessionId: 'session-5',
        sessionName: '週末卓',
        scenarioId: 'scenario-1',
        sessionPhase: 'RECRUITING',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
        keeper: {
          userId: 'user-5',
          nickname: 'さぶろう',
          image: null,
        },
        participantCount: 1,
        scheduleDate: new Date('2024-02-15'),
      },
      {
        gameSessionId: 'session-6',
        sessionName: '平日夜卓',
        scenarioId: 'scenario-1',
        sessionPhase: 'RECRUITING',
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-19'),
        keeper: {
          userId: 'user-6',
          nickname: 'しろう',
          image: null,
        },
        participantCount: 2,
        scheduleDate: new Date('2024-02-20'),
      },
    ],
  },
};

import { VideoSection } from './VideoSection';

import type { Meta, StoryObj } from '@storybook/react';
import type { VideoLinkWithSession } from '../interface';

const meta = {
  title: 'Scenarios/Detail/VideoSection',
  component: VideoSection,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ
const mockVideos: VideoLinkWithSession[] = [
  {
    videoLinkId: 'video-1',
    scenarioId: 'scenario-1',
    sessionId: 'session-1',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spoiler: false,
    createdById: 'user-1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    session: {
      gameSessionId: 'session-1',
    },
    user: {
      userId: 'user-1',
      nickname: 'たろう',
    },
  },
  {
    videoLinkId: 'video-2',
    scenarioId: 'scenario-1',
    sessionId: 'session-2',
    videoUrl: 'https://youtu.be/jNQXAC9IVRw',
    spoiler: true,
    createdById: 'user-2',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
    session: {
      gameSessionId: 'session-2',
    },
    user: {
      userId: 'user-2',
      nickname: 'はなこ',
    },
  },
  {
    videoLinkId: 'video-3',
    scenarioId: 'scenario-1',
    sessionId: 'session-3',
    videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    spoiler: false,
    createdById: 'user-3',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05',
    session: {
      gameSessionId: 'session-3',
    },
    user: {
      userId: 'user-3',
      nickname: 'じろう',
    },
  },
  {
    videoLinkId: 'video-4',
    scenarioId: 'scenario-1',
    sessionId: 'session-4',
    videoUrl: 'https://www.nicovideo.jp/watch/sm9',
    spoiler: true,
    createdById: 'user-4',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    session: {
      gameSessionId: 'session-4',
    },
    user: {
      userId: 'user-4',
      nickname: 'さぶろう',
    },
  },
];

/**
 * 複数の動画がある状態（ネタバレあり/なし混在）
 */
export const Default: Story = {
  args: {
    videos: mockVideos,
    isPlayed: true,
  },
};

/**
 * ネタバレなしの動画のみ
 */
export const NoSpoilers: Story = {
  args: {
    videos: mockVideos.filter((v) => !v.spoiler),
    isPlayed: true,
  },
};

/**
 * 動画が1件のみ
 */
export const SingleVideo: Story = {
  args: {
    videos: mockVideos.slice(0, 1),
    isPlayed: true,
  },
};

/**
 * 動画がない状態（プレイ済み）
 */
export const EmptyPlayed: Story = {
  args: {
    videos: [],
    isPlayed: true,
  },
};

/**
 * 動画がない状態（未プレイ）
 */
export const EmptyNotPlayed: Story = {
  args: {
    videos: [],
    isPlayed: false,
  },
};

/**
 * 多数の動画がある状態（横スクロール確認用）
 */
export const ManyVideos: Story = {
  args: {
    videos: [
      ...mockVideos,
      {
        videoLinkId: 'video-5',
        scenarioId: 'scenario-1',
        sessionId: 'session-5',
        videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        spoiler: false,
        createdById: 'user-5',
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20',
        session: { gameSessionId: 'session-5' },
        user: { userId: 'user-5', nickname: 'しろう' },
      },
      {
        videoLinkId: 'video-6',
        scenarioId: 'scenario-1',
        sessionId: 'session-6',
        videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        spoiler: false,
        createdById: 'user-6',
        createdAt: '2024-01-21',
        updatedAt: '2024-01-21',
        session: { gameSessionId: 'session-6' },
        user: { userId: 'user-6', nickname: 'ごろう' },
      },
    ],
    isPlayed: true,
  },
};

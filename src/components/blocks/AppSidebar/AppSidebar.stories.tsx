import { AppSidebar } from './AppSidebar';

import { AuthProvider } from '@/context';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/scenarios',
      },
    },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={null} initialDiscordMeta={null}>
        <Story />
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof AppSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（未ログイン、scenarios画面アクティブ）
 */
export const Default: Story = {};

/**
 * ログイン済み（シナリオ登録CTA + ユーザーメニュー表示）
 */
export const LoggedIn: Story = {
  decorators: [
    (Story) => (
      <AuthProvider
        initialUser={{
          userId: 'storybook-user',
          discordId: 'discord-123',
          nickname: 'テストユーザー',
          avatar: null,
          role: 'MEMBER',
        }}
        initialDiscordMeta={null}
      >
        <Story />
      </AuthProvider>
    ),
  ],
};

/**
 * ホーム画面アクティブ
 */
export const HomePage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/home',
      },
    },
  },
};

/**
 * セッション画面アクティブ
 */
export const SessionsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/sessions',
      },
    },
  },
};

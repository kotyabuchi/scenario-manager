import { GlobalHeader } from './index';

import { AuthProvider } from '@/context';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/GlobalHeader',
  component: GlobalHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  // md以上では非表示（AppSidebarに置き換わる）のため、モバイルビューポートで確認する
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={null} initialDiscordMeta={null}>
        <Story />
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof GlobalHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（未ログイン）
 */
export const Default: Story = {};

/**
 * ログイン済み（アバター表示）
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

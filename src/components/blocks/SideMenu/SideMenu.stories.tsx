import { userEvent, within } from '@storybook/test';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { SideMenu } from './SideMenu';

import { AuthProvider } from '@/context';

import type { Meta, StoryObj } from '@storybook/react';
import type { AuthUser } from '@/context/auth-context';

// SideMenu は PC専用（lg以上）。スマホ等の狭い画面でも確認できるよう、
// 既定でデスクトップ幅のビューポートで描画する。
const desktopViewports = {
  desktop: {
    name: 'Desktop',
    styles: { width: '1280px', height: '900px' },
    type: 'desktop' as const,
  },
  ...INITIAL_VIEWPORTS,
};

const mockUser: AuthUser = {
  userId: 'u_1',
  discordId: 'd_1',
  nickname: 'はるか',
  avatar: null,
  role: 'MEMBER',
};

const meta = {
  title: 'Blocks/SideMenu',
  component: SideMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { options: desktopViewports },
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/home' },
    },
  },
  globals: {
    viewport: { value: 'desktop', isRotated: false },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={null} initialDiscordMeta={null}>
        <Story />
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof SideMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 未ログイン（ログインボタン表示）
 */
export const LoggedOut: Story = {};

/** サイドメニューを畳んだ状態でも開く操作を残す。 */
export const Collapsed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'サイドメニューを閉じる' }),
    );
  },
};

/**
 * ログイン済み（シナリオ登録 + ユーザー表示）
 */
export const LoggedIn: Story = {
  decorators: [
    (Story) => (
      <AuthProvider initialUser={mockUser} initialDiscordMeta={null}>
        <Story />
      </AuthProvider>
    ),
  ],
};

/**
 * シナリオ画面でアクティブ（ログイン済み）
 */
export const ActiveScenarios: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/scenarios' } },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={mockUser} initialDiscordMeta={null}>
        <Story />
      </AuthProvider>
    ),
  ],
};

/**
 * セッション画面でアクティブ（ログイン済み）
 */
export const ActiveSessions: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/sessions' } },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={mockUser} initialDiscordMeta={null}>
        <Story />
      </AuthProvider>
    ),
  ],
};

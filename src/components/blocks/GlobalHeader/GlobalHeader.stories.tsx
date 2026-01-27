import { GlobalHeader } from './index';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/GlobalHeader',
  component: GlobalHeader,
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
} satisfies Meta<typeof GlobalHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（未ログイン、scenarios画面）
 */
export const Default: Story = {};

/**
 * ホーム画面
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
 * シナリオ画面
 */
export const ScenariosPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/scenarios',
      },
    },
  },
};

/**
 * セッション画面
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

/**
 * ユーザー画面
 */
export const UsersPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/users',
      },
    },
  },
};

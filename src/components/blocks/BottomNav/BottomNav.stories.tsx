import { BottomNav } from './BottomNav';

import { AuthPromptProvider } from '@/components/blocks/AuthPrompt';
import { AuthProvider } from '@/context';
import { BottomNavSlotProvider } from '@/hooks/useBottomNavSlot';
import { styled } from '@/styled-system/jsx';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/scenarios' },
    },
  },
  decorators: [
    (Story) => (
      <AuthProvider initialUser={null} initialDiscordMeta={null}>
        <AuthPromptProvider>
          <BottomNavSlotProvider>
            <styled.div minHeight="[844px]" bg="bg.page">
              <Story />
            </styled.div>
          </BottomNavSlotProvider>
        </AuthPromptProvider>
      </AuthProvider>
    ),
  ],
} satisfies Meta<typeof BottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 未ログイン時。中央の「メニュー」からクイック操作を開ける。 */
export const Default: Story = {};

/** 現在のページに応じたアクティブ表示を確認する。 */
export const SessionsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/sessions' },
    },
  },
};

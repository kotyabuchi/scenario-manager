import { mockUpcomingSessions } from './_mocks';
import { HeroSection } from './HeroSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Dashboard/HeroSection',
  component: HeroSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** カウントダウンあり（次のセッションが存在） */
export const Default: Story = {
  args: {
    userName: 'たろう',
    nextSession: mockUpcomingSessions[0] ?? null,
  },
};

/** セッションなし */
export const NoSession: Story = {
  args: {
    userName: 'はなこ',
    nextSession: null,
  },
};

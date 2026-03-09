import { Breadcrumb } from './Breadcrumb';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'sessions/applications/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sessionId: 'session-123',
    sessionName: '古代遺跡の呼び声',
  },
};

export const LongSessionName: Story = {
  args: {
    sessionId: 'session-456',
    sessionName: '真夜中の図書館で起きた不思議な出来事についての調査依頼',
  },
};

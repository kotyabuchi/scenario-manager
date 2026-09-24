import { useState } from 'react';

import { EmptyState } from './EmptyState';

import { AuthPromptDialog } from '@/components/blocks/AuthPrompt';
import {
  AuthPromptContext,
  type AuthPromptRequest,
} from '@/components/blocks/AuthPrompt/authPromptContext';

import type { Meta, StoryObj } from '@storybook/react';

const EmptyStatePreview = (args: {
  type: 'upcoming' | 'history' | 'public';
  isLoggedIn?: boolean;
}) => {
  const [request, setRequest] = useState<AuthPromptRequest | null>(null);
  return (
    <AuthPromptContext value={setRequest}>
      <EmptyState {...args} />
      <AuthPromptDialog
        open={request !== null}
        request={request}
        onClose={() => setRequest(null)}
        onContinue={() => setRequest(null)}
      />
    </AuthPromptContext>
  );
};

const meta = {
  title: 'Sessions/一覧/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  render: (args) => <EmptyStatePreview {...args} />,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  args: {
    type: 'upcoming',
  },
};

export const History: Story = {
  args: {
    type: 'history',
  },
};

export const Public: Story = {
  args: {
    type: 'public',
  },
};

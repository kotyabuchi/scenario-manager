import { useState } from 'react';

import { HomeGuest } from './HomeGuest';

import { AuthPromptDialog } from '@/components/blocks/AuthPrompt';
import { AuthPromptContext } from '@/components/blocks/AuthPrompt/authPromptContext';

import type { Meta, StoryObj } from '@storybook/react';
import type { AuthPromptRequest } from '@/components/blocks/AuthPrompt/authPromptContext';

const GuestPreview = () => {
  const [request, setRequest] = useState<AuthPromptRequest | null>(null);
  return (
    <AuthPromptContext value={setRequest}>
      <HomeGuest />
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
  title: 'Home/HomeGuest',
  component: HomeGuest,
  tags: ['autodocs'],
  render: () => <GuestPreview />,
} satisfies Meta<typeof HomeGuest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

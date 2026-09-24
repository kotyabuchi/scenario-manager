import { useState } from 'react';

import { SessionTabs } from './SessionTabs';

import { AuthPromptDialog } from '@/components/blocks/AuthPrompt';
import { AuthPromptContext } from '@/components/blocks/AuthPrompt/authPromptContext';

import type { Meta, StoryObj } from '@storybook/react';
import type { AuthPromptRequest } from '@/components/blocks/AuthPrompt/authPromptContext';

const SessionTabsPreview = (args: {
  activeTab: 'upcoming' | 'history' | 'public';
  isLoggedIn: boolean;
}) => {
  const [request, setRequest] = useState<AuthPromptRequest | null>(null);
  return (
    <AuthPromptContext value={setRequest}>
      <SessionTabs {...args} />
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
  title: 'Sessions/SessionTabs',
  component: SessionTabs,
  tags: ['autodocs'],
  render: (args) => <SessionTabsPreview {...args} />,
  parameters: { nextjs: { appDirectory: true } },
  args: { activeTab: 'public', isLoggedIn: false },
} satisfies Meta<typeof SessionTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {};
export const LoggedIn: Story = {
  args: { activeTab: 'upcoming', isLoggedIn: true },
};

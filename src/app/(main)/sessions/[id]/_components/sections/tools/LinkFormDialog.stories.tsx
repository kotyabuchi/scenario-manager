import { fn } from '@storybook/test';

import { LinkFormDialog } from './LinkFormDialog';

import type { Meta, StoryObj } from '@storybook/react';
import type { SessionLink } from '../../../../interface';

const existingLink: SessionLink = {
  linkId: '01HLINK000000000000000001',
  sessionId: '01HSESSION0000000000000001',
  linkType: 'DISCORD',
  url: 'https://discord.gg/example',
  label: 'セッションDiscord',
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-01T10:00:00Z',
};

const meta = {
  title: 'Sessions/詳細/ダイアログ/LinkFormDialog',
  component: LinkFormDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    onSubmit: fn(),
    isPending: false,
    serverError: null,
  },
} satisfies Meta<typeof LinkFormDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddNew: Story = {
  name: 'AddNew（新規追加）',
  args: {
    editingLink: undefined,
  },
};

export const Edit: Story = {
  name: 'Edit（編集）',
  args: {
    editingLink: existingLink,
  },
};

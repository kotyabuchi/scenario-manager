import { fn } from '@storybook/test';

import { LinkItem } from './LinkItem';

import type { Meta, StoryObj } from '@storybook/react';
import type { SessionLink } from '../../../../interface';

const baseLink: SessionLink = {
  linkId: '01HLINK000000000000000001',
  sessionId: '01HSESSION0000000000000001',
  linkType: 'DISCORD',
  url: 'https://discord.gg/example',
  label: null,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-01T10:00:00Z',
};

const meta = {
  title: 'Sessions/詳細/LinkItem',
  component: LinkItem,
  tags: ['autodocs'],
  args: {
    link: baseLink,
    isManager: true,
    onEdit: fn(),
    onDelete: fn(),
    isPending: false,
  },
} satisfies Meta<typeof LinkItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Discord: Story = {
  args: {
    link: {
      ...baseLink,
      linkType: 'DISCORD',
      url: 'https://discord.gg/example',
      label: null,
    },
  },
};

export const Ccfolia: Story = {
  args: {
    link: {
      ...baseLink,
      linkId: '01HLINK000000000000000002',
      linkType: 'CCFOLIA',
      url: 'https://ccfolia.com/example',
      label: 'ここ夜の教室',
    },
  },
};

export const Other: Story = {
  args: {
    link: {
      ...baseLink,
      linkId: '01HLINK000000000000000003',
      linkType: 'OTHER',
      url: 'https://example.com',
      label: 'キャラシ',
    },
  },
};

export const AsParticipant: Story = {
  name: 'AsParticipant（参加者：編集不可）',
  args: {
    link: {
      ...baseLink,
      linkType: 'DISCORD',
      url: 'https://discord.gg/example',
      label: null,
    },
    isManager: false,
  },
};

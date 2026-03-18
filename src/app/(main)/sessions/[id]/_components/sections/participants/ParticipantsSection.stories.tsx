import {
  createParticipant,
  createUser,
} from '../../../../__mocks__/sessionMocks';
import { ParticipantsSection } from './ParticipantsSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/詳細/ParticipantsSection',
  component: ParticipantsSection,
  tags: ['autodocs'],
} satisfies Meta<typeof ParticipantsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockParticipants = [
  createParticipant({
    userId: '01HKEEPER00000000000000001',
    participantType: 'KEEPER',
    participantStatus: 'CONFIRMED',
    user: createUser({
      userId: '01HKEEPER00000000000000001',
      userName: 'GM太郎',
    }),
  }),
  createParticipant({
    userId: '01HPLAYER000000000000000001',
    participantType: 'PLAYER',
    participantStatus: 'CONFIRMED',
    user: createUser({
      userId: '01HPLAYER000000000000000001',
      userName: 'プレイヤーA',
    }),
  }),
  createParticipant({
    userId: '01HPLAYER000000000000000002',
    participantType: 'PLAYER',
    participantStatus: 'PENDING',
    user: createUser({
      userId: '01HPLAYER000000000000000002',
      userName: 'プレイヤーB',
    }),
  }),
];

/**
 * managerロール、参加者3人（KEEPER + 2 PLAYER）
 */
export const Default: Story = {
  args: {
    participants: mockParticipants,
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
    maxPlayer: 4,
    creatorUserId: '01HCREATOR0000000000000001',
    sessionId: '01HSESSION0000000000000001',
    sessionPhase: 'RECRUITING',
  },
};

/**
 * participantロールで表示（申請管理ボタンなし）
 */
export const AsParticipant: Story = {
  args: {
    participants: mockParticipants,
    userRole: 'participant',
    currentUserId: '01HPLAYER000000000000000001',
    maxPlayer: 4,
    creatorUserId: '01HCREATOR0000000000000001',
    sessionId: '01HSESSION0000000000000001',
    sessionPhase: 'RECRUITING',
  },
};

/**
 * 参加者が0件の空状態
 */
export const Empty: Story = {
  args: {
    participants: [],
    userRole: 'manager',
    currentUserId: '01HKEEPER00000000000000001',
    maxPlayer: 4,
    creatorUserId: '01HCREATOR0000000000000001',
    sessionId: '01HSESSION0000000000000001',
    sessionPhase: 'RECRUITING',
  },
};

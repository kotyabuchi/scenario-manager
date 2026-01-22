import { CancelModal } from './CancelModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/CancelModal',
  component: CancelModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CancelModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * セッションキャンセル（GM用）
 */
export const CancelSession: Story = {
  args: {
    isOpen: true,
    type: 'cancel_session',
    sessionName: '週末CoC7版セッション',
  },
};

/**
 * 参加辞退（PL用）
 */
export const WithdrawApplication: Story = {
  args: {
    isOpen: true,
    type: 'withdraw_application',
    sessionName: '狂気山脈セッション',
  },
};

/**
 * 参加者除外（GM用）
 */
export const KickParticipant: Story = {
  args: {
    isOpen: true,
    type: 'kick_participant',
    sessionName: 'テストセッション',
    participantName: '問題のあるユーザー',
  },
};

/**
 * 処理中状態
 */
export const Submitting: Story = {
  args: {
    isOpen: true,
    isSubmitting: true,
    type: 'cancel_session',
    sessionName: 'テストセッション',
  },
};

/**
 * 閉じた状態
 */
export const Closed: Story = {
  args: {
    isOpen: false,
  },
};

import { ApprovalModal } from './ApprovalModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/ApprovalModal',
  component: ApprovalModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ApprovalModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示状態（申請者情報あり）
 */
export const Default: Story = {
  args: {
    isOpen: true,
    applicant: {
      userId: 'user-123',
      userName: '山田花子',
      message: '初心者ですがよろしくお願いします！',
      appliedAt: '2026-01-20T15:30:00',
    },
  },
};

/**
 * メッセージなしの申請
 */
export const WithoutMessage: Story = {
  args: {
    isOpen: true,
    applicant: {
      userId: 'user-456',
      userName: '佐藤次郎',
      appliedAt: '2026-01-21T10:00:00',
    },
  },
};

/**
 * 長いメッセージ
 */
export const LongMessage: Story = {
  args: {
    isOpen: true,
    applicant: {
      userId: 'user-789',
      userName: '鈴木一郎',
      message:
        'はじめまして！TRPGは1年ほどプレイしています。クトゥルフ神話TRPGは初めてですが、基本的なルールは予習してきました。探索者の作成についてアドバイスいただけると嬉しいです。当日はDiscordでボイスチャットできます。どうぞよろしくお願いいたします！',
      appliedAt: '2026-01-22T09:00:00',
    },
  },
};

/**
 * 承認処理中
 */
export const Approving: Story = {
  args: {
    isOpen: true,
    isSubmitting: true,
    applicant: {
      userId: 'user-123',
      userName: '山田花子',
      message: 'よろしくお願いします',
      appliedAt: '2026-01-20T15:30:00',
    },
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

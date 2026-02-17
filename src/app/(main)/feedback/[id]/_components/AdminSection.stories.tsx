import { AdminSection } from './AdminSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Feedback/Detail/AdminSection',
  component: AdminSection,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 新規フィードバック（初期状態） */
export const Default: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    currentStatus: 'NEW',
    currentPriority: null,
    currentAdminNote: null,
  },
};

/** ステータス・優先度設定済み */
export const WithSettings: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    currentStatus: 'PLANNED',
    currentPriority: 'HIGH',
    currentAdminNote:
      '次のスプリントで対応予定。デザインチームと要件を詰める必要あり。',
  },
};

/** 対応中・緊急 */
export const InProgressCritical: Story = {
  args: {
    feedbackId: '01JFEEDBACK0002',
    currentStatus: 'IN_PROGRESS',
    currentPriority: 'CRITICAL',
    currentAdminNote: '本番環境で再現確認済み。ホットフィックスで対応する。',
  },
};

/** 完了済み */
export const Done: Story = {
  args: {
    feedbackId: '01JFEEDBACK0003',
    currentStatus: 'DONE',
    currentPriority: 'MEDIUM',
    currentAdminNote: 'v2.1.0でリリース済み。',
  },
};

/** 運営メモなし・低優先度 */
export const LowPriorityNoNote: Story = {
  args: {
    feedbackId: '01JFEEDBACK0004',
    currentStatus: 'TRIAGED',
    currentPriority: 'LOW',
    currentAdminNote: null,
  },
};

import { ActionSection } from './ActionSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Feedback/Detail/ActionSection',
  component: ActionSection,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/feedback/01JFEEDBACK0001',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 自分の投稿（NEW） - 編集・削除両方表示 */
export const AuthorNew: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    isAuthor: true,
    status: 'NEW',
    feedback: {
      category: 'FEATURE',
      title: 'ダークモードに対応してほしい',
      description: '夜間に使用する際、画面が明るすぎて目が疲れます。',
    },
  },
};

/** 自分の投稿（TRIAGED） - 編集のみ表示 */
export const AuthorTriaged: Story = {
  args: {
    feedbackId: '01JFEEDBACK0002',
    isAuthor: true,
    status: 'TRIAGED',
    feedback: {
      category: 'BUG',
      title: 'タグフィルタの不具合',
      description: '複数タグ選択時にAND検索にならない。',
    },
  },
};

/** 自分の投稿（PLANNED以降） - 操作不可（非表示） */
export const AuthorPlanned: Story = {
  args: {
    feedbackId: '01JFEEDBACK0003',
    isAuthor: true,
    status: 'PLANNED',
    feedback: {
      category: 'FEATURE',
      title: 'ダークモード対応',
      description: '対応予定のため編集不可。',
    },
  },
};

/** 他人の投稿（非表示） */
export const NotAuthor: Story = {
  args: {
    feedbackId: '01JFEEDBACK0001',
    isAuthor: false,
    status: 'NEW',
    feedback: {
      category: 'FEATURE',
      title: 'ダークモード対応',
      description: '他人の投稿なので操作不可。',
    },
  },
};

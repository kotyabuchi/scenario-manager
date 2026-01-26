import { ApplicationModal } from './ApplicationModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/ApplicationModal',
  component: ApplicationModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ApplicationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト表示状態
 */
export const Default: Story = {
  args: {
    isOpen: true,
    session: {
      sessionName: '週末CoC7版セッション',
      gmName: '田中太郎',
      scenarioName: '狂気山脈',
      scheduledAt: '2026-02-01T20:00:00',
    },
  },
};

/**
 * シナリオ未定のセッション
 */
export const ScenarioUndecided: Story = {
  args: {
    isOpen: true,
    session: {
      sessionName: '週末に遊びませんか',
      gmName: '田中太郎',
      scheduledAt: '2026-02-01T20:00:00',
    },
  },
};

/**
 * 日程未定のセッション
 */
export const ScheduleUndecided: Story = {
  args: {
    isOpen: true,
    session: {
      sessionName: '狂気山脈やります',
      gmName: '田中太郎',
      scenarioName: '狂気山脈',
    },
  },
};

/**
 * 送信中状態
 */
export const Submitting: Story = {
  args: {
    isOpen: true,
    isSubmitting: true,
    session: {
      sessionName: 'テストセッション',
      gmName: 'テストGM',
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

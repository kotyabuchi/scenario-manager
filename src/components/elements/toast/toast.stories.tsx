import { Toast } from './toast';

import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 成功
 */
export const Success: Story = {
  args: {
    title: 'Success',
    description: 'Your changes have been saved.',
    status: 'success',
    duration: 0, // ストーリー用に自動非表示を無効化
  },
};

/**
 * エラー
 */
export const ErrorToast: Story = {
  args: {
    title: 'Error',
    description: 'Something went wrong.',
    status: 'error',
    duration: 0,
  },
};

/**
 * 情報
 */
export const InfoToast: Story = {
  args: {
    title: 'Info',
    description: 'Here is some information.',
    status: 'info',
    duration: 0,
  },
};

/**
 * 警告
 */
export const Warning: Story = {
  args: {
    title: 'Warning',
    description: 'Please check your input.',
    status: 'warning',
    duration: 0,
  },
};

/**
 * タイトルのみ
 */
export const TitleOnly: Story = {
  args: {
    title: 'Saved successfully',
    status: 'success',
    duration: 0,
  },
};

/**
 * 自動非表示（3秒）
 */
export const AutoHide: Story = {
  args: {
    title: 'Success',
    description: 'This toast will disappear in 3 seconds.',
    status: 'success',
    duration: 3000,
  },
};

/**
 * 全バリエーション
 */
export const AllVariants: Story = {
  args: {
    title: 'Toast',
    duration: 0,
  },
  render: () => (
    <div
      className={css({ display: 'flex', flexDirection: 'column', gap: '16px' })}
    >
      <Toast
        title="Success"
        description="Your changes have been saved."
        status="success"
        duration={0}
      />
      <Toast
        title="Error"
        description="Something went wrong."
        status="error"
        duration={0}
      />
      <Toast
        title="Info"
        description="Here is some information."
        status="info"
        duration={0}
      />
      <Toast
        title="Warning"
        description="Please check your input."
        status="warning"
        duration={0}
      />
    </div>
  ),
};

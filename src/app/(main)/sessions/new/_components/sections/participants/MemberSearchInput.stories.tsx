import { fn } from '@storybook/test';

import { MemberSearchInput } from './MemberSearchInput';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/Sessions/MemberSearchInput',
  component: MemberSearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberSearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 初期状態（空の検索入力）
 */
export const Default: Story = {
  args: {
    excludeUserIds: [],
  },
};

/**
 * 一部のユーザーを除外した状態
 */
export const WithExclusions: Story = {
  args: {
    excludeUserIds: ['01HTESTUSER00000001AAA', '01HTESTUSER00000002BBB'],
  },
};

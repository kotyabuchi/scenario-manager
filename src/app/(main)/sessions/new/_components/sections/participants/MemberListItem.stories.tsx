import { fn } from '@storybook/test';

import { MemberListItem } from './MemberListItem';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/作成フォーム/MemberListItem',
  component: MemberListItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onRoleChange: fn(),
    onRemove: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '480px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * プレイヤーとして追加されたメンバー
 */
export const Player: Story = {
  args: {
    user: {
      user_id: '01HTESTUSER00000001AAA',
      user_name: 'taro_trpg',
      nickname: '太郎',
      image: null,
    },
    role: 'PLAYER',
  },
};

/**
 * 観戦者として追加されたメンバー
 */
export const Spectator: Story = {
  args: {
    user: {
      user_id: '01HTESTUSER00000002BBB',
      user_name: 'hanako_dice',
      nickname: '花子',
      image: null,
    },
    role: 'SPECTATOR',
  },
};

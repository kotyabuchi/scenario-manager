import { SignupModal } from './SignupModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/SignupModal',
  component: SignupModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SignupModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Step 1: 基本情報入力（デフォルト）
 */
export const Step1Default: Story = {
  args: {
    isOpen: true,
    defaultUserName: 'taro_trpg',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
  },
};

/**
 * Step 1: バリデーションエラー状態
 */
export const Step1WithErrors: Story = {
  args: {
    isOpen: true,
    defaultUserName: '',
    defaultNickname: '',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
  },
};

/**
 * Step 1: ユーザー名チェック中
 */
export const Step1Checking: Story = {
  args: {
    isOpen: true,
    defaultUserName: 'checking_name',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
    isCheckingUserName: true,
  },
};

/**
 * Step 1: ユーザー名使用可能
 */
export const Step1Available: Story = {
  args: {
    isOpen: true,
    defaultUserName: 'unique_name',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
    userNameAvailable: true,
  },
};

/**
 * Step 1: ユーザー名使用済み
 */
export const Step1Taken: Story = {
  args: {
    isOpen: true,
    defaultUserName: 'existing_user',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
    userNameAvailable: false,
  },
};

/**
 * Step 2: 追加情報入力
 */
export const Step2Default: Story = {
  args: {
    isOpen: true,
    initialStep: 2,
    defaultUserName: 'taro_trpg',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
  },
};

/**
 * Step 2: 入力済み状態
 */
export const Step2Filled: Story = {
  args: {
    isOpen: true,
    initialStep: 2,
    defaultUserName: 'taro_trpg',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
    defaultBio: 'TRPGが大好きです。CoC7版をメインに遊んでいます。',
    defaultFavoriteSystems: ['coc7', 'dnd5e'],
    defaultFavoriteScenarios: '狂気山脈、悪霊の家',
  },
};

/**
 * 送信中状態
 */
export const Submitting: Story = {
  args: {
    isOpen: true,
    initialStep: 2,
    defaultUserName: 'taro_trpg',
    defaultNickname: '太郎',
    avatarUrl: 'https://cdn.discordapp.com/avatars/123/abc.png',
    isSubmitting: true,
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

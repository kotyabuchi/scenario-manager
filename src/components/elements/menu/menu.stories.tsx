import {
  CopyIcon,
  LinkIcon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react';

import { Button } from '../button/button';
import { Menu } from './menu';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Menu',
  component: Menu.Root,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      defaultValue: 'md',
    },
  },
} satisfies Meta<typeof Menu.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    size: 'md',
  },
  render: (args) => (
    <Menu.Root {...args}>
      <Menu.Trigger asChild>
        <Button variant="subtle">メニューを開く</Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="edit">
            <PencilIcon />
            <Menu.ItemText>編集</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="copy">
            <CopyIcon />
            <Menu.ItemText>コピー</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="link">
            <LinkIcon />
            <Menu.ItemText>リンクをコピー</Menu.ItemText>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item value="delete">
            <TrashIcon />
            <Menu.ItemText>削除</Menu.ItemText>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const WithGroups: Story = {
  args: {
    size: 'md',
  },
  render: (args) => (
    <Menu.Root {...args}>
      <Menu.Trigger asChild>
        <Button variant="subtle">アカウント</Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>アカウント</Menu.ItemGroupLabel>
            <Menu.Item value="profile">
              <UserIcon />
              <Menu.ItemText>プロフィール</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="settings">
              <SettingsIcon />
              <Menu.ItemText>設定</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>セッション</Menu.ItemGroupLabel>
            <Menu.Item value="new-session">
              <PlusIcon />
              <Menu.ItemText>新規セッション</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.Item value="logout">
            <LogOutIcon />
            <Menu.ItemText>ログアウト</Menu.ItemText>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const WithDisabledItems: Story = {
  args: {
    size: 'md',
  },
  render: (args) => (
    <Menu.Root {...args}>
      <Menu.Trigger asChild>
        <Button variant="subtle">操作</Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="edit">
            <PencilIcon />
            <Menu.ItemText>編集</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="copy">
            <CopyIcon />
            <Menu.ItemText>コピー</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="delete" disabled>
            <TrashIcon />
            <Menu.ItemText>削除（権限なし）</Menu.ItemText>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const SmallSize: Story = {
  args: {
    size: 'sm',
  },
  render: (args) => (
    <Menu.Root {...args}>
      <Menu.Trigger asChild>
        <Button variant="subtle" size="sm">
          Small Menu
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="option1">
            <Menu.ItemText>オプション1</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="option2">
            <Menu.ItemText>オプション2</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="option3">
            <Menu.ItemText>オプション3</Menu.ItemText>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

export const LargeSize: Story = {
  args: {
    size: 'lg',
  },
  render: (args) => (
    <Menu.Root {...args}>
      <Menu.Trigger asChild>
        <Button variant="subtle" size="lg">
          Large Menu
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="option1">
            <PencilIcon />
            <Menu.ItemText>オプション1</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="option2">
            <CopyIcon />
            <Menu.ItemText>オプション2</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="option3">
            <TrashIcon />
            <Menu.ItemText>オプション3</Menu.ItemText>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

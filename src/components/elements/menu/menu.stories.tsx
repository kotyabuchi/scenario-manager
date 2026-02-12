import {
  Copy,
  GearSix,
  Link,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
  User,
} from '@phosphor-icons/react/ssr';

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
            <PencilSimple />
            <Menu.ItemText>編集</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="copy">
            <Copy />
            <Menu.ItemText>コピー</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="link">
            <Link />
            <Menu.ItemText>リンクをコピー</Menu.ItemText>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item value="delete">
            <Trash />
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
              <User />
              <Menu.ItemText>プロフィール</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="settings">
              <GearSix />
              <Menu.ItemText>設定</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>セッション</Menu.ItemGroupLabel>
            <Menu.Item value="new-session">
              <Plus />
              <Menu.ItemText>新規セッション</Menu.ItemText>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.Item value="logout">
            <SignOut />
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
            <PencilSimple />
            <Menu.ItemText>編集</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="copy">
            <Copy />
            <Menu.ItemText>コピー</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="delete" disabled>
            <Trash />
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
            <PencilSimple />
            <Menu.ItemText>オプション1</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="option2">
            <Copy />
            <Menu.ItemText>オプション2</Menu.ItemText>
          </Menu.Item>
          <Menu.Item value="option3">
            <Trash />
            <Menu.ItemText>オプション3</Menu.ItemText>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
};

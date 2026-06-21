import { Pill } from './Pill';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Pill',
  component: Pill,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['gray', 'green', 'pink', 'orange', 'red', 'purple'],
    },
    variant: {
      control: 'inline-radio',
      options: ['subtle', 'outline'],
    },
    shape: {
      control: 'inline-radio',
      options: ['rounded', 'pill'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    dot: { control: 'boolean' },
    selected: { control: 'boolean' },
    removable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルト（静的・グレー）
 */
export const Default: Story = {
  args: {
    children: 'ラベル',
  },
};

/**
 * 全 tone（subtle）
 */
export const Tones: Story = {
  args: { children: 'tone' },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Pill tone="gray">gray</Pill>
      <Pill tone="green">green</Pill>
      <Pill tone="pink">pink</Pill>
      <Pill tone="orange">orange</Pill>
      <Pill tone="red">red</Pill>
      <Pill tone="purple">purple</Pill>
    </div>
  ),
};

/**
 * ドット付き（ステータス表示）
 */
export const WithDot: Story = {
  args: { children: 'dot' },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Pill tone="pink" dot>
        募集中
      </Pill>
      <Pill tone="green" dot>
        参加予定
      </Pill>
      <Pill tone="orange" dot>
        締切間近
      </Pill>
      <Pill tone="gray" dot>
        終了済み
      </Pill>
    </div>
  ),
};

/**
 * 形状（rounded / pill）
 */
export const Shapes: Story = {
  args: { children: 'shape' },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Pill shape="rounded" tone="green">
        rounded
      </Pill>
      <Pill shape="pill" tone="green">
        pill
      </Pill>
    </div>
  ),
};

/**
 * サイズ
 */
export const Sizes: Story = {
  args: { children: 'size' },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Pill size="sm" tone="green">
        Small
      </Pill>
      <Pill size="md" tone="green">
        Medium
      </Pill>
      <Pill size="lg" tone="green">
        Large
      </Pill>
    </div>
  ),
};

/**
 * 操作可能（選択トグル）
 */
export const Selectable: Story = {
  args: {
    children: 'ホラー',
    shape: 'pill',
    tone: 'green',
    selected: true,
    onClick: () => {},
  },
};

/**
 * 非選択（outline）
 */
export const Unselected: Story = {
  args: {
    children: 'ファンタジー',
    shape: 'pill',
    variant: 'outline',
    selected: false,
    onClick: () => {},
  },
};

/**
 * 削除可能
 */
export const Removable: Story = {
  args: {
    children: 'ホラー',
    shape: 'pill',
    tone: 'green',
    selected: true,
    removable: true,
    onClick: () => {},
    onRemove: () => {},
  },
};

/**
 * 無効
 */
export const Disabled: Story = {
  args: {
    children: '無効',
    shape: 'pill',
    selected: false,
    disabled: true,
    onClick: () => {},
  },
};

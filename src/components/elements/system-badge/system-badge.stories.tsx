import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';

// TDDスタブ: SystemBadgeコンポーネント
type SystemBadgeProps = {
  system: {
    name: string;
    color: 'green' | 'purple' | 'orange' | 'blue' | 'red';
  };
  size?: 'sm' | 'md';
};

const colorMap = {
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
};

const SystemBadge = ({ system, size = 'md' }: SystemBadgeProps) => {
  const bgColor = colorMap[system.color];

  return (
    <span
      role="img"
      aria-label={`システム: ${system.name}`}
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        color: 'white',
        borderRadius: '0 0 8px 0',
        ...(size === 'sm'
          ? {
              fontSize: '10px',
              padding: '4px 8px',
            }
          : {
              fontSize: '11px',
              padding: '6px 12px',
            }),
      })}
      style={{ backgroundColor: bgColor }}
      data-color={system.color}
      data-size={size}
    >
      {system.name}
    </span>
  );
};

const meta = {
  title: 'UI/SystemBadge',
  component: SystemBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SystemBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * クトゥルフ神話TRPG 7版（緑）
 */
export const Green: Story = {
  args: {
    system: { name: 'CoC7版', color: 'green' },
  },
};

/**
 * ソード・ワールド2.5（紫）
 */
export const Purple: Story = {
  args: {
    system: { name: 'SW2.5', color: 'purple' },
  },
};

/**
 * クトゥルフ神話TRPG 6版（オレンジ）
 */
export const Orange: Story = {
  args: {
    system: { name: 'CoC6版', color: 'orange' },
  },
};

/**
 * 青色バッジ
 */
export const Blue: Story = {
  args: {
    system: { name: 'DX3rd', color: 'blue' },
  },
};

/**
 * 赤色バッジ
 */
export const Red: Story = {
  args: {
    system: { name: 'その他', color: 'red' },
  },
};

/**
 * 小サイズ
 */
export const Small: Story = {
  args: {
    system: { name: 'CoC7版', color: 'green' },
    size: 'sm',
  },
};

/**
 * 中サイズ（デフォルト）
 */
export const Medium: Story = {
  args: {
    system: { name: 'CoC7版', color: 'green' },
    size: 'md',
  },
};

/**
 * 全カラーバリエーション
 */
export const AllColors: Story = {
  render: () => (
    <div
      className={css({ display: 'flex', flexDirection: 'column', gap: '8px' })}
    >
      <SystemBadge system={{ name: 'CoC7版', color: 'green' }} />
      <SystemBadge system={{ name: 'SW2.5', color: 'purple' }} />
      <SystemBadge system={{ name: 'CoC6版', color: 'orange' }} />
      <SystemBadge system={{ name: 'DX3rd', color: 'blue' }} />
      <SystemBadge system={{ name: 'その他', color: 'red' }} />
    </div>
  ),
};

import { HelpCircle } from 'lucide-react';

import { Tooltip } from './tooltip';

import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（上）
 */
export const Default: Story = {
  args: {
    content: 'これはツールチップです',
    children: (
      <button
        type="button"
        className={css({
          py: '2',
          px: '4',
          bg: 'primary.500',
          color: 'white',
          borderRadius: 'lg',
          border: 'none',
          cursor: 'pointer',
        })}
      >
        ホバーしてください
      </button>
    ),
  },
};

/**
 * 下に表示
 */
export const Bottom: Story = {
  args: {
    content: '下に表示されるツールチップ',
    placement: 'bottom',
    children: (
      <button
        type="button"
        className={css({
          py: '2',
          px: '4',
          bg: 'info.500',
          color: 'white',
          borderRadius: 'lg',
          border: 'none',
          cursor: 'pointer',
        })}
      >
        下に表示
      </button>
    ),
  },
};

/**
 * 左に表示
 */
export const Left: Story = {
  args: {
    content: '左に表示されるツールチップ',
    placement: 'left',
    children: (
      <button
        type="button"
        className={css({
          py: '2',
          px: '4',
          bg: 'purple.500',
          color: 'white',
          borderRadius: 'lg',
          border: 'none',
          cursor: 'pointer',
        })}
      >
        左に表示
      </button>
    ),
  },
};

/**
 * 右に表示
 */
export const Right: Story = {
  args: {
    content: '右に表示されるツールチップ',
    placement: 'right',
    children: (
      <button
        type="button"
        className={css({
          py: '2',
          px: '4',
          bg: 'orange.500',
          color: 'white',
          borderRadius: 'lg',
          border: 'none',
          cursor: 'pointer',
        })}
      >
        右に表示
      </button>
    ),
  },
};

/**
 * 遅延なし
 */
export const NoDelay: Story = {
  args: {
    content: '即座に表示されます',
    delay: 0,
    children: (
      <button
        type="button"
        className={css({
          py: '2',
          px: '4',
          bg: 'red.500',
          color: 'white',
          borderRadius: 'lg',
          border: 'none',
          cursor: 'pointer',
        })}
      >
        遅延なし
      </button>
    ),
  },
};

/**
 * アイコンボタンに使用
 */
export const WithIconButton: Story = {
  args: {
    content: 'ヘルプを表示します',
    children: (
      <button
        type="button"
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '8',
          height: '8',
          bg: 'transparent',
          border: '[1px solid #E5E7EB]',
          borderRadius: 'lg',
          cursor: 'pointer',
          color: 'gray.500',
          _hover: { bg: 'gray.100' },
        })}
        aria-label="ヘルプ"
      >
        <HelpCircle size={16} />
      </button>
    ),
  },
};

/**
 * 長いテキスト
 */
export const LongContent: Story = {
  args: {
    content:
      'これは長いツールチップの内容です。最大幅を超えると自動的に折り返されます。',
    children: (
      <button
        type="button"
        className={css({
          py: '2',
          px: '4',
          bg: 'gray.500',
          color: 'white',
          borderRadius: 'lg',
          border: 'none',
          cursor: 'pointer',
        })}
      >
        長いツールチップ
      </button>
    ),
  },
};

/**
 * 全配置バリエーション
 */
export const AllPlacements: Story = {
  args: {
    content: 'ツールチップ',
    children: <button type="button">ボタン</button>,
  },
  render: () => (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8',
        padding: '16',
      })}
    >
      <Tooltip content="上に表示" placement="top">
        <button
          type="button"
          className={css({
            py: '2',
            px: '4',
            bg: 'primary.500',
            color: 'white',
            borderRadius: 'lg',
            border: 'none',
            cursor: 'pointer',
          })}
        >
          Top
        </button>
      </Tooltip>
      <div className={css({ display: 'flex', gap: '16' })}>
        <Tooltip content="左に表示" placement="left">
          <button
            type="button"
            className={css({
              py: '2',
              px: '4',
              bg: 'purple.500',
              color: 'white',
              borderRadius: 'lg',
              border: 'none',
              cursor: 'pointer',
            })}
          >
            Left
          </button>
        </Tooltip>
        <Tooltip content="右に表示" placement="right">
          <button
            type="button"
            className={css({
              py: '2',
              px: '4',
              bg: 'orange.500',
              color: 'white',
              borderRadius: 'lg',
              border: 'none',
              cursor: 'pointer',
            })}
          >
            Right
          </button>
        </Tooltip>
      </div>
      <Tooltip content="下に表示" placement="bottom">
        <button
          type="button"
          className={css({
            py: '2',
            px: '4',
            bg: 'info.500',
            color: 'white',
            borderRadius: 'lg',
            border: 'none',
            cursor: 'pointer',
          })}
        >
          Bottom
        </button>
      </Tooltip>
    </div>
  ),
};

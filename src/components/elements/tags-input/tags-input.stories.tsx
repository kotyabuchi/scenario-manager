import { useState } from 'react';

import { TagsInput } from './tags-input';

import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/TagsInput',
  component: TagsInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TagsInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    label: 'Tags',
    placeholder: 'タグを追加...',
  },
};

/**
 * タグあり
 */
export const WithTags: Story = {
  args: {
    label: 'Tags',
    defaultValue: ['ホラー', '探索'],
  },
};

/**
 * 必須
 */
export const Required: Story = {
  args: {
    label: 'Tags',
    required: true,
  },
};

/**
 * 無効
 */
export const Disabled: Story = {
  args: {
    label: 'Tags',
    defaultValue: ['ホラー', '探索'],
    disabled: true,
  },
};

/**
 * エラー
 */
export const WithError: Story = {
  args: {
    label: 'Tags',
    error: 'タグを1つ以上入力してください',
  },
};

/**
 * サジェストあり
 */
export const WithSuggestions: Story = {
  args: {
    label: 'Tags',
    suggestions: ['ホラー', '探索', '探偵', '謎解き', 'ファンタジー', 'SF'],
  },
};

/**
 * 最大タグ数制限
 */
export const MaxTags: Story = {
  args: {
    label: 'Tags',
    defaultValue: ['ホラー', '探索'],
    maxTags: 3,
  },
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>(['ホラー']);
    return (
      <div>
        <TagsInput
          label="Tags"
          value={tags}
          onValueChange={(details) => setTags(details.value)}
          suggestions={[
            'ホラー',
            '探索',
            '探偵',
            '謎解き',
            'ファンタジー',
            'SF',
          ]}
        />
        <p className={css({ mt: '16px', fontSize: '14px', color: '#6B7280' })}>
          選択中: {tags.join(', ') || 'なし'}
        </p>
      </div>
    );
  },
};

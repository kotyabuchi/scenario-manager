import { useState } from 'react';

import { Pagination } from './pagination';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト（10ページ、1ページ目）
 */
export const Default: Story = {
  args: {
    page: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
};

/**
 * 中間ページ
 */
export const MiddlePage: Story = {
  args: {
    page: 5,
    totalPages: 10,
    onPageChange: () => {},
  },
};

/**
 * 最終ページ
 */
export const LastPage: Story = {
  args: {
    page: 10,
    totalPages: 10,
    onPageChange: () => {},
  },
};

/**
 * 少ないページ数
 */
export const FewPages: Story = {
  args: {
    page: 1,
    totalPages: 3,
    onPageChange: () => {},
  },
};

/**
 * 多いページ数
 */
export const ManyPages: Story = {
  args: {
    page: 50,
    totalPages: 100,
    onPageChange: () => {},
  },
};

/**
 * インタラクティブ
 */
export const Interactive: Story = {
  args: {
    page: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
  render: () => {
    const [page, setPage] = useState(1);
    return <Pagination page={page} totalPages={10} onPageChange={setPage} />;
  },
};

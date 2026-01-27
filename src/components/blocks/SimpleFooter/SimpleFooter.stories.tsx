import { SimpleFooter } from './SimpleFooter';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/SimpleFooter',
  component: SimpleFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SimpleFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルト
 */
export const Default: Story = {};

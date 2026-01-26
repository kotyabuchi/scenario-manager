import { Heart } from 'lucide-react';

import { IconButton } from './icon-button';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['primary', 'danger'],
    },
    variant: {
      control: { type: 'select' },
      options: ['solid', 'subtle', 'ghost', 'outline'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    loading: {
      control: { type: 'boolean' },
    },
    loadingText: {
      control: { type: 'text' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: 'primary',
    variant: 'solid',
    size: 'md',
    loading: false,
    loadingText: 'Loading...',
    disabled: false,
  },
  render: (args) => (
    <IconButton aria-label="Like" {...args}>
      <Heart />
    </IconButton>
  ),
};

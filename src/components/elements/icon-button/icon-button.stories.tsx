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
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
    },
    variant: {
      control: { type: 'select' },
      options: ['solid', 'outline', 'subtle', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg'],
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
    status: 'default',
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

import { Button } from './button';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
      defaultValue: 'default',
    },
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'ghost'],
      defaultValue: 'solid',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      defaultValue: 'md',
    },
    loading: {
      control: 'boolean',
    },
    loadingText: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

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
  render: (args) => <Button {...args}>Button</Button>,
};

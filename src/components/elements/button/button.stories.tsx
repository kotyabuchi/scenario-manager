import { Button } from './button';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['primary', 'danger'],
      defaultValue: 'primary',
    },
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'ghost', 'outline'],
      defaultValue: 'solid',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
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
    status: 'primary',
    variant: 'solid',
    size: 'md',
    loading: false,
    loadingText: 'Loading...',
    disabled: false,
  },
  render: (args) => <Button {...args}>Button</Button>,
};

import { Alert } from './alert';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['soft', 'subtle', 'outline'],
    },
    status: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    onClick: {
      control: false,
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'soft',
    status: 'info',
    title: 'Browser Update available',
    description:
      'A new version of your browser is available. Please update to continue.',
    onActionClick() {
      console.log('close');
    },
  },
  render: (args) => <Alert {...args} />,
};

export const Success: Story = {
  args: {
    variant: 'soft',
    status: 'success',
    title: 'Success',
    description: 'Your changes have been saved successfully.',
  },
  render: (args) => <Alert {...args} />,
};

export const Warning: Story = {
  args: {
    variant: 'soft',
    status: 'warning',
    title: 'Warning',
    description:
      'Your session will expire in 5 minutes. Please save your work.',
  },
  render: (args) => <Alert {...args} />,
};

export const Danger: Story = {
  args: {
    variant: 'soft',
    status: 'danger',
    title: 'Danger',
    description:
      'Your session will expire in 5 minutes. Please save your work.',
  },
  render: (args) => <Alert {...args} />,
};

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    status: 'info',
    title: 'Information',
    description: 'This is a subtle alert variant.',
  },
  render: (args) => <Alert {...args} />,
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    status: 'success',
    title: 'Saved',
    description: 'This is an outline alert with left border accent.',
  },
  render: (args) => <Alert {...args} />,
};

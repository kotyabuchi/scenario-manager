import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'outline'],
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
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'solid',
    status: 'info',
    title: 'Browser Update available',
    description:
      'A new version of your browser is available. Please update to continue.',
  },
  render: (args) => <Alert {...args} />,
};

export const Success: Story = {
  args: {
    variant: 'solid',
    status: 'success',
    title: 'Success',
    description: 'Your changes have been saved successfully.',
  },
  render: (args) => <Alert {...args} />,
};

export const Warning: Story = {
  args: {
    variant: 'solid',
    status: 'warning',
    title: 'Warning',
    description:
      'Your session will expire in 5 minutes. Please save your work.',
  },
  render: (args) => <Alert {...args} />,
};

export const Danger: Story = {
  args: {
    variant: 'solid',
    status: 'danger',
    title: 'Danger',
    description:
      'Your session will expire in 5 minutes. Please save your work.',
  },
  render: (args) => <Alert {...args} />,
};

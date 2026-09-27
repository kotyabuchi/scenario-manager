import { ModalCloseButton } from './ModalCloseButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ModalCloseButton> = {
  title: 'UI/Modal/CloseButton',
  component: ModalCloseButton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ModalCloseButton>;

export const Default: Story = {};

import { ModalDismissButton } from './ModalDismissButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ModalDismissButton> = {
  title: 'UI/Modal/DismissButton',
  component: ModalDismissButton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ModalDismissButton>;

export const Default: Story = {
  args: { children: 'キャンセル' },
};

export const Disabled: Story = {
  args: { children: '継続する', disabled: true },
};

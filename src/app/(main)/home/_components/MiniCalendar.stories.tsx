import { mockCalendarDates } from './_mocks';
import { MiniCalendar } from './MiniCalendar';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Dashboard/MiniCalendar',
  component: MiniCalendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MiniCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** セッションドット付き */
export const Default: Story = {
  args: {
    sessionDates: mockCalendarDates,
  },
};

/** セッションなし */
export const Empty: Story = {
  args: {
    sessionDates: [],
  },
};

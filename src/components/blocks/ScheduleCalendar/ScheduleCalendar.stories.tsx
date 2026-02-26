import { useState } from 'react';

import { ScheduleCalendar } from './ScheduleCalendar';

import type { Meta, StoryObj } from '@storybook/react';

const makeDate = (offsetDays: number): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const selectedSeed = [makeDate(10), makeDate(17)];

const meta = {
  title: 'Sessions/ScheduleCalendar',
  component: ScheduleCalendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: 24,
          background: '#fff',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScheduleCalendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedDates: [],
    onSelect: () => {},
  },
  render: () => {
    const [selectedDates, setSelectedDates] = useState<Date[]>(selectedSeed);

    const markers = {
      [selectedSeed[0]?.toISOString().slice(0, 10) ?? '']: {
        dots: ['#60a5fa', '#fb923c', '#c084fc'],
      },
      [makeDate(3).toISOString().slice(0, 10)]: {
        dots: ['#34d399'],
      },
      [makeDate(13).toISOString().slice(0, 10)]: {
        dots: ['#60a5fa'],
      },
    };

    return (
      <ScheduleCalendar
        selectedDates={selectedDates}
        onSelect={setSelectedDates}
        multiple
        markers={markers}
      />
    );
  },
};

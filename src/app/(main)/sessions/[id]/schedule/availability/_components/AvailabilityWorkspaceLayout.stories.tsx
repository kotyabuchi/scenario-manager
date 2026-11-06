import { useMemo, useState } from 'react';

import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { BaseAvailabilityCalendar } from './BaseAvailabilityCalendar';
import { SelectedTimeBlocksPanel } from './SelectedTimeBlocksPanel';
import { SelectedTimeBlocksStickyBar } from './SelectedTimeBlocksStickyBar';
import * as styles from './styles';

import { BottomNavSlotProvider } from '@/hooks/useBottomNavSlot';

import type { Meta, StoryObj } from '@storybook/react';
import type {
  AvailabilityTimeBlockInput,
  CalendarDayBadge,
} from '../interface';

const makeDate = (offsetDays: number): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const toIso = (date: Date, hour: number): string => {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next.toISOString();
};

const toIsoWithDayOffset = (
  date: Date,
  dayOffset: number,
  hour: number,
): string => {
  const next = new Date(date);
  next.setDate(next.getDate() + dayOffset);
  next.setHours(hour, 0, 0, 0);
  return next.toISOString();
};

const sidebarContent = (title: string) => (
  <div className={styles.selectedTimeBlocksPanel}>
    <p className={styles.cardTitle}>{title}</p>
    <div className={styles.timeBlockList}>
      <div className={styles.timeBlockListItem}>
        <div className={styles.timeBlockListItemMain}>
          <p className={styles.timeBlockListItemLabel}>3/1(土) 12:00 - 15:00</p>
          <p className={styles.timeBlockListItemSub}>PL 田中 / 3時間</p>
        </div>
      </div>
      <div className={styles.timeBlockListItem}>
        <div className={styles.timeBlockListItemMain}>
          <p className={styles.timeBlockListItemLabel}>3/1(土) 18:00 - 22:00</p>
          <p className={styles.timeBlockListItemSub}>PL 鈴木 / 4時間</p>
        </div>
      </div>
      <div className={styles.emptyState}>
        ここに提出UIでは他ユーザースケジュール、確定UIではおすすめ候補一覧を表示します。
      </div>
    </div>
  </div>
);

const meta = {
  title: 'Sessions/日程調整/AvailabilityWorkspaceLayout',
  component: AvailabilityWorkspaceLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BottomNavSlotProvider>
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: '#f4f7f9',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Story />
          </div>
        </div>
      </BottomNavSlotProvider>
    ),
  ],
} satisfies Meta<typeof AvailabilityWorkspaceLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ConfirmLikeLayout: Story = {
  args: {
    calendarSection: null,
    selectedTimeBlocksSection: null,
    desktopSidebarSection: null,
    mobileSidebarSection: null,
    mobileSidebarTitle: 'おすすめ候補',
    mobileSidebarOpen: false,
    onMobileSidebarOpenChange: () => {},
  },
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(makeDate(3));
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [timeBlocks, setTimeBlocks] = useState<AvailabilityTimeBlockInput[]>(
      () => {
        const base = makeDate(3);
        return [
          {
            startAt: toIso(base, 12),
            endAt: toIso(base, 15),
          },
          {
            startAt: toIso(base, 18),
            endAt: toIso(base, 22),
          },
          {
            startAt: toIsoWithDayOffset(base, 1, 21),
            endAt: toIsoWithDayOffset(base, 2, 1),
          },
        ];
      },
    );

    const dayBadges = useMemo<CalendarDayBadge[]>(() => {
      const day1 = makeDate(3);
      const day2 = makeDate(5);
      return [
        {
          dateKey: day1.toISOString().slice(0, 10),
          markers: ['#60a5fa', '#fb923c', '#c084fc'],
          counts: { submissions: 6, overlapStrong: 2 },
        },
        {
          dateKey: day2.toISOString().slice(0, 10),
          markers: ['#34d399', '#60a5fa'],
          counts: { submissions: 4, overlapStrong: 1 },
        },
      ];
    }, []);

    return (
      <AvailabilityWorkspaceLayout
        mobileSidebarTitle="おすすめ候補"
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileSidebarOpenChange={setMobileSidebarOpen}
        calendarSection={
          <BaseAvailabilityCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            dayBadges={dayBadges}
            title="スケジュールカレンダー"
            helperText="色ドット + 件数ラベルで日ごとの提出状況を確認できます。"
          />
        }
        selectedTimeBlocksSection={
          <SelectedTimeBlocksPanel
            title="選択中の日程"
            timeBlocks={timeBlocks}
            minPlaytimeMinutes={360}
            onRemoveTimeBlock={(index) =>
              setTimeBlocks((prev) => prev.filter((_, i) => i !== index))
            }
          />
        }
        desktopSidebarSection={sidebarContent('おすすめ一覧')}
        mobileSidebarSection={sidebarContent('おすすめ一覧')}
        stickyBar={
          <SelectedTimeBlocksStickyBar
            timeBlocks={timeBlocks}
            minPlaytimeMinutes={360}
            primaryActionLabel="確定する"
            onPrimaryAction={() => {}}
            sidebarToggleLabel="おすすめを表示"
            onToggleSidebar={() => setMobileSidebarOpen((open) => !open)}
            sidebarOpen={mobileSidebarOpen}
          />
        }
      />
    );
  },
};

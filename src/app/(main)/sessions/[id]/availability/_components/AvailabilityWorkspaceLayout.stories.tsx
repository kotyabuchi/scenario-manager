import { useMemo, useState } from 'react';

import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { BaseAvailabilityCalendar } from './BaseAvailabilityCalendar';
import { SelectedSlotsPanel } from './SelectedSlotsPanel';
import { SelectedSlotsStickyBar } from './SelectedSlotsStickyBar';
import * as styles from './styles';

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
  <div className={styles.selectedSlotsPanel}>
    <p className={styles.cardTitle}>{title}</p>
    <div className={styles.slotList}>
      <div className={styles.slotListItem}>
        <div className={styles.slotListItemMain}>
          <p className={styles.slotListItemLabel}>3/1(土) 12:00 - 15:00</p>
          <p className={styles.slotListItemSub}>PL 田中 / 3時間</p>
        </div>
      </div>
      <div className={styles.slotListItem}>
        <div className={styles.slotListItemMain}>
          <p className={styles.slotListItemLabel}>3/1(土) 18:00 - 22:00</p>
          <p className={styles.slotListItemSub}>PL 鈴木 / 4時間</p>
        </div>
      </div>
      <div className={styles.emptyState}>
        ここに提出UIでは他ユーザー提出枠、確定UIではおすすめ枠一覧を表示します。
      </div>
    </div>
  </div>
);

const meta = {
  title: 'Sessions/AvailabilityWorkspaceLayout',
  component: AvailabilityWorkspaceLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
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
    ),
  ],
} satisfies Meta<typeof AvailabilityWorkspaceLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ConfirmLikeLayout: Story = {
  args: {
    calendarSection: null,
    selectedSlotsSection: null,
    desktopSidebarSection: null,
    mobileSidebarSection: null,
    mobileSidebarTitle: 'おすすめ候補',
    mobileSidebarOpen: false,
    onMobileSidebarOpenChange: () => {},
  },
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(makeDate(3));
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [slots, setSlots] = useState<AvailabilityTimeBlockInput[]>(() => {
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
    });

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
            title="参加可能日カレンダー"
            helperText="色ドット + 件数ラベルで日ごとの提出状況を確認できます。"
          />
        }
        selectedSlotsSection={
          <SelectedSlotsPanel
            title="選択中の日程"
            slots={slots}
            minPlaytimeMinutes={360}
            onMoveUp={(index) => {
              if (index <= 0) return;
              setSlots((prev) => {
                const next = [...prev];
                const current = next[index];
                const upper = next[index - 1];
                if (!current || !upper) return prev;
                next[index - 1] = current;
                next[index] = upper;
                return next;
              });
            }}
            onMoveDown={(index) => {
              setSlots((prev) => {
                if (index >= prev.length - 1) return prev;
                const next = [...prev];
                const current = next[index];
                const lower = next[index + 1];
                if (!current || !lower) return prev;
                next[index] = lower;
                next[index + 1] = current;
                return next;
              });
            }}
            onRemoveSlot={(index) =>
              setSlots((prev) => prev.filter((_, i) => i !== index))
            }
          />
        }
        desktopSidebarSection={sidebarContent('おすすめ一覧')}
        mobileSidebarSection={sidebarContent('おすすめ一覧')}
        stickyBar={
          <SelectedSlotsStickyBar
            slots={slots}
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

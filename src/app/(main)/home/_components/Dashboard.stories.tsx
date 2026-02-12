import * as styles from '../styles';
import {
  mockActivities,
  mockCalendarDates,
  mockCompletedSession,
  mockNewScenarios,
  mockUpcomingSessions,
} from './_mocks';
import { ActivityTimeline } from './ActivityTimeline';
import { HeroSection } from './HeroSection';
import { MiniCalendar } from './MiniCalendar';
import { NewScenarios } from './NewScenarios';
import { SystemNotice } from './SystemNotice';
import { UpcomingSessions } from './UpcomingSessions';

import type { Meta, StoryObj } from '@storybook/react';

/** page.tsx の Server Component レイアウトを再現するラッパー */
const DashboardPage = ({
  userName,
  sessions,
  scenarios,
  activities,
  calendarDates,
}: {
  userName: string;
  sessions: typeof mockUpcomingSessions;
  scenarios: typeof mockNewScenarios;
  activities: typeof mockActivities;
  calendarDates: typeof mockCalendarDates;
}) => (
  <div className={styles.pageContainer}>
    <HeroSection userName={userName} nextSession={sessions[0] ?? null} />

    <div className={styles.pageGrid}>
      <div className={styles.mainColumn}>
        <UpcomingSessions sessions={sessions} />
        <ActivityTimeline activities={activities} />
        <NewScenarios scenarios={scenarios} />
      </div>
      <div className={styles.sidebarColumn}>
        <section className={styles.sidebarCard}>
          <MiniCalendar sessionDates={calendarDates} />
          <hr className={styles.sidebarDivider} />
          <SystemNotice />
        </section>
      </div>
    </div>
  </div>
);

const meta = {
  title: 'Dashboard/Page',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'page',
      values: [{ name: 'page', value: '#f5f8f7' }],
    },
  },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** フルデータ表示 */
export const Default: Story = {
  args: {
    userName: 'たろう',
    sessions: mockUpcomingSessions,
    scenarios: mockNewScenarios,
    activities: mockActivities,
    calendarDates: mockCalendarDates,
  },
};

/** セッション・シナリオなし（新規ユーザー） */
export const Empty: Story = {
  args: {
    userName: 'はなこ',
    sessions: [],
    scenarios: [],
    activities: [],
    calendarDates: [],
  },
};

/** 完了セッションを含む */
export const WithCompleted: Story = {
  args: {
    userName: 'たろう',
    sessions: [...mockUpcomingSessions, mockCompletedSession],
    scenarios: mockNewScenarios,
    activities: mockActivities,
    calendarDates: mockCalendarDates,
  },
};

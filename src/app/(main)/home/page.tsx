import { ActivityTimeline } from './_components/ActivityTimeline';
import { HeroSection } from './_components/HeroSection';
import { MiniCalendar } from './_components/MiniCalendar';
import { NewScenarios } from './_components/NewScenarios';
import { SystemNotice } from './_components/SystemNotice';
import { UpcomingSessions } from './_components/UpcomingSessions';
import {
  getDashboardUser,
  getNewScenarios,
  getRecentActivity,
  getSessionDatesForRange,
  getUpcomingSessions,
} from './adapter';
import * as styles from './styles';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'ホーム',
  description: 'ダッシュボード',
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // discord_id → user_id 解決
  const dbUserResult = await getDashboardUser(user.id);
  if (!dbUserResult.success) {
    return null;
  }
  const dbUser = dbUserResult.data;

  // 当月±1ヶ月のカレンダー日程範囲
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  // データを並列取得
  const [upcomingResult, scenariosResult, activityResult, calendarResult] =
    await Promise.all([
      getUpcomingSessions(dbUser.userId),
      getNewScenarios(),
      getRecentActivity(dbUser.userId),
      getSessionDatesForRange(dbUser.userId, startDateStr, endDateStr),
    ]);

  const sessions = upcomingResult.success ? upcomingResult.data : [];
  const scenarios = scenariosResult.success ? scenariosResult.data : [];
  const activities = activityResult.success ? activityResult.data : [];
  const calendarDates = calendarResult.success ? calendarResult.data : [];

  return (
    <div className={styles.pageContainer}>
      <HeroSection
        userName={dbUser.nickname}
        nextSession={sessions[0] ?? null}
      />

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
}

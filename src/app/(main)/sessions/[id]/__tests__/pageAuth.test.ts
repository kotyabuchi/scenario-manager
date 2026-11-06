import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApplicationsPage from '../applications/page';
import AvailabilityPage from '../schedule/availability/page';
import ScheduleConfirmPage from '../schedule/confirm/page';

const { getCurrentUserId, redirect, downstream } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  redirect: vi.fn(),
  downstream: {
    isSessionManager: vi.fn(),
    createDbClient: vi.fn(),
    getApplications: vi.fn(),
    getSessionBasicInfo: vi.fn(),
    getSchedulingPhases: vi.fn(),
    getAvailabilityWorkspaceData: vi.fn(),
    getScheduleRecommendations: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({ redirect, notFound: vi.fn() }));
vi.mock('../../adapter', () => ({ getCurrentUserId }));
vi.mock('../../participantAdapter', () => ({
  isSessionManager: downstream.isSessionManager,
}));
vi.mock('@/lib/supabase/server', () => ({
  createDbClient: downstream.createDbClient,
}));
vi.mock('../applications/adapter', () => ({
  getApplications: downstream.getApplications,
  getSessionBasicInfo: downstream.getSessionBasicInfo,
}));
vi.mock('../scheduleFlowGuards', () => ({
  getSchedulingPhases: downstream.getSchedulingPhases,
}));
vi.mock('../schedule/availability/adapter', () => ({
  getAvailabilityWorkspaceData: downstream.getAvailabilityWorkspaceData,
}));
vi.mock('../schedule/confirm/adapter', () => ({
  getScheduleRecommendations: downstream.getScheduleRecommendations,
}));

vi.mock('@/components/blocks/PageHeader', () => ({ PageHeader: vi.fn() }));
vi.mock('../applications/_components/ApplicationApprovalContent', () => ({
  ApplicationApprovalContent: vi.fn(),
}));
vi.mock(
  '../schedule/availability/_components/SubmitAvailabilityWorkspace',
  () => ({
    SubmitAvailabilityWorkspace: vi.fn(),
  }),
);
vi.mock(
  '../schedule/availability/_components/ConfirmAvailabilityWorkspace',
  () => ({
    ConfirmAvailabilityWorkspace: vi.fn(),
  }),
);

const redirected = new Error('リダイレクトで描画を中断');

describe('セッション管理ページの未ログイン時の遷移', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUserId.mockResolvedValue(null);
    redirect.mockImplementation(() => {
      throw redirected;
    });
  });

  it.each([
    ['参加申請管理', ApplicationsPage],
    ['スケジュールの提出', AvailabilityPage],
    ['日程確定', ScheduleConfirmPage],
  ])('%sではデータ取得前に公開トップへ遷移する', async (_, page) => {
    await expect(
      page({ params: Promise.resolve({ id: 'session-id' }) }),
    ).rejects.toBe(redirected);

    expect(redirect).toHaveBeenCalledExactlyOnceWith('/');
    for (const query of Object.values(downstream)) {
      expect(query).not.toHaveBeenCalled();
    }
  });
});

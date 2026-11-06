import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmScheduleTimeBlocksAction } from './actions';

import type { ConfirmScheduleTimeBlocksValues } from './schema';

const dependencies = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  isSessionManager: vi.fn(),
  getSchedulingPhases: vi.fn(),
  canConfirmScheduleInCurrentPhase: vi.fn(),
  replaceConfirmedScheduleTimeBlocks: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../../../adapter', () => ({
  getCurrentUserId: dependencies.getCurrentUserId,
}));
vi.mock('../../../participantAdapter', () => ({
  isSessionManager: dependencies.isSessionManager,
}));
vi.mock('../../scheduleFlowGuards', () => ({
  getSchedulingPhases: dependencies.getSchedulingPhases,
  canConfirmScheduleInCurrentPhase:
    dependencies.canConfirmScheduleInCurrentPhase,
}));
vi.mock('./adapter', () => ({
  replaceConfirmedScheduleTimeBlocks:
    dependencies.replaceConfirmedScheduleTimeBlocks,
}));

const input: ConfirmScheduleTimeBlocksValues = {
  timeBlocks: [
    {
      startAt: '2026-11-15T09:00:00+09:00',
      endAt: '2026-11-15T11:00:00+09:00',
    },
  ],
};

describe('confirmScheduleTimeBlocksActionのエラー返却形', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dependencies.getCurrentUserId.mockResolvedValue('user-id');
    dependencies.isSessionManager.mockResolvedValue(true);
    dependencies.getSchedulingPhases.mockResolvedValue({
      success: true,
      data: { sessionPhase: 'PREPARATION', schedulePhase: 'ADJUSTING' },
    });
    dependencies.canConfirmScheduleInCurrentPhase.mockReturnValue(true);
  });

  it('存在しないセッションの既知メッセージをplain objectで返す', async () => {
    dependencies.getSchedulingPhases.mockResolvedValueOnce({
      success: false,
      error: new Error('セッションが見つかりません'),
    });

    await expect(
      confirmScheduleTimeBlocksAction('session-id', input),
    ).resolves.toEqual({
      success: false,
      error: { message: 'セッションが見つかりません' },
    });
  });

  it('フェーズ取得の内部エラーをUIへ渡さない', async () => {
    dependencies.getSchedulingPhases.mockResolvedValueOnce({
      success: false,
      error: new Error('connection string: secret'),
    });

    await expect(
      confirmScheduleTimeBlocksAction('session-id', input),
    ).resolves.toEqual({
      success: false,
      error: {
        message:
          '日程の状態を確認できませんでした。時間を置いて再試行してください',
      },
    });
  });

  it('保存adapterの内部エラーをUIへ渡さない', async () => {
    dependencies.replaceConfirmedScheduleTimeBlocks.mockResolvedValueOnce({
      success: false,
      error: new Error('RPC secret detail'),
    });

    await expect(
      confirmScheduleTimeBlocksAction('session-id', input),
    ).resolves.toEqual({
      success: false,
      error: {
        message: '日程を保存できませんでした。時間を置いて再試行してください',
      },
    });
  });

  it('予期しない例外の詳細をUIへ渡さない', async () => {
    dependencies.getCurrentUserId.mockRejectedValueOnce(
      new Error('SDK secret detail'),
    );

    await expect(
      confirmScheduleTimeBlocksAction('session-id', input),
    ).resolves.toEqual({
      success: false,
      error: {
        message: '日程を保存できませんでした。時間を置いて再試行してください',
      },
    });
  });
});

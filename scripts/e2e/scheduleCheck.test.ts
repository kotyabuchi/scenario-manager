import { beforeEach, describe, expect, it, vi } from 'vitest';

import { discover } from './discover';
import { scheduleEvidenceFixture } from './fixtures/scheduleCheck';
import { loadLedger } from './ledger';
import { writeArtifact } from './ledgerArtifacts';
import { validateLedger } from './requirements';
import { runIsolatedCheck } from './runIsolatedCheck';
import { runScheduleCheck } from './scheduleCheck';

vi.mock('./discover', () => ({ discover: vi.fn() }));
vi.mock('./ledger', () => ({ loadLedger: vi.fn() }));
vi.mock('./inventory', () => ({ buildInventory: vi.fn() }));
vi.mock('./source', () => ({ loadSource: vi.fn() }));
vi.mock('./requirements', () => ({ validateLedger: vi.fn() }));
vi.mock('./ledgerArtifacts', () => ({ writeArtifact: vi.fn() }));
vi.mock('./runIsolatedCheck', () => ({ runIsolatedCheck: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('日程browserの実行入口', () => {
  const setup = () => {
    const value = scheduleEvidenceFixture();
    vi.mocked(loadLedger).mockResolvedValue(value.ledger);
    vi.mocked(discover).mockResolvedValue(value.discovery);
    vi.mocked(validateLedger).mockReturnValue({
      issues: [],
      deficiencies: [],
      excepted: [],
    });
    vi.mocked(runIsolatedCheck).mockImplementation(async (_root, options) => {
      const evidence = options.validate(value.input);
      return {
        status: 'passed',
        phase: 'complete',
        runId: value.input.lease.runId,
        environment: null,
        evidence,
      };
    });
    return value;
  };

  it('静的列挙と台帳検証後、共通所有lifecycleへ本物のevidence checkerを接続する', async () => {
    setup();
    expect(await runScheduleCheck('/repository')).toMatchObject({
      status: 'passed',
      evidence: { issues: [], counts: { expected: 6, passed: 6 } },
    });
    expect(discover).toHaveBeenCalledWith({
      root: '/repository',
      profile: 'isolated',
      config: 'playwright.isolated.config.ts',
      setupProjects: [],
    });
    expect(validateLedger).toHaveBeenCalledOnce();
    expect(runIsolatedCheck).toHaveBeenCalledWith(
      '/repository',
      expect.objectContaining({
        stage: 'schedule-browser',
        config: 'playwright.isolated.config.ts',
        receipt: 'test-results/quality/schedule-check.json',
      }),
    );
  });

  it('台帳登録不足・静的エラーでは所有環境を起動しない', async () => {
    const value = setup();
    value.discovery.tests.pop();
    expect(await runScheduleCheck('/repository')).toMatchObject({
      status: 'failed',
      phase: 'discovery',
    });
    expect(runIsolatedCheck).not.toHaveBeenCalled();
    setup();
    vi.mocked(validateLedger).mockReturnValue({
      issues: [
        { code: 'MISSING_TARGET', subject: 'target', message: 'private-error' },
      ],
      deficiencies: [],
      excepted: [],
    });
    expect(await runScheduleCheck('/repository')).toMatchObject({
      status: 'failed',
    });
    expect(runIsolatedCheck).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(writeArtifact).mock.calls)).not.toContain(
      'private-error',
    );
  });

  it('台帳読取が失敗しても動作中の列挙子の終了を待つ', async () => {
    const value = setup();
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(discover).mockImplementation(async () => {
      await pending;
      return value.discovery;
    });
    vi.mocked(loadLedger).mockRejectedValue(new Error('private-ledger-error'));
    let finished = false;
    const running = runScheduleCheck('/repository').then((result) => {
      finished = true;
      return result;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(finished).toBe(false);
    release?.();
    expect(await running).toMatchObject({ status: 'failed' });
    expect(runIsolatedCheck).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(writeArtifact).mock.calls)).not.toContain(
      'private-ledger-error',
    );
  });

  it('環境cleanupの失敗をbrowser成功で上書きしない', async () => {
    setup();
    vi.mocked(runIsolatedCheck).mockImplementation(async (_root, options) => ({
      status: 'failed',
      phase: 'evidence',
      runId: '012345abcdef',
      environment: null,
      evidence: options.validate(scheduleEvidenceFixture().input),
    }));
    expect(await runScheduleCheck('/repository')).toMatchObject({
      status: 'failed',
    });
  });
});

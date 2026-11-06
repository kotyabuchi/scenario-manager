import { beforeEach, describe, expect, it, vi } from 'vitest';

import { discoverIntegration } from './discoverIntegration';
import { integrationLedgerFixture } from './fixtures/integrationLedger';
import { runIntegrationCheck } from './integrationCheck';
import { createIntegrationExpectations } from './integrationExpectations';
import { loadLedger } from './ledger';
import { writeArtifact } from './ledgerArtifacts';
import { validateLedger } from './requirements';
import {
  INTEGRATION_RECEIPT,
  runIntegrationEnvironment,
} from './runIntegrationCheck';

vi.mock('./discoverIntegration', () => ({ discoverIntegration: vi.fn() }));
vi.mock('./ledger', () => ({ loadLedger: vi.fn() }));
vi.mock('./inventory', () => ({ buildInventory: vi.fn() }));
vi.mock('./source', () => ({ loadSource: vi.fn() }));
vi.mock('./requirements', () => ({ validateLedger: vi.fn() }));
vi.mock('./ledgerArtifacts', () => ({ writeArtifact: vi.fn() }));
vi.mock('./runIntegrationCheck', () => ({
  INTEGRATION_RECEIPT: 'test-results/quality/integration-check.json',
  runIntegrationEnvironment: vi.fn(),
}));

const setup = async () => {
  const actual = await vi.importActual<typeof import('./ledger')>('./ledger');
  vi.mocked(loadLedger).mockImplementation(actual.loadLedger);
  const fixture = await integrationLedgerFixture();
  vi.mocked(loadLedger).mockResolvedValue(fixture.ledger);
  vi.mocked(discoverIntegration).mockResolvedValue(fixture.collection);
  vi.mocked(validateLedger).mockReturnValue({
    issues: [],
    deficiencies: [],
    excepted: [],
  });
  vi.mocked(runIntegrationEnvironment).mockResolvedValue({
    status: 'passed',
    phase: 'complete',
    runId: 'a'.repeat(12),
    environment: null,
    evidence: {
      issues: [],
      counts: { expected: 20, tests: 20, passed: 20, journals: 20 },
    },
  });
  return fixture;
};
beforeEach(() => vi.resetAllMocks());

describe('integrationの実行入口', () => {
  it('台帳と収集を照合して必要20登録を所有runnerへ渡す', async () => {
    const fixture = await setup();
    const expected = createIntegrationExpectations(
      fixture.ledger,
      fixture.collection,
    );
    expect(await runIntegrationCheck('/repository')).toMatchObject({
      status: 'passed',
      evidence: { counts: { passed: 20 } },
    });
    expect(runIntegrationEnvironment).toHaveBeenCalledWith(
      '/repository',
      expected,
    );
    expect(writeArtifact).toHaveBeenCalledWith(
      '/repository',
      'test-results/quality/integration-discovery.json',
      expect.any(String),
    );
  });

  it('登録欠落・静的エラー・collector失敗では環境を起動しない', async () => {
    for (const fault of ['registration', 'static', 'collector']) {
      vi.resetAllMocks();
      const fixture = await setup();
      if (fault === 'registration') fixture.collection.discovery.tests.pop();
      if (fault === 'static')
        vi.mocked(validateLedger).mockReturnValue({
          issues: [
            { code: 'TEST_MISSING', subject: 'case', message: 'missing' },
          ],
          deficiencies: [],
          excepted: [],
        });
      if (fault === 'collector')
        vi.mocked(discoverIntegration).mockRejectedValue(
          new Error('collector failed'),
        );
      expect(await runIntegrationCheck('/repository')).toMatchObject({
        status: 'failed',
        phase: 'discovery',
      });
      expect(runIntegrationEnvironment).not.toHaveBeenCalled();
      expect(writeArtifact).toHaveBeenLastCalledWith(
        '/repository',
        INTEGRATION_RECEIPT,
        expect.stringContaining('"status":"failed"'),
      );
    }
  });

  it('台帳読込が失敗しても収集子の終了前に返らない', async () => {
    const fixture = await setup();
    vi.mocked(loadLedger).mockRejectedValue(new Error('ledger failed'));
    let release = () => {};
    let childClosed = false;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(discoverIntegration).mockImplementation(async () => {
      await pending;
      childClosed = true;
      return fixture.collection;
    });
    let returned = false;
    const running = runIntegrationCheck('/repository').then((result) => {
      returned = true;
      return result;
    });
    try {
      await vi.waitFor(() => expect(discoverIntegration).toHaveBeenCalled());
      expect(returned).toBe(false);
      expect(childClosed).toBe(false);
      release();
      expect(await running).toMatchObject({ status: 'failed' });
      expect(childClosed).toBe(true);
      expect(runIntegrationEnvironment).not.toHaveBeenCalled();
    } finally {
      release();
      await running;
    }
  });

  it('runnerまたは環境後始末の失敗を正常な登録集合で上書きしない', async () => {
    await setup();
    vi.mocked(runIntegrationEnvironment).mockResolvedValue({
      status: 'failed',
      phase: 'evidence',
      runId: 'b'.repeat(12),
      environment: null,
      evidence: {
        issues: [],
        counts: { expected: 20, tests: 20, passed: 20, journals: 20 },
      },
    });
    expect(await runIntegrationCheck('/repository')).toMatchObject({
      status: 'failed',
      phase: 'evidence',
    });
  });
});

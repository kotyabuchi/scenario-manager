import { beforeEach, describe, expect, it, vi } from 'vitest';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { ledgerSchema } from '../../e2e/ledger/schema';
import { discoverySchema } from './discoverySchema';
import { inventoryFixture } from './fixtures/selection';
import { legacyKey } from './legacy';
import { prepareVerification } from './prepareVerification';

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  compare: vi.fn(),
  ledger: vi.fn(),
  discover: vi.fn(),
  integration: vi.fn(),
  bind: vi.fn(),
  validate: vi.fn(),
  schedule: vi.fn(),
  integrationExpected: vi.fn(),
  read: vi.fn(),
  origins: vi.fn(),
  legacy: vi.fn(),
  selection: vi.fn(),
  plan: vi.fn(),
}));
vi.mock('./fingerprint', () => ({
  captureInputs: mocks.capture,
  compareInputs: mocks.compare,
}));
vi.mock('./ledger', () => ({ loadLedger: mocks.ledger }));
vi.mock('./discover', () => ({ discover: mocks.discover }));
vi.mock('./discoverIntegration', () => ({
  discoverIntegration: mocks.integration,
}));
vi.mock('./discoveryBindings', () => ({ bindDiscovery: mocks.bind }));
vi.mock('./requirements', () => ({ validateLedger: mocks.validate }));
vi.mock('./inventory', () => ({
  buildInventory: vi.fn(() => inventoryFixture()),
}));
vi.mock('./source', () => ({ loadSource: vi.fn(() => ({})) }));
vi.mock('./scheduleCheckExpectations', () => ({
  createScheduleExpectations: mocks.schedule,
}));
vi.mock('./integrationExpectations', () => ({
  createIntegrationExpectations: mocks.integrationExpected,
}));
vi.mock('./ledgerArtifacts', () => ({ readArtifact: mocks.read }));
vi.mock('./legacyOrigin', () => ({ verifyLegacyOrigins: mocks.origins }));
vi.mock('./legacySelection', () => ({
  createLegacySelection: mocks.selection,
}));
vi.mock('./legacy', async (original) => ({
  ...(await original<typeof import('./legacy')>()),
  buildLegacy: mocks.legacy,
}));
vi.mock('./verificationPlan', async (original) => ({
  ...(await original<typeof import('./verificationPlan')>()),
  createVerificationPlan: mocks.plan,
}));

const gate = () => {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
};
const fixture = () => {
  const ledger = ledgerSchema.parse({
    schemaVersion: 1,
    profiles: [],
    fixtures: [],
    contracts: [],
    scenarios: [],
    executionGroups: [],
    exceptions: [],
  });
  const plan = { schemaVersion: 1, requirements: [], allowedExtraTests: [] };
  const empty = (profile: string) =>
    discoverySchema.parse({
      schemaVersion: 1,
      profile,
      errors: [],
      projects: [],
      tests: [],
    });
  const inputs = { digest: 'a'.repeat(64) };
  mocks.capture.mockResolvedValue(inputs);
  mocks.compare.mockReturnValue({ added: [], removed: [], changed: [] });
  mocks.ledger.mockResolvedValue(ledger);
  mocks.discover.mockImplementation(async ({ profile }: { profile: string }) =>
    empty(profile),
  );
  mocks.integration.mockResolvedValue({ discovery: empty('integration') });
  mocks.bind.mockReturnValue({ registrations: [], issues: [] });
  mocks.validate.mockReturnValue({ issues: [] });
  mocks.schedule.mockReturnValue([]);
  mocks.integrationExpected.mockReturnValue([]);
  mocks.read.mockImplementation((_root: string, path: string) =>
    JSON.stringify(
      path.endsWith('legacy-execution.json')
        ? { schemaVersion: 1, entries: [] }
        : {
            schemaVersion: 1,
            tests: [],
            registered: [],
            setups: [],
            groups: [],
          },
    ),
  );
  mocks.origins.mockResolvedValue(undefined);
  mocks.legacy.mockResolvedValue({});
  mocks.selection.mockReturnValue({ entries: [] });
  mocks.plan.mockReturnValue(plan);
  return { ledger, plan, inputs };
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('verification準備の失敗境界', () => {
  it('legacy全4projectの選択を明示extraへ保持し、実discoveryと対応させる', async () => {
    fixture();
    const tests = legacyProjectSchema.options.map((project) => ({
      testId: `legacy-${project}`,
      file: 'e2e/old.spec.ts',
      titlePath: ['old', project],
      line: 1,
      column: 1,
      project,
      repeatEachIndex: 0,
      expectedStatus: 'passed',
      annotations: [],
      tags: [],
      isSetup: false,
    }));
    const entries = tests.map((test) => ({
      key: legacyKey('app', test),
      fingerprint: 'a'.repeat(64),
      disposition: 'local',
    }));
    mocks.discover.mockImplementation(
      async ({ profile }: { profile: string }) =>
        discoverySchema.parse({
          schemaVersion: 1,
          profile,
          errors: [],
          projects:
            profile === 'app'
              ? legacyProjectSchema.options.map((name) => ({
                  name,
                  testDir: 'e2e',
                  dependencies: [],
                  repeatEach: 1,
                }))
              : [],
          tests: profile === 'app' ? tests : [],
        }),
    );
    mocks.read.mockImplementation((_root: string, path: string) =>
      JSON.stringify(
        path.endsWith('legacy-execution.json')
          ? { schemaVersion: 1, entries }
          : {
              schemaVersion: 1,
              tests: [],
              registered: [],
              setups: [],
              groups: [],
            },
      ),
    );
    mocks.selection.mockImplementation(({ project }: { project: string }) => ({
      entries: entries.filter(
        (_entry, index) => tests[index]?.project === project,
      ),
    }));
    await prepareVerification('fixture-root');
    expect(mocks.selection.mock.calls.map(([input]) => input.project)).toEqual(
      legacyProjectSchema.options,
    );
    const selected = mocks.plan.mock.calls[0]?.[0]?.allowedExtraTests;
    expect(selected).toEqual(
      tests.map((test, index) => ({
        profile: 'app',
        runtime: 'next-production',
        test,
        legacy: entries[index],
      })),
    );
    expect(mocks.schedule).toHaveBeenCalledOnce();
    expect(mocks.integrationExpected).toHaveBeenCalledOnce();
    expect(mocks.origins).toHaveBeenCalledOnce();
  });

  it('選択済みlegacyの登録欠落をextra削減として受け入れない', async () => {
    fixture();
    mocks.selection.mockReturnValue({ entries: [{ key: 'missing' }] });
    await expect(prepareVerification('fixture-root')).rejects.toThrow(
      '実行集合の対応',
    );
    expect(mocks.plan).not.toHaveBeenCalled();
  });
  it('先行collectorが失敗しても残る全collectorの終了までrejectしない', async () => {
    fixture();
    const pending = gate();
    let integrationFinished = false;
    mocks.discover.mockImplementation(
      async ({ profile }: { profile: string }) => {
        if (profile === 'app') throw new Error('collector failed');
        return discoverySchema.parse({
          schemaVersion: 1,
          profile,
          errors: [],
          projects: [],
          tests: [],
        });
      },
    );
    mocks.integration.mockImplementation(async () => {
      await pending.promise;
      integrationFinished = true;
      throw new Error('later collector failed');
    });
    let settled = false;
    const running = prepareVerification('fixture-root').then(
      () => {
        settled = true;
        return null;
      },
      (error: unknown) => {
        settled = true;
        return error;
      },
    );
    await vi.waitFor(() => expect(mocks.integration).toHaveBeenCalledOnce());
    expect(mocks.discover).toHaveBeenCalledTimes(3);
    expect(settled).toBe(false);
    expect(mocks.plan).not.toHaveBeenCalled();
    pending.release();
    expect(await running).toEqual(new Error('collector failed'));
    expect(integrationFinished).toBe(true);
    expect(mocks.capture).toHaveBeenCalledTimes(1);
  });

  it('台帳読取失敗でも開始済みcollectorを放置しない', async () => {
    fixture();
    const pending = gate();
    mocks.ledger.mockRejectedValue(new Error('ledger failed'));
    mocks.integration.mockImplementation(async () => {
      await pending.promise;
      return { discovery: {} };
    });
    let finished = false;
    const running = prepareVerification('fixture-root').catch(
      (error: unknown) => {
        finished = true;
        return error;
      },
    );
    await vi.waitFor(() => expect(mocks.integration).toHaveBeenCalledOnce());
    expect(finished).toBe(false);
    pending.release();
    expect(await running).toEqual(new Error('ledger failed'));
    expect(mocks.selection).not.toHaveBeenCalled();
  });

  it('全列挙・選択後の入力変化は固定planがあっても拒否する', async () => {
    fixture();
    mocks.compare.mockReturnValue({
      added: [],
      removed: [],
      changed: ['e2e/business.spec.ts'],
    });
    await expect(prepareVerification('fixture-root')).rejects.toThrow(
      '検証入力が変化',
    );
    expect(mocks.capture).toHaveBeenCalledTimes(2);
    expect(mocks.plan).toHaveBeenCalledOnce();
    expect(mocks.capture.mock.invocationCallOrder[1]).toBeGreaterThan(
      mocks.plan.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(mocks.discover).toHaveBeenCalledWith({
      root: 'fixture-root',
      profile: 'app',
      config: 'playwright.legacy-local.config.ts',
      setupProjects: [],
    });
  });

  it.each([
    'bindings',
    'ledger',
    'schedule',
    'integration',
    'origin',
  ])('%s拒否からplanや後続検査へ進まない', async (fault) => {
    fixture();
    if (fault === 'bindings')
      mocks.bind.mockReturnValue({
        registrations: [],
        issues: [{ code: 'BAD' }],
      });
    if (fault === 'ledger')
      mocks.validate.mockReturnValue({ issues: [{ code: 'BAD' }] });
    if (fault === 'schedule')
      mocks.schedule.mockImplementation(() => {
        throw new Error('required8 missing');
      });
    if (fault === 'integration')
      mocks.integrationExpected.mockImplementation(() => {
        throw new Error('required20 missing');
      });
    if (fault === 'origin')
      mocks.origins.mockRejectedValue(new Error('origin invalid'));
    await expect(prepareVerification('fixture-root')).rejects.toThrow();
    expect(mocks.plan).not.toHaveBeenCalled();
    expect(mocks.capture).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { verificationFixture } from './fixtures/verification';
import { runVerificationStages } from './runVerificationStages';
import {
  prepareVerificationDirectory,
  verificationStagePath,
} from './verificationContext';
import { verificationTestKey } from './verificationPlan';
import { digestVerificationPlan } from './verificationPlanDigest';
import { verificationReportSchema } from './verificationSchema';
import { verifyResults } from './verifyResults';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { prepareVerification } from './prepareVerification';
import type { VerificationStageHooks } from './verificationContext';
import type { VerificationStageResult } from './verificationSchema';

const mocks = vi.hoisted(() => ({
  integration: vi.fn(),
  storybook: vi.fn(),
  isolated: vi.fn(),
  legacy: vi.fn(),
}));
vi.mock('./runIntegrationCheck', () => ({
  runIntegrationEnvironment: mocks.integration,
}));
vi.mock('./runStorybookVerification', () => ({
  runStorybookVerification: mocks.storybook,
}));
vi.mock('./runIsolatedCheck', () => ({ runIsolatedCheck: mocks.isolated }));
vi.mock('./runLegacy', () => ({ runLegacy: mocks.legacy }));

const roots: string[] = [];
const setup = () => {
  const base = verificationFixture();
  const source = base.plan.requirements[0];
  if (source === undefined) throw new Error('fixture不足');
  mkdirSync(resolve('test-results'), { recursive: true });
  const root = mkdtempSync(resolve('test-results/verification-stage-'));
  roots.push(root);
  const { stageId: _stageId, ...context } = base.stage.context;
  prepareVerificationDirectory(root, context.verificationId);
  const definitions = [
    ['integration', 'integration', 'integration'],
    ['storybook', 'storybook', 'storybook'],
    ['isolated', 'isolated', 'chromium-auth'],
    ...legacyProjectSchema.options.map((project) => [
      `app-${project}`,
      'app',
      project,
    ]),
  ];
  const requirements = definitions.map(([stageId, profile, project]) => {
    if (stageId === undefined || profile === undefined || project === undefined)
      throw new Error('fixture不足');
    const test = {
      ...source.test,
      testId: stageId,
      project,
      repeatEachIndex: 0,
    };
    return {
      ...source,
      kind: 'business' as const,
      key: verificationTestKey(profile, test),
      profile,
      test,
      dependencies: [],
    };
  });
  const prepared: Awaited<ReturnType<typeof prepareVerification>> = {
    plan: { schemaVersion: 1, requirements, allowedExtraTests: [] },
    inputs: {
      schemaVersion: 1,
      algorithm: 'sha256',
      root,
      rules: 'fixed-input-scope-v1-next16-template-v1',
      digest: context.inputDigest,
      files: [],
    },
    scheduleExpected: [],
    integrationExpected: [],
  };
  context.selectionDigest = digestVerificationPlan(prepared.plan);
  const controller = new AbortController();
  const checkpoint = vi.fn(async () => {});
  const save = (hooks: VerificationStageHooks) => {
    const entry = requirements.find(
      ({ test }) => test.testId === hooks.context.stageId,
    );
    if (entry === undefined) throw new Error('stage fixture不足');
    const vitest = entry.profile === 'integration';
    const report = verificationReportSchema.parse({
      ...base.report,
      context: hooks.context,
      profile: entry.profile,
      runner: vitest ? 'vitest' : 'playwright',
      version: vitest ? '3.2.4' : '1.57.0',
      tests: [
        {
          testId: entry.test.testId,
          file: entry.test.file,
          titlePath: entry.test.titlePath,
          line: entry.test.line,
          column: entry.test.column,
          project: entry.test.project,
          repeatEachIndex: entry.test.repeatEachIndex,
          expectedStatus: entry.test.expectedStatus,
          annotations: entry.test.annotations,
          outcome: 'expected',
          results: [
            { retry: 0, status: 'passed', errorCount: 0, annotations: [] },
          ],
          ...(vitest
            ? {
                vitest: {
                  options: {
                    mode: 'run',
                    fails: false,
                    concurrent: false,
                    retry: 0,
                    repeats: 0,
                  },
                  diagnostic: {
                    retryCount: 0,
                    repeatCount: 0,
                    flaky: false,
                    startTime: 1,
                    duration: 1,
                  },
                },
              }
            : {}),
        },
      ],
      ...(vitest
        ? {
            vitest: {
              unhandledErrorCount: 0,
              modules: [
                {
                  file: entry.test.file,
                  project: 'integration',
                  state: 'passed',
                  errorCount: 0,
                  suiteErrorCount: 0,
                },
              ],
            },
          }
        : {}),
    });
    writeFileSync(
      verificationStagePath(
        root,
        hooks.context,
        vitest ? 'vitest.json' : 'playwright.json',
      ),
      JSON.stringify(report),
    );
  };
  const closeAndSave = (hooks: VerificationStageHooks) => {
    save(hooks);
    hooks.onExit({ exitCode: 0, signal: null });
  };
  const evidence: VerificationStageResult['evidence']['result'] = {
    issues: [],
    counts: { expected: 1, tests: 1, passed: 1 },
  };
  const environment = { cleanup: structuredClone(base.stage.cleanup) };
  const result = () => ({
    status: 'passed',
    runId: '123456abcdef',
    environment: structuredClone(environment),
    evidence: structuredClone(evidence),
  });
  mocks.integration.mockImplementation(
    async (
      _root: string,
      _expected: unknown,
      hooks: VerificationStageHooks,
    ) => {
      closeAndSave(hooks);
      return result();
    },
  );
  mocks.storybook.mockImplementation(
    async (_root: string, hooks: VerificationStageHooks) => {
      closeAndSave(hooks);
      return {
        status: 'passed',
        exitCode: 0,
        signal: null,
        processCleanup: { exited: true, errorCount: 0 },
      };
    },
  );
  mocks.isolated.mockImplementation(
    async (
      _root: string,
      options: { verification: VerificationStageHooks },
    ) => {
      closeAndSave(options.verification);
      return result();
    },
  );
  mocks.legacy.mockImplementation(
    async (
      _root: string,
      _args: string[],
      hooks: (
        project: (typeof legacyProjectSchema.options)[number],
      ) => VerificationStageHooks,
    ) => {
      const projects = legacyProjectSchema.options.map((project) => {
        closeAndSave(hooks(project));
        return {
          project,
          status: 'passed',
          runId: '123456abcdef',
          environment: structuredClone(environment),
          results: [{}],
        };
      });
      return { status: 'passed', projects, results: [{}] };
    },
  );
  const input = {
    root,
    prepared,
    context,
    signal: controller.signal,
    checkpoint,
  };
  const check = (stages: unknown[]) =>
    verifyResults({
      plan: prepared.plan,
      verificationId: context.verificationId,
      selectionDigest: context.selectionDigest,
      inputDigestBefore: context.inputDigest,
      inputDigestAfter: context.inputDigest,
      stages,
    });
  return { input, check, closeAndSave, save, result, controller, environment };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('verification stage失敗の保持', () => {
  it('7stageを事前確保し各標準report・実close・境界結果を最終checkerへ接続する', async () => {
    const fixture = setup();
    const { stages, runs } = await runVerificationStages(fixture.input);
    expect(stages).toHaveLength(7);
    expect(runs).toHaveLength(7);
    expect(fixture.check(stages).issues).toEqual([]);
    expect(mocks.legacy).toHaveBeenCalledWith(
      fixture.input.root,
      [],
      expect.any(Function),
    );
  });

  it.each([
    'returned-failure',
    'throw',
  ])('runner %sで次のDBを起動せず未起動stageを残す', async (fault) => {
    const fixture = setup();
    mocks.integration.mockImplementation(
      async (
        _root: string,
        _expected: unknown,
        hooks: VerificationStageHooks,
      ) => {
        fixture.save(hooks);
        hooks.onExit({ exitCode: 7, signal: null });
        if (fault === 'throw') throw new Error('PRIVATE_RUNNER_FAILURE');
        return { ...fixture.result(), status: 'failed' };
      },
    );
    const result = await runVerificationStages(fixture.input);
    expect(result.stages).toHaveLength(7);
    expect(result.stages[0]).toMatchObject({
      exitCode: 7,
      processCleanup: { exited: true },
    });
    expect(
      result.stages
        .slice(1)
        .every(
          (stage) =>
            stage.report === null &&
            stage.evidence.result.issues.some(
              ({ code }) => code === 'STAGE_NOT_RUN',
            ),
        ),
    ).toBe(true);
    expect(mocks.storybook).not.toHaveBeenCalled();
    expect(mocks.isolated).not.toHaveBeenCalled();
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(fixture.check(result.stages).issues.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain('PRIVATE_RUNNER_FAILURE');
  });

  it('Storybook失敗でも未起動isolated/app stageを残し次のDBを作らない', async () => {
    const fixture = setup();
    mocks.storybook.mockImplementation(
      async (_root: string, hooks: VerificationStageHooks) => {
        fixture.save(hooks);
        hooks.onExit({ exitCode: 1, signal: null });
        return {
          status: 'failed',
          exitCode: 1,
          signal: null,
          processCleanup: { exited: true, errorCount: 0 },
        };
      },
    );
    const { stages, runs } = await runVerificationStages(fixture.input);
    expect(runs).toHaveLength(2);
    expect(stages[1]?.evidence.result.issues).toEqual([
      { code: 'STORYBOOK_FAILED' },
    ]);
    expect(stages.slice(2).every(({ report }) => report === null)).toBe(true);
    expect(mocks.isolated).not.toHaveBeenCalled();
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(fixture.check(stages).issues.length).toBeGreaterThan(0);
  });

  it('実onCloseがなければ子runnerのpassedから終了を捏造しない', async () => {
    const fixture = setup();
    mocks.integration.mockImplementation(
      async (
        _root: string,
        _expected: unknown,
        hooks: VerificationStageHooks,
      ) => {
        fixture.save(hooks);
        return fixture.result();
      },
    );
    const { stages } = await runVerificationStages(fixture.input);
    expect(stages[0]).toMatchObject({
      exitCode: null,
      signal: null,
      processCleanup: { exited: false },
    });
    expect(fixture.check(stages).issues).toContainEqual({
      code: 'RUNNER_EXIT_FAILED',
      subject: 'integration',
    });
  });

  it.each([
    'boundary',
    'cleanup',
    'missing-report',
    'stale-report',
  ])('%sを子の成功statusで隠さない', async (fault) => {
    const fixture = setup();
    mocks.integration.mockImplementation(
      async (
        _root: string,
        _expected: unknown,
        hooks: VerificationStageHooks,
      ) => {
        if (fault !== 'missing-report') {
          fixture.closeAndSave(hooks);
          if (fault === 'stale-report') {
            const stale = {
              ...hooks,
              context: { ...hooks.context, inputDigest: 'd'.repeat(64) },
            };
            fixture.save(stale);
          }
        } else hooks.onExit({ exitCode: 0, signal: null });
        const result = fixture.result();
        if (fault === 'boundary')
          result.evidence.issues.push({ code: 'ACTOR_REVERSED' });
        if (fault === 'cleanup' && result.environment.cleanup !== null)
          result.environment.cleanup.status = 'incomplete';
        return result;
      },
    );
    const { stages } = await runVerificationStages(fixture.input);
    expect(fixture.check(stages).issues.length).toBeGreaterThan(0);
    if (fault === 'boundary')
      expect(stages[0]?.evidence.result.issues).toEqual([
        { code: 'ACTOR_REVERSED' },
      ]);
    if (fault === 'cleanup')
      expect(stages[0]?.cleanup?.status).toBe('incomplete');
    if (fault === 'missing-report') expect(stages[0]?.report).toBeNull();
  });

  it('isolated失敗時の境界結果とcleanupを残しlegacyを起動しない', async () => {
    const fixture = setup();
    mocks.isolated.mockImplementation(
      async (
        _root: string,
        options: { verification: VerificationStageHooks },
      ) => {
        fixture.closeAndSave(options.verification);
        return {
          ...fixture.result(),
          status: 'failed',
          evidence: {
            issues: [{ code: 'JOURNAL_INCOMPLETE' }],
            counts: { expected: 1, tests: 1, passed: 0 },
          },
        };
      },
    );
    const { stages, runs } = await runVerificationStages(fixture.input);
    expect(runs).toHaveLength(3);
    expect(stages[2]?.evidence.result.issues).toEqual([
      { code: 'JOURNAL_INCOMPLETE' },
    ]);
    expect(stages[2]?.cleanup).toEqual(fixture.environment.cleanup);
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(fixture.check(stages).issues.length).toBeGreaterThan(0);
  });

  it('全project個別passedでもlegacy全体の集約失敗を4stageへ残す', async () => {
    const fixture = setup();
    const success = mocks.legacy.getMockImplementation();
    mocks.legacy.mockImplementation(async (...args: unknown[]) => {
      const value: unknown = await success?.(...args);
      if (typeof value !== 'object' || value === null)
        throw new Error('fixture不足');
      return { ...value, status: 'failed', results: null };
    });
    const { stages } = await runVerificationStages(fixture.input);
    for (const stage of stages.slice(3)) {
      expect(stage.evidence.result.issues).toEqual([{ code: 'LEGACY_FAILED' }]);
      expect(stage.evidence.result.resultsChecked).toBe(false);
    }
    expect(fixture.check(stages).issues.length).toBeGreaterThan(0);
  });

  it('開始前abortでは全stageを未起動で残し環境を作らない', async () => {
    const fixture = setup();
    fixture.controller.abort();
    const { stages, runs } = await runVerificationStages(fixture.input);
    expect(stages).toHaveLength(7);
    expect(runs).toEqual([]);
    expect(
      stages.every(
        ({ report, processCleanup }) =>
          report === null && !processCleanup.exited,
      ),
    ).toBe(true);
    expect(mocks.integration).not.toHaveBeenCalled();
  });
});

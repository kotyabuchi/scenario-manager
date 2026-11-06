import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verificationFixture } from './fixtures/verification';
import { runVerificationStages } from './runVerificationStages';
import { prepareVerificationDirectory } from './verificationContext';
import { verificationTestKey } from './verificationPlan';
import { digestVerificationPlan } from './verificationPlanDigest';

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import type { RunnerSelection } from './runnerSelection';
import type { VerificationStageHooks } from './verificationContext';

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
const setup = (profiles: string[]) => {
  const base = verificationFixture();
  const source = base.plan.requirements.find(({ kind }) => kind === 'business');
  if (!source) throw new Error('fixture不足');
  mkdirSync(resolve('test-results'), { recursive: true });
  const root = mkdtempSync(resolve('test-results/verification-selection-'));
  roots.push(root);
  const requirements = profiles.map((profile) => {
    const test = {
      ...source.test,
      testId: profile,
      project: profile,
      repeatEachIndex: 0,
    };
    return {
      ...source,
      profile,
      test,
      key: verificationTestKey(profile, test),
      dependencies: [],
    };
  });
  const plan = {
    schemaVersion: 1 as const,
    requirements,
    allowedExtraTests: [],
  };
  const { stageId: _stageId, ...context } = base.stage.context;
  context.selectionDigest = digestVerificationPlan(plan);
  prepareVerificationDirectory(root, context.verificationId);
  return {
    root,
    context,
    signal: new AbortController().signal,
    checkpoint: vi.fn(async () => {}),
    prepared: {
      plan,
      inputs: {
        schemaVersion: 1 as const,
        algorithm: 'sha256' as const,
        root,
        rules: 'fixed-input-scope-v1-next16-template-v1' as const,
        digest: context.inputDigest,
        files: [],
      },
      scheduleExpected: [],
      integrationExpected: [],
    },
  };
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.storybook.mockImplementation(
    async (_root: string, hooks: VerificationStageHooks) => {
      hooks.onExit({ exitCode: 0, signal: null });
      return {
        status: 'passed',
        processCleanup: { exited: true, errorCount: 0 },
      };
    },
  );
  mocks.isolated.mockResolvedValue({
    status: 'passed',
    runId: '123456abcdef',
    environment: null,
    evidence: null,
  });
});
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('選択したstageだけを実行する', () => {
  it('Storybookだけの選択はDBとlegacy ownerを起動しない', async () => {
    const input = setup(['storybook']);
    const test = input.prepared.plan.requirements[0]?.test;
    if (!test) throw new Error('fixture不足');
    const selection: RunnerSelection = {
      kind: 'playwright',
      rootDir: '.storybook/tests',
      expected: {
        schemaVersion: 1,
        profile: 'storybook',
        projects: [
          {
            name: 'storybook',
            testDir: '.storybook/tests',
            dependencies: [],
            repeatEach: 1,
          },
        ],
        tests: [test],
        errors: [],
      },
    };
    const result = await runVerificationStages({
      ...input,
      selections: [selection],
    });
    expect(result.stages.map(({ context }) => context.stageId)).toEqual([
      'storybook',
    ]);
    expect(result.runs).toHaveLength(1);
    expect(mocks.storybook.mock.calls[0]?.[2]).toEqual(selection);
    expect(mocks.integration).not.toHaveBeenCalled();
    expect(mocks.isolated).not.toHaveBeenCalled();
    expect(mocks.legacy).not.toHaveBeenCalled();
  });

  it.each([
    false,
    true,
  ])('shadowの継続方針=%sでも失敗行を保持する', async (continueAfterFailure) => {
    const input = setup(['storybook', 'isolated']);
    mocks.storybook.mockImplementation(
      async (_root: string, hooks: VerificationStageHooks) => {
        hooks.onExit({ exitCode: 1, signal: null });
        return {
          status: 'failed',
          processCleanup: { exited: true, errorCount: 0 },
        };
      },
    );
    const result = await runVerificationStages({
      ...input,
      continueAfterFailure,
    });
    expect(result.stages.map(({ context }) => context.stageId)).toEqual([
      'storybook',
      'isolated',
    ]);
    expect(result.runs[0]?.status).toBe('failed');
    expect(mocks.isolated).toHaveBeenCalledTimes(continueAfterFailure ? 1 : 0);
    expect(result.runs).toHaveLength(continueAfterFailure ? 2 : 1);
    expect(mocks.integration).not.toHaveBeenCalled();
    expect(mocks.legacy).not.toHaveBeenCalled();
  });

  it.each([
    { label: '終了通知なし', reportsExit: false, exited: true, errorCount: 0 },
    { label: '未終了', reportsExit: false, exited: false, errorCount: 0 },
    { label: '停止確認の障害', reportsExit: true, exited: true, errorCount: 1 },
  ])('Storybookの$labelではShadowを継続しない', async ({
    reportsExit,
    exited,
    errorCount,
  }) => {
    const input = setup(['storybook', 'isolated']);
    mocks.storybook.mockImplementation(
      async (_root: string, hooks: VerificationStageHooks) => {
        if (reportsExit) hooks.onExit({ exitCode: 1, signal: null });
        return { status: 'failed', processCleanup: { exited, errorCount } };
      },
    );
    const result = await runVerificationStages({
      ...input,
      continueAfterFailure: true,
    });
    expect(result.runs).toMatchObject([
      { stageId: 'storybook', status: 'failed' },
    ]);
    expect(mocks.isolated).not.toHaveBeenCalled();
  });

  it.each([
    'incomplete',
    'remaining',
    'owner-error',
  ] as const)('integrationのDB後始末が%sなら終了済みでもShadowを継続しない', async (fault) => {
    const input = setup(['integration', 'storybook']);
    const cleanup = verificationFixture().stage.cleanup;
    if (!cleanup) throw new Error('fixture不足');
    if (fault === 'incomplete') cleanup.status = 'incomplete';
    if (fault === 'remaining')
      cleanup.remaining.volumes.push({
        name: 'owned',
        projectLabel: 'sm-e2e-012345abcdef',
        createdAt: cleanup.at,
      });
    mocks.integration.mockImplementation(
      async (
        _root: string,
        _expected: unknown,
        hooks: VerificationStageHooks,
      ) => {
        hooks.onExit({
          exitCode: fault === 'owner-error' ? 0 : 1,
          signal: null,
        });
        return {
          status: 'failed',
          runId: '012345abcdef',
          environment: { cleanup },
          evidence: null,
        };
      },
    );
    const result = await runVerificationStages({
      ...input,
      continueAfterFailure: true,
    });
    expect(result.runs).toMatchObject([
      { stageId: 'integration', status: 'failed' },
    ]);
    expect(mocks.storybook).not.toHaveBeenCalled();
  });
});

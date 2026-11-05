import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { discover } from './discover';
import { appFixture } from './fixtures/isolatedApp';
import { verificationFixture } from './fixtures/verification';
import { writeArtifact } from './ledgerArtifacts';
import { buildLegacy, legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { verifyLegacyOrigins } from './legacyOrigin';
import { runLegacyProject } from './legacyProjectRun';
import { aggregateLegacyResults } from './legacyResults';
import {
  createLegacySelection,
  validateLegacyDiscovery,
} from './legacySelection';
import { assertLegacySources, captureLegacySources } from './legacySourceGuard';
import { parseLegacyArguments, runLegacy } from './runLegacy';

import {
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { LegacyExecutionResult } from './legacyExecutionSchema';

vi.mock('./discover', () => ({ discover: vi.fn() }));
vi.mock('./legacyOrigin', () => ({ verifyLegacyOrigins: vi.fn() }));
vi.mock('./legacySourceGuard', () => ({
  captureLegacySources: vi.fn(),
  assertLegacySources: vi.fn(),
}));
vi.mock('./legacy', async (original) => ({
  ...(await original<typeof import('./legacy')>()),
  buildLegacy: vi.fn(),
}));
vi.mock('./legacyProjectRun', () => ({ runLegacyProject: vi.fn() }));
vi.mock('./legacyResults', async (original) => {
  const actual = await original<typeof import('./legacyResults')>();
  return {
    ...actual,
    aggregateLegacyResults: vi.fn(actual.aggregateLegacyResults),
  };
});
vi.mock('./legacySelection', async (original) => {
  const actual = await original<typeof import('./legacySelection')>();
  return {
    ...actual,
    createLegacySelection: vi.fn(actual.createLegacySelection),
    validateLegacyDiscovery: vi.fn(actual.validateLegacyDiscovery),
  };
});
vi.mock('./ledgerArtifacts', async (original) => {
  const actual = await original<typeof import('./ledgerArtifacts')>();
  return { ...actual, writeArtifact: vi.fn(actual.writeArtifact) };
});
const legacy = legacyManifestSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-tests.generated.json', 'utf8')),
);
const execution = legacyExecutionSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-execution.json', 'utf8')),
);
const roots: string[] = [];
const gate = () => {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
};
const setup = async () => {
  const value = appFixture();
  roots.push(value.root);
  const directory = join(value.root, 'e2e', 'ledger');
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, 'legacy-tests.generated.json'),
    JSON.stringify(legacy),
  );
  writeFileSync(
    join(directory, 'legacy-execution.json'),
    JSON.stringify(execution),
  );
  const currentLegacy = legacyManifestSchema.parse({
    ...structuredClone(legacy),
    registered: structuredClone(legacy.registered).filter(
      (entry) => entry.profile === 'app',
    ),
    setups: [],
  });
  const discovery = {
    schemaVersion: 1 as const,
    profile: 'app',
    projects: [],
    tests: [],
    errors: [],
  };
  const events: string[] = [];
  const control = {
    failedProject: '',
    shouldWait: false,
    discoveryFailure: false,
    buildFailure: false,
    saveFailure: '',
    sourceChanged: false,
  };
  vi.mocked(captureLegacySources).mockReturnValue({
    root: value.root,
    files: [{ file: 'e2e/synthetic.spec.ts', sha256: 'a'.repeat(64) }],
  });
  vi.mocked(assertLegacySources).mockImplementation(() => {
    if (control.sourceChanged) throw new Error('source changed');
  });
  const started = gate();
  const pending = gate();
  const signals: AbortSignal[] = [];
  // 保存呼出とpayloadを観測する。writer自身のatomic renameは専用テストの責務。
  const written = new Map<string, string>();
  vi.mocked(writeArtifact).mockImplementation((_root, file, content) => {
    if (
      (control.saveFailure === 'initial' && file.endsWith('legacy-run.json')) ||
      (control.saveFailure === 'discovery' &&
        file.endsWith('legacy-run-discovery.json')) ||
      (control.saveFailure === 'final' &&
        file.endsWith('legacy-run.json') &&
        content.includes('\n  "status": "passed",'))
    )
      throw new Error('private-write-error');
    written.set(file, content);
  });
  vi.mocked(discover).mockImplementation(async () => {
    events.push('discover');
    if (control.discoveryFailure) throw new Error('private-discovery-error');
    return discovery;
  });
  vi.mocked(buildLegacy).mockImplementation(async (_root, reports) => {
    events.push('build');
    expect(reports).toEqual([discovery]);
    if (control.buildFailure) throw new Error('private-build-error');
    return currentLegacy;
  });
  vi.mocked(runLegacyProject, { partial: true }).mockImplementation(
    async (_root, input, signal, progress) => {
      events.push(`start:${input.project}`);
      signals.push(signal);
      progress?.({
        project: input.project,
        phase: 'fixture-cleanup',
        runId: `run-${signals.length}`,
      });
      if (control.shouldWait) {
        started.release();
        await pending.promise;
      }
      const dispositions = new Map(
        execution.entries.map((entry) => [entry.key, entry]),
      );
      const results: LegacyExecutionResult[] = [
        ...currentLegacy.tests,
        ...currentLegacy.registered,
      ]
        .filter(
          (entry) =>
            entry.project === input.project &&
            dispositions.get(entry.key)?.disposition !== 'deferred-live',
        )
        .map((entry) => {
          const destination = dispositions.get(entry.key);
          if (!destination) throw new Error('実行先がありません。');
          const shouldSkip =
            destination.disposition === 'existing-skip' ||
            destination.disposition === 'existing-fixme';
          return {
            key: entry.key,
            fingerprint: entry.fingerprint,
            ...(destination.disposition === 'replacement'
              ? { originFingerprint: destination.fingerprint }
              : {}),
            status: shouldSkip ? 'skipped' : 'passed',
            expectedStatus: shouldSkip ? 'skipped' : 'passed',
            annotations:
              'expectedAnnotation' in destination
                ? [destination.expectedAnnotation]
                : entry.annotations,
          };
        });
      events.push(`closed:${input.project}`);
      return {
        project: input.project,
        status: input.project === control.failedProject ? 'failed' : 'passed',
        results,
        runId: `run-${signals.length}`,
      };
    },
  );
  const receipt = (): unknown => {
    const content = written.get('test-results/quality/legacy-run.json');
    if (!content) throw new Error('receiptがありません。');
    return JSON.parse(content);
  };
  return {
    ...value,
    events,
    control,
    started,
    pending,
    currentLegacy,
    signals,
    receipt,
    hasReceipt: () => written.has('test-results/quality/legacy-run.json'),
  };
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyLegacyOrigins).mockResolvedValue(undefined);
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  vi.spyOn(process, 'once');
  for (const key of [
    'SCENARIO_E2E_RUN_ID',
    'SCENARIO_E2E_CREDENTIALS',
    'SCENARIO_E2E_LEGACY_CONTEXT',
    'SCENARIO_E2E_LEGACY_PROJECT',
  ])
    vi.stubEnv(key, undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-isolated-app-')))
      throw new Error('テスト所有外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('legacy実行CLIの引数', () => {
  it('引数なしは4project、--projectは単独診断を指定する', () => {
    expect(parseLegacyArguments([])).toEqual(legacyProjectSchema.options);
    expect(parseLegacyArguments(['--project', 'chromium-auth'])).toEqual([
      'chromium-auth',
    ]);
  });
  it.each(
    [
      ['--project'],
      ['--project', 'unknown'],
      ['--all'],
      ['--project', 'chromium', '--project', 'mobile-chrome'],
    ].map((args) => ({ args })),
  )('不正引数$argsを拒否する', ({ args }) => {
    expect(() => parseLegacyArguments(args)).toThrow();
  });
});

describe('legacy実行の集約と中断', () => {
  it('origin証明の失敗を保存し、列挙やprojectを起動しない', async () => {
    const value = await setup();
    vi.mocked(verifyLegacyOrigins).mockRejectedValue(
      new Error('private-origin-error'),
    );
    const result = await runLegacy(value.root);
    expect(result.status).toBe('failed');
    expect(verifyLegacyOrigins).toHaveBeenCalledWith(value.root, execution);
    expect(discover).not.toHaveBeenCalled();
    expect(runLegacyProject).not.toHaveBeenCalled();
    expect(aggregateLegacyResults).not.toHaveBeenCalled();
    expect(value.receipt()).toMatchObject({
      status: 'failed',
      phase: 'origin-proof',
    });
    expect(JSON.stringify(value.receipt())).not.toContain(
      'private-origin-error',
    );
  });
  it('guard列挙と全348登録を照合してから4projectを順に実行し330件を集約する', async () => {
    const value = await setup();
    const verification = vi.fn((project: string) => ({
      context: { ...verificationFixture().report.context, stageId: project },
      signal: new AbortController().signal,
      checkpoint: async () => {},
      onExit: () => {},
    }));
    const result = await runLegacy(value.root, [], verification);
    expect(verification.mock.calls.flat()).toEqual(legacyProjectSchema.options);
    expect(
      vi.mocked(runLegacyProject).mock.calls.map((call) => call[4]),
    ).toEqual(verification.mock.results.map(({ value }) => value));
    expect(result.status).toBe('passed');
    expect(result.results).toHaveLength(330);
    expect(result.projects.map((project) => project.runId)).toEqual([
      'run-1',
      'run-2',
      'run-3',
      'run-4',
    ]);
    expect(value.events).toEqual([
      'discover',
      'build',
      ...legacyProjectSchema.options.flatMap((project) => [
        `start:${project}`,
        `closed:${project}`,
      ]),
    ]);
    expect(discover).toHaveBeenCalledWith({
      root: value.root,
      profile: 'app',
      config: 'playwright.legacy-local.config.ts',
      setupProjects: [],
    });
    expect(validateLegacyDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({ currentLegacy: value.currentLegacy }),
    );
    expect(
      vi
        .mocked(createLegacySelection)
        .mock.calls.slice(0, 4)
        .map(([input]) => input.project),
    ).toEqual(legacyProjectSchema.options);
    expect(aggregateLegacyResults).toHaveBeenCalledOnce();
    expect(value.receipt()).toMatchObject({
      status: 'passed',
      requestedProjects: legacyProjectSchema.options,
    });
  });

  it('project終了後の旧spec変更検知をfailedにし、次projectを起動しない', async () => {
    const value = await setup();
    const operation = vi
      .mocked(runLegacyProject, { partial: true })
      .getMockImplementation();
    if (!operation) throw new Error('project mockがありません。');
    vi.mocked(runLegacyProject, { partial: true }).mockImplementation(
      async (...args) => {
        const result = await operation(...args);
        value.control.sourceChanged = true;
        return result;
      },
    );
    const result = await runLegacy(value.root);
    expect(result.status).toBe('failed');
    expect(captureLegacySources).toHaveBeenCalledWith(value.root, legacy);
    expect(runLegacyProject).toHaveBeenCalledOnce();
    expect(aggregateLegacyResults).not.toHaveBeenCalled();
    expect(value.receipt()).toMatchObject({
      status: 'failed',
      phase: 'source-check',
      projects: [{ project: 'chromium', status: 'passed', runId: 'run-1' }],
    });
  });

  it('単独projectも全登録を先に照合しpartial-passedとして保存する', async () => {
    const value = await setup();
    const result = await runLegacy(value.root, ['--project', 'chromium-auth']);
    expect(result).toMatchObject({ status: 'partial-passed', results: null });
    expect(result.projects).toHaveLength(1);
    expect(
      vi
        .mocked(createLegacySelection)
        .mock.calls.slice(0, 4)
        .map(([input]) => input.project),
    ).toEqual(legacyProjectSchema.options);
    expect(aggregateLegacyResults).not.toHaveBeenCalled();
    expect(value.receipt()).toMatchObject({
      status: 'partial-passed',
      requestedProjects: ['chromium-auth'],
    });
  });

  it('project失敗時は完了した失敗証跡を保存し次projectを起動しない', async () => {
    const value = await setup();
    value.control.failedProject = 'chromium';
    const result = await runLegacy(value.root);
    expect(result.status).toBe('failed');
    expect(runLegacyProject).toHaveBeenCalledOnce();
    expect(result.projects).toHaveLength(1);
    expect(aggregateLegacyResults).not.toHaveBeenCalled();
    expect(value.receipt()).toMatchObject({
      status: 'failed',
      projects: [{ project: 'chromium', status: 'failed' }],
    });
  });

  it('SIGINT handlerは共有signalを中断しcleanup完了前に次projectへ進まない', async () => {
    const value = await setup();
    value.control.shouldWait = true;
    const beforeInt = process.listenerCount('SIGINT');
    const beforeTerm = process.listenerCount('SIGTERM');
    const running = runLegacy(value.root);
    await Promise.race([
      value.started.promise,
      running.then(() => {
        throw new Error('project開始前に実行が終了しました。');
      }),
    ]);
    try {
      const handler = vi
        .mocked(process.once)
        .mock.calls.find(([event]) => event === 'SIGINT')?.[1];
      if (!handler) throw new Error('中断handlerがありません。');
      handler();
      expect(value.signals[0]?.aborted).toBe(true);
      expect(value.events).not.toContain('closed:chromium');
      expect(runLegacyProject).toHaveBeenCalledOnce();
      expect(value.receipt()).toMatchObject({
        status: 'running',
        phase: 'fixture-cleanup',
      });
    } finally {
      value.pending.release();
    }
    const result = await running;
    expect(result.status).toBe('failed');
    expect(value.events.at(-1)).toBe('closed:chromium');
    expect(runLegacyProject).toHaveBeenCalledOnce();
    expect(value.signals[0]?.aborted).toBe(true);
    expect(process.listenerCount('SIGINT')).toBe(beforeInt);
    expect(process.listenerCount('SIGTERM')).toBe(beforeTerm);
  });

  it.each([
    'discover',
    'build',
    'fingerprint',
    'missing',
  ] as const)('現在列挙の%s失敗を旧fingerprintで成功扱いしない', async (fault) => {
    const value = await setup();
    if (fault === 'discover') value.control.discoveryFailure = true;
    if (fault === 'build') value.control.buildFailure = true;
    if (fault === 'fingerprint') {
      const first = value.currentLegacy.tests[0];
      if (!first) throw new Error('台帳が空です。');
      first.fingerprint = '0'.repeat(64);
    }
    if (fault === 'missing') value.currentLegacy.tests.pop();
    const result = await runLegacy(value.root);
    expect(result.status).toBe('failed');
    expect(runLegacyProject).not.toHaveBeenCalled();
    expect(aggregateLegacyResults).not.toHaveBeenCalled();
    expect(JSON.stringify(value.receipt()).includes('private-')).toBe(false);
  });

  it.each([
    'initial',
    'discovery',
    'final',
  ] as const)('%sの証跡保存失敗から成功結果を返さない', async (phase) => {
    const value = await setup();
    value.control.saveFailure = phase;
    if (phase === 'discovery') {
      expect((await runLegacy(value.root)).status).toBe('failed');
      expect(runLegacyProject).not.toHaveBeenCalled();
    } else {
      await expect(runLegacy(value.root)).rejects.toThrow(
        'private-write-error',
      );
      if (phase === 'initial') expect(discover).not.toHaveBeenCalled();
    }
    if (value.hasReceipt())
      expect(value.receipt()).not.toMatchObject({ status: 'passed' });
  });

  it.each([
    'SCENARIO_E2E_RUN_ID',
    'SCENARIO_E2E_CREDENTIALS',
    'SCENARIO_E2E_LEGACY_CONTEXT',
    'SCENARIO_E2E_LEGACY_PROJECT',
  ])('既存runの%sを継承した起動を拒否する', async (key) => {
    const value = await setup();
    vi.stubEnv(key, 'existing-private-value');
    const result = await runLegacy(value.root);
    expect(result.status).toBe('failed');
    expect(discover).not.toHaveBeenCalled();
    expect(runLegacyProject).not.toHaveBeenCalled();
    expect(
      JSON.stringify(value.receipt()).includes('existing-private-value'),
    ).toBe(false);
  });
});

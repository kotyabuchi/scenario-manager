import { isNil } from 'ramda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupFixture } from '../../e2e/fixtures/fixtureCleanup';
import { createFixtureJournal } from '../../e2e/fixtures/fixtureManifest';
import { withLegacyContext } from '../../e2e/fixtures/legacyContext';
import { runLocalCommand } from './environmentCommands';
import { probeEnvironment } from './environmentProbe';
import {
  cleanupLegacyProjectRuns,
  setupLegacyProjectRun as setup,
} from './fixtures/environment/legacyProjectRun';
import { runLegacyProject } from './legacyProjectRun';

import { existsSync } from 'node:fs';

vi.mock('../../e2e/fixtures/fixtureCleanup', () => ({
  cleanupFixture: vi.fn(),
}));
vi.mock('../../e2e/fixtures/fixtureManifest', async (original) => ({
  ...(await original<typeof import('../../e2e/fixtures/fixtureManifest')>()),
  createFixtureJournal: vi.fn(),
}));
vi.mock('../../e2e/fixtures/legacyContext', () => ({
  withLegacyContext: vi.fn(),
}));
vi.mock('../../e2e/fixtures/legacySeed', () => ({
  prepareLegacySeed: vi.fn(),
}));
vi.mock('../../e2e/fixtures/legacySessionCleanup', () => ({
  cleanupLegacySessions: vi.fn(),
}));
vi.mock('./playwrightSourceMaps', () => ({
  playwrightSourceMapOptions: vi.fn(async () => ({
    args: ['--enable-source-maps'],
    env: { E2E_DISCOVERY_PLAYWRIGHT_PACKAGE: 'mock-playwright' },
  })),
}));
vi.mock('./environmentCommands', () => ({
  runLocalCommand: vi.fn(),
  localCommandEnvironment: vi.fn(() => ({})),
}));
vi.mock('./environmentCredentials', async (original) => ({
  ...(await original<typeof import('./environmentCredentials')>()),
  readEnvironmentCredentials: vi.fn(),
  writeEnvironmentCredentials: vi.fn(),
}));
vi.mock('./environmentProbe', () => ({ probeEnvironment: vi.fn() }));
vi.mock('./isolatedApp', () => ({ APP_PORT: 23100, withIsolatedApp: vi.fn() }));
vi.mock('./legacyResults', () => ({ parseLegacyProjectResults: vi.fn() }));
vi.mock('./legacySelection', () => ({ createLegacySelection: vi.fn() }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanupLegacyProjectRuns);

describe('legacy projectの障害伝播と後始末', () => {
  it('外側AbortSignal単独の中断を伝え、実close前に後始末へ進まない', async () => {
    const value = await setup();
    const primary = new AbortController();
    const outer = new AbortController();
    let start = () => {};
    let close = () => {};
    const started = new Promise<void>((resolve) => {
      start = resolve;
    });
    const pending = new Promise<void>((resolve) => {
      close = resolve;
    });
    const original = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(original)) throw new Error('command mock不足');
    vi.mocked(runLocalCommand).mockImplementation(
      async (tool, args, options) => {
        if (tool !== 'node') return original(tool, args, options);
        start();
        await pending;
        options.onClose?.({ exitCode: null, signal: 'SIGTERM' });
        throw new Error('private-abort');
      },
    );
    const context = {
      verificationId: '123456abcdef',
      stageId: 'legacy',
      selectionDigest: 'a'.repeat(64),
      inputDigest: 'b'.repeat(64),
    };
    const onExit = vi.fn();
    const running = runLegacyProject(
      value.root,
      value.input,
      primary.signal,
      undefined,
      { context, signal: outer.signal, checkpoint: async () => {}, onExit },
    );
    try {
      await started;
      const signal = vi.mocked(probeEnvironment).mock.calls[0]?.[1];
      expect(signal?.aborted).toBe(false);
      outer.abort();
      expect(signal?.aborted).toBe(true);
      expect(primary.signal.aborted).toBe(false);
      expect(onExit).not.toHaveBeenCalled();
      expect(existsSync(value.credentials)).toBe(true);
      expect(value.events).not.toContain('app-close');
    } finally {
      close();
    }
    expect((await running).status).toBe('failed');
    expect(onExit).toHaveBeenCalledExactlyOnceWith({
      exitCode: null,
      signal: 'SIGTERM',
    });
    expect(existsSync(value.credentials)).toBe(false);
    expect(value.events.at(-1)).toBe('environment-close');
  });
  it.each([
    'none',
    'before-tests',
    'after-tests',
    'after-cleanup',
    'runner',
  ])('verification %sも実closeと全cleanup後のfailedを保持する', async (fault) => {
    const value = await setup();
    value.control.browserFailure = fault === 'runner';
    const command = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(command)) throw new Error('command mock不足');
    vi.mocked(runLocalCommand).mockImplementation(
      async (tool, args, options) => {
        try {
          return await command(tool, args, options);
        } finally {
          if (tool === 'node') {
            value.events.push('runner-close');
            options.onClose?.({
              exitCode: value.control.browserFailure ? 7 : 0,
              signal: null,
            });
          }
        }
      },
    );
    const signal = new AbortController().signal;
    const context = {
      verificationId: '123456abcdef',
      stageId: 'legacy',
      selectionDigest: 'a'.repeat(64),
      inputDigest: 'b'.repeat(64),
    };
    const onExit = vi.fn(() => {
      expect(existsSync(value.credentials)).toBe(true);
      expect(value.events).not.toContain('app-close');
    });
    const checkpoint = vi.fn(async (phase: string) => {
      if (phase === 'after-tests')
        expect(value.events.at(-1)).toBe('runner-close');
      if (phase === 'after-cleanup') {
        expect(value.events.at(-1)).toBe('environment-close');
        expect(existsSync(value.credentials)).toBe(false);
      }
      if (phase === fault) throw new Error('private-input-changed');
    });
    const output = await runLegacyProject(
      value.root,
      value.input,
      signal,
      undefined,
      { context, signal, checkpoint, onExit },
    );
    expect(output.status).toBe(fault === 'none' ? 'passed' : 'failed');
    expect(value.events.slice(-5)).toEqual([
      'app-close',
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(existsSync(value.credentials)).toBe(false);
    const runner = vi
      .mocked(runLocalCommand)
      .mock.calls.find(([tool]) => tool === 'node');
    if (fault === 'before-tests') {
      expect(runner).toBeUndefined();
      expect(onExit).not.toHaveBeenCalled();
    } else {
      expect(runner?.[1][0]).toBe('--enable-source-maps');
      expect(runner?.[2].env).toMatchObject({
        SCENARIO_E2E_VERIFICATION_ID: context.verificationId,
        SCENARIO_E2E_STAGE_ID: context.stageId,
        SCENARIO_E2E_SELECTION_DIGEST: context.selectionDigest,
        SCENARIO_E2E_INPUT_DIGEST: context.inputDigest,
        E2E_DISCOVERY_PLAYWRIGHT_PACKAGE: 'mock-playwright',
      });
      expect(onExit).toHaveBeenCalledExactlyOnceWith({
        exitCode: fault === 'runner' ? 7 : 0,
        signal: null,
      });
    }
  });
  it('app終了→UI行→context/state→seed→credentials→環境の順序で片付けて成功する', async () => {
    const value = await setup();
    const signal = new AbortController().signal;
    const output = await runLegacyProject(value.root, value.input, signal);
    expect(output.status).toBe('passed');
    expect(output.results).toEqual(value.results);
    expect(value.events).toEqual([
      'environment-open',
      'credentials',
      'journal',
      'seed',
      'context-open',
      'app-open',
      'browser',
      'results',
      'app-close',
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(probeEnvironment).toHaveBeenCalledWith(
      value.root,
      signal,
      expect.any(Function),
      expect.any(Function),
      [23100],
    );
    expect(existsSync(value.credentials)).toBe(false);
    expect(JSON.stringify(output).includes('private-credentials')).toBe(false);
  });

  it.each([
    ['starting', 'start'],
    ['inspecting', 'verify'],
  ] as const)('%sの環境失敗を後続cleanup進捗で上書きしない', async (phase, failurePhase) => {
    const value = await setup();
    const probe = vi.mocked(probeEnvironment).getMockImplementation();
    if (isNil(probe)) throw new Error('環境fixtureがありません。');
    vi.mocked(probeEnvironment).mockImplementationOnce(
      async (root, signal, progress) => {
        progress?.({ phase });
        const report = await probe(root, signal, (value) => {
          if (value.phase === 'cleanup') progress?.(value);
        });
        return { ...report, passed: false, failurePhase };
      },
    );

    const onProgress = vi.fn();
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
      onProgress,
    );
    expect(output).toMatchObject({
      status: 'failed',
      phase: 'cleanup',
      failurePhases: [failurePhase],
    });
    expect(onProgress.mock.calls.map(([value]) => value.phase)).toEqual([
      phase,
      'cleanup',
    ]);
    expect(value.events).toEqual(['environment-open', 'environment-close']);
    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('seed途中で失敗しても親が保持するjournalをcleanupする', async () => {
    const value = await setup();
    value.control.seedFailure = true;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output).toMatchObject({
      status: 'failed',
      results: null,
      actor: null,
      failurePhases: ['seed'],
    });
    expect(cleanupFixture).toHaveBeenCalledWith(
      value.connection,
      value.journal,
    );
    expect(withLegacyContext).not.toHaveBeenCalled();
    expect(value.events.slice(-2)).toEqual([
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(existsSync(value.credentials)).toBe(false);
  });

  it.each([
    'browser',
    'missing',
    'malformed',
    'invalid',
  ] as const)('%sでもworker/appを待って両cleanupと秘密削除を完了する', async (fault) => {
    const value = await setup();
    if (fault === 'browser') value.control.browserFailure = true;
    else value.control.report = fault;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(output.failurePhases).toEqual([
      fault === 'browser' ? 'browser' : 'evidence',
    ]);
    expect(output.results).toEqual(fault === 'browser' ? value.results : null);
    expect(value.events.slice(-5)).toEqual([
      'app-close',
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(existsSync(value.credentials)).toBe(false);
    expect(JSON.stringify(output).includes('private-')).toBe(false);
  });

  it('ブラウザ、証跡、UI cleanupがすべて失敗した段階を順に残す', async () => {
    const value = await setup();
    value.control.browserFailure = true;
    value.control.report = 'missing';
    value.control.uiFailure = true;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output).toMatchObject({
      status: 'failed',
      results: null,
      failurePhases: ['browser', 'evidence', 'ui-cleanup'],
    });
    expect(value.events.slice(-5)).toEqual([
      'app-close',
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(existsSync(value.credentials)).toBe(false);
  });

  it('build失敗でもapp終了後のUI cleanupとseed cleanupを省略しない', async () => {
    const value = await setup();
    value.control.appFailure = true;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(output.failurePhases).toContain('build');
    expect(value.events.slice(-5)).toEqual([
      'app-close',
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it.each([
    'ui',
    'fixture-throw',
    'fixture-incomplete',
  ] as const)('%s cleanup失敗を成功へ変えず後続cleanupを続行する', async (fault) => {
    const value = await setup();
    if (fault === 'ui') value.control.uiFailure = true;
    else
      value.control.cleanup =
        fault === 'fixture-throw' ? 'throw' : 'incomplete';
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(output.environment.passed).toBe(false);
    expect(output.failurePhases).toEqual([
      fault === 'ui' ? 'ui-cleanup' : 'fixture-cleanup',
    ]);
    expect(value.events.slice(-4)).toEqual([
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
    expect(existsSync(value.credentials)).toBe(false);
  });

  it('実contextと同じAggregateError包装でも記録済み失敗を重複しない', async () => {
    const value = await setup();
    value.control.report = 'invalid';
    const operation = vi.mocked(withLegacyContext).getMockImplementation();
    if (!operation) throw new Error('context mockがありません。');
    vi.mocked(withLegacyContext).mockImplementation(async (...args) => {
      try {
        return await operation(...args);
      } catch (error) {
        throw new AggregateError([error], 'context wrapper');
      }
    });
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.failurePhases).toEqual(['evidence']);
    expect(output.status).toBe('failed');
  });

  it('evidenceとUI cleanupの両方の失敗を一度ずつ記録する', async () => {
    const value = await setup();
    value.control.report = 'invalid';
    value.control.uiFailure = true;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(output.failurePhases).toEqual(['evidence', 'ui-cleanup']);
  });

  it.each([
    'start',
    'close',
  ] as const)('contextの%sで発生した別の失敗を省略しない', async (phase) => {
    const value = await setup();
    const operation = vi.mocked(withLegacyContext).getMockImplementation();
    if (!operation) throw new Error('context mockがありません。');
    if (phase === 'close') value.control.report = 'invalid';
    vi.mocked(withLegacyContext).mockImplementation(async (...args) => {
      if (phase === 'close') {
        // context後始末が、既知のoperation失敗とは別のerrorを返すケース。
        const operationError = await operation(...args).catch(
          (error: unknown) => error,
        );
        throw new AggregateError(
          [operationError, new Error('private-context-error')],
          'context cleanup',
        );
      }
      throw new Error('private-context-error');
    });
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(output.failurePhases).toEqual(
      phase === 'start' ? ['seed'] : ['evidence', 'ui-cleanup'],
    );
    expect(value.events).toContain('fixture-cleanup');
    expect(existsSync(value.credentials)).toBe(false);
  });

  it('seed cleanupの完了前にcredentialsや所有環境を破棄しない', async () => {
    const value = await setup();
    value.waitForCleanup();
    const running = runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    await value.cleanupStarted.promise;
    try {
      expect(existsSync(value.credentials)).toBe(true);
      expect(value.events).not.toContain('environment-close');
    } finally {
      value.cleanupPending.release();
    }
    expect((await running).status).toBe('passed');
    expect(existsSync(value.credentials)).toBe(false);
  });

  it('進捗表示がthrowしても実行と全cleanupを続ける', async () => {
    const value = await setup();
    const progress = vi.fn(() => {
      throw new Error('private-progress-error');
    });
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
      progress,
    );
    expect(output.status).toBe('passed');
    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'ui-cleanup',
        project: 'chromium-auth',
      }),
    );
    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'fixture-cleanup' }),
    );
    expect(existsSync(value.credentials)).toBe(false);
    expect(value.events.at(-1)).toBe('environment-close');
    expect(JSON.stringify(output).includes('private-progress-error')).toBe(
      false,
    );
  });

  it('credentials読取失敗でも作成済秘密fileを破棄する', async () => {
    const value = await setup();
    value.control.credentialsReadFailure = true;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(createFixtureJournal).not.toHaveBeenCalled();
    expect(cleanupFixture).not.toHaveBeenCalled();
    expect(existsSync(value.credentials)).toBe(false);
    expect(value.events.at(-1)).toBe('environment-close');
  });

  it('credentials削除失敗を失敗段階へ残し環境cleanupを完了する', async () => {
    const value = await setup();
    value.control.credentialsDeleteFailure = true;
    const output = await runLegacyProject(
      value.root,
      value.input,
      new AbortController().signal,
    );
    expect(output.status).toBe('failed');
    expect(output.failurePhases).toContain('credentials-cleanup');
    expect(value.events.at(-1)).toBe('environment-close');
    expect(existsSync(value.credentials)).toBe(true);
  });
});

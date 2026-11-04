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
vi.mock('./isolatedApp', () => ({ APP_PORT: 43100, withIsolatedApp: vi.fn() }));
vi.mock('./legacyResults', () => ({ parseLegacyProjectResults: vi.fn() }));
vi.mock('./legacySelection', () => ({ createLegacySelection: vi.fn() }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanupLegacyProjectRuns);

describe('legacy projectの障害伝播と後始末', () => {
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
      [43100],
    );
    expect(existsSync(value.credentials)).toBe(false);
    expect(JSON.stringify(output).includes('private-credentials')).toBe(false);
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
    expect(output.failurePhases).toContain('evidence');
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
    expect(value.events.slice(-4)).toEqual([
      'ui-cleanup',
      'context-close',
      'fixture-cleanup',
      'environment-close',
    ]);
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

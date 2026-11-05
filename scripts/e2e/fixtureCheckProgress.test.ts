import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import {
  readEnvironmentCredentials,
  writeEnvironmentCredentials,
} from './environmentCredentials';
import { probeEnvironment } from './environmentProbe';
import { runFixtureCheck } from './fixtureCheck';
import { validateFixtureCheckEvidence } from './fixtureCheckEvidence';
import { appFixture } from './fixtures/isolatedApp';
import { withIsolatedApp } from './isolatedApp';

import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('./environmentCommands', () => ({
  runLocalCommand: vi.fn(),
  localCommandEnvironment: vi.fn(() => ({})),
}));
vi.mock('./environmentCredentials', () => ({
  readEnvironmentCredentials: vi.fn(),
  writeEnvironmentCredentials: vi.fn(),
}));
vi.mock('./environmentProbe', () => ({ probeEnvironment: vi.fn() }));
vi.mock('./isolatedApp', () => ({ APP_PORT: 43100, withIsolatedApp: vi.fn() }));
vi.mock('./fixtureCheckEvidence', () => ({
  validateFixtureCheckEvidence: vi.fn(),
}));

const roots: string[] = [];
const gate = () => {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
};
const setup = () => {
  const fixture = appFixture();
  roots.push(fixture.root);
  const { manifest } = fixture.connection;
  const file = join(fixture.workdir, 'connection.private.json');
  writeFileSync(
    join(fixture.workdir, 'runtime.json'),
    '{"dockerHost":"unix:///local.sock"}',
  );
  mkdirSync(join(fixture.workdir, 'fixtures'));
  const packageRoot = join(fixture.root, 'node_modules', '@playwright', 'test');
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(
    join(packageRoot, 'package.json'),
    '{"exports":{"./cli":"./cli.js"}}',
  );
  writeFileSync(join(packageRoot, 'cli.js'), '// 実行しないmock用module');
  const playwrightRoot = join(fixture.root, 'node_modules', 'playwright');
  mkdirSync(playwrightRoot);
  writeFileSync(
    join(playwrightRoot, 'package.json'),
    '{"name":"playwright","version":"1.57.0"}',
  );
  const receipt = (): unknown =>
    JSON.parse(
      readFileSync(
        join(fixture.root, 'test-results', 'quality', 'fixture-check.json'),
        'utf8',
      ),
    );
  const started = { build: gate(), readiness: gate(), browser: gate() };
  const pending = { build: gate(), readiness: gate(), browser: gate() };
  const releaseAll = () =>
    Object.values(pending).forEach((value) => {
      value.release();
    });
  const state = {
    hasAppClosed: false,
    hasEnvironmentClosed: false,
    shouldFailBrowser: false,
    shouldWriteReport: true,
    shouldFailCredentials: false,
  };
  const counts = {
    tests: 4,
    passed: 4,
    projects: 2,
    workers: 4,
    journals: 4,
    authUsers: 16,
    appUsers: 16,
    sessions: 4,
  };
  vi.mocked(readEnvironmentCredentials).mockReturnValue(fixture.connection);
  vi.mocked(writeEnvironmentCredentials).mockImplementation(() => {
    writeFileSync(file, 'private-key', { flag: 'wx' });
    return file;
  });
  vi.mocked(validateFixtureCheckEvidence).mockImplementation(() => {
    expect(receipt()).toMatchObject({ status: 'running', phase: 'evidence' });
    return { issues: [], counts };
  });
  vi.mocked(runLocalCommand).mockImplementation(async (tool, args, options) => {
    if (tool === 'supabase') {
      expect(receipt()).toMatchObject({
        status: 'running',
        phase: 'credentials',
      });
      if (state.shouldFailCredentials)
        throw new Error('private-credentials-error');
      return '{}';
    }
    expect(receipt()).toMatchObject({ status: 'running', phase: 'browser' });
    expect(args.slice(0, 2)).toEqual(['--enable-source-maps', '--require']);
    expect(args[2]).toMatch(/discoverySourceMaps\.cjs$/);
    expect(args.some((argument) => argument.includes('discoveryGuard'))).toBe(
      false,
    );
    expect(options.env?.E2E_DISCOVERY_PLAYWRIGHT_PACKAGE).toBe(
      realpathSync(join(playwrightRoot, 'package.json')),
    );
    started.browser.release();
    await pending.browser.promise;
    if (state.shouldWriteReport)
      writeFileSync(
        join(
          fixture.root,
          'test-results',
          'isolated',
          manifest.runId,
          'playwright.json',
        ),
        '{}',
      );
    if (state.shouldFailBrowser) throw new Error('private-browser-error');
    return '';
  });
  vi.mocked(withIsolatedApp).mockImplementation(
    async (_connection, signal, operation, progress) => {
      expect(receipt()).toMatchObject({ status: 'running', phase: 'app' });
      try {
        for (const phase of ['build', 'readiness'] as const) {
          await progress?.({ phase, runId: manifest.runId });
          started[phase].release();
          await pending[phase].promise;
        }
        await progress?.({ phase: 'operation', runId: manifest.runId });
        await operation({
          baseURL: 'http://127.0.0.1:43100',
          env: {
            NODE_ENV: 'production',
            NEXT_PUBLIC_SUPABASE_URL: manifest.apiUrl,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: fixture.connection.anonKey,
          },
          signal,
        });
      } finally {
        state.hasAppClosed = true;
      }
    },
  );
  vi.mocked(probeEnvironment).mockImplementation(
    async (_root, _signal, progress, operation) => {
      let passed = false;
      progress?.({ phase: 'checking-cli' });
      progress?.({
        phase: 'working',
        runId: manifest.runId,
        workdir: manifest.workdir,
      });
      try {
        await operation?.(manifest, new AbortController().signal);
        passed = true;
      } catch {
        // 実probeと同様、operationの失敗後もcleanupを完了して診断を返す。
      } finally {
        state.hasEnvironmentClosed = true;
        progress?.({
          phase: 'cleanup',
          runId: manifest.runId,
          workdir: manifest.workdir,
        });
      }
      return {
        runId: manifest.runId,
        workdir: manifest.workdir,
        cliVersion: manifest.cliVersion,
        inputHashes: manifest.inputHashes,
        migrationReplayPassed: true,
        schemaParityPassed: true,
        catalogStatus: 'verified',
        authorizationStatus: 'not-verified',
        fingerprint: 'a'.repeat(64),
        catalogIssues: [],
        knownAuthorizationGaps: [],
        passed,
        cleanup: null,
      };
    },
  );
  return { ...fixture, file, receipt, started, pending, releaseAll, state };
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-isolated-app-')))
      throw new Error('テスト一時領域以外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('fixture受入の実行中receiptとCLI進捗', () => {
  it('build/readiness/browserを待機中でも現在段階をreceiptとstderrから確認できる', async () => {
    const value = setup();
    const running = runFixtureCheck(value.root);
    try {
      for (const phase of ['build', 'readiness', 'browser'] as const) {
        await value.started[phase].promise;
        expect(value.receipt()).toMatchObject({
          status: 'running',
          phase,
          appProgress: {
            phase: phase === 'browser' ? 'operation' : phase,
            runId: value.connection.manifest.runId,
          },
          environmentProgress: {
            phase: 'working',
            runId: value.connection.manifest.runId,
          },
        });
        expect(process.stderr.write).toHaveBeenCalledWith(
          `[fixture-check] ${JSON.stringify({ phase, runId: value.connection.manifest.runId })}\n`,
        );
        expect(value.state.hasEnvironmentClosed).toBe(false);
        value.pending[phase].release();
      }
    } finally {
      value.releaseAll();
    }
    expect(await running).toMatchObject({
      status: 'passed',
      phase: 'complete',
    });
    expect(value.state.hasAppClosed && value.state.hasEnvironmentClosed).toBe(
      true,
    );
    expect(existsSync(value.file)).toBe(false);
    expect(value.receipt()).toMatchObject({
      environmentProgress: { phase: 'cleanup' },
    });
    expect(
      vi.mocked(process.stderr.write).mock.calls.flat().join(''),
    ).not.toContain('private-key');
  });

  it('stderrがthrowしてもreceipt更新・app終了・秘密file削除・環境cleanupを継続する', async () => {
    const value = setup();
    value.releaseAll();
    vi.mocked(process.stderr.write).mockImplementation(() => {
      throw new Error('private-display-error');
    });
    expect(await runFixtureCheck(value.root)).toMatchObject({
      status: 'passed',
    });
    expect(value.state.hasAppClosed && value.state.hasEnvironmentClosed).toBe(
      true,
    );
    expect(existsSync(value.file)).toBe(false);
    expect(JSON.stringify(value.receipt())).not.toContain(
      'private-display-error',
    );
  });

  it.each([
    true,
    false,
  ])('browser失敗後もevidence段階と最新cleanup進捗を残す: report=%s', async (shouldWriteReport) => {
    const value = setup();
    value.state.shouldFailBrowser = true;
    value.state.shouldWriteReport = shouldWriteReport;
    value.releaseAll();
    expect(await runFixtureCheck(value.root)).toMatchObject({
      status: 'failed',
      phase: 'evidence',
    });
    expect(value.receipt()).toMatchObject({
      status: 'failed',
      phase: 'evidence',
      environmentProgress: { phase: 'cleanup' },
    });
    expect(value.state.hasAppClosed && value.state.hasEnvironmentClosed).toBe(
      true,
    );
    expect(existsSync(value.file)).toBe(false);
    expect(JSON.stringify(value.receipt())).not.toContain(
      'private-browser-error',
    );
  });

  it('credentials失敗はappへ進む前の段階として保存する', async () => {
    const value = setup();
    value.state.shouldFailCredentials = true;
    expect(await runFixtureCheck(value.root)).toMatchObject({
      status: 'failed',
      phase: 'credentials',
    });
    expect(withIsolatedApp).not.toHaveBeenCalled();
    expect(value.state.hasEnvironmentClosed).toBe(true);
    expect(JSON.stringify(value.receipt())).not.toContain(
      'private-credentials-error',
    );
  });
});

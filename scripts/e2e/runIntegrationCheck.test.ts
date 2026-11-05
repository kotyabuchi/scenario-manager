import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import {
  readEnvironmentCredentials,
  writeEnvironmentCredentials,
} from './environmentCredentials';
import { probeEnvironment } from './environmentProbe';
import { validateIntegrationEvidence } from './evidence/vitest';
import { appFixture } from './fixtures/isolatedApp';
import {
  INTEGRATION_RECEIPT,
  runIntegrationEnvironment,
} from './runIntegrationCheck';

import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

vi.mock('./environmentCommands', () => ({
  runLocalCommand: vi.fn(),
  localCommandEnvironment: vi.fn(() => ({})),
}));
vi.mock('./environmentCredentials', () => ({
  readEnvironmentCredentials: vi.fn(),
  writeEnvironmentCredentials: vi.fn(),
}));
vi.mock('./environmentProbe', () => ({ probeEnvironment: vi.fn() }));
vi.mock('./evidence/vitest', () => ({ validateIntegrationEvidence: vi.fn() }));

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
  const cliRoot = join(fixture.root, 'node_modules', 'vitest');
  mkdirSync(cliRoot);
  writeFileSync(
    join(cliRoot, 'package.json'),
    '{"exports":{"./vitest.mjs":"./vitest.mjs"}}',
  );
  writeFileSync(join(cliRoot, 'vitest.mjs'), '// mock用であり実行しない');
  const receipt = (): unknown =>
    JSON.parse(readFileSync(join(fixture.root, INTEGRATION_RECEIPT), 'utf8'));
  const started = gate();
  const pending = gate();
  const state = {
    failRunner: false,
    failCleanup: false,
    failCredentials: false,
    writeReport: true,
    evidenceIssue: false,
    runnerClosed: false,
    cleanupSawClosed: false,
  };
  vi.mocked(readEnvironmentCredentials).mockReturnValue(fixture.connection);
  vi.mocked(writeEnvironmentCredentials).mockImplementation(() => {
    writeFileSync(file, 'private-sentinel', { flag: 'wx' });
    return file;
  });
  vi.mocked(validateIntegrationEvidence).mockImplementation(() => ({
    issues: state.evidenceIssue
      ? [{ code: 'CASE_MISSING', subject: 'fixture' }]
      : [],
    counts: { expected: 0, tests: 0, passed: 0, journals: 0 },
  }));
  vi.mocked(runLocalCommand).mockImplementation(async (tool, args, options) => {
    if (tool === 'supabase') {
      if (state.failCredentials) throw new Error('private-status-sentinel');
      return '{}';
    }
    expect(tool).toBe('node');
    expect(args.slice(1)).toEqual([
      'run',
      '--config',
      'vitest.integration.verified.config.ts',
    ]);
    expect(options.env).toEqual({
      SCENARIO_E2E_RUN_ID: manifest.runId,
      SCENARIO_E2E_CREDENTIALS: file,
    });
    expect(receipt()).toMatchObject({ status: 'running', phase: 'tests' });
    started.release();
    await pending.promise;
    if (state.writeReport)
      writeFileSync(
        join(
          fixture.root,
          'test-results',
          'integration',
          manifest.runId,
          'vitest.json',
        ),
        '{}',
      );
    state.runnerClosed = true;
    if (state.failRunner) throw new Error('private-runner-sentinel');
    return '';
  });
  vi.mocked(probeEnvironment).mockImplementation(
    async (_root, _signal, progress, operation, additionalPorts) => {
      expect(additionalPorts ?? []).toEqual([]);
      let passed = false;
      progress?.({
        phase: 'working',
        runId: manifest.runId,
        workdir: manifest.workdir,
      });
      try {
        await operation?.(manifest, new AbortController().signal);
        passed = true;
      } catch {
        /* 所有probeはoperation失敗もcleanup後に返す。 */
      } finally {
        state.cleanupSawClosed = state.runnerClosed;
        expect(existsSync(file)).toBe(false);
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
        passed: passed && !state.failCleanup,
        cleanup: null,
      };
    },
  );
  return { ...fixture, file, receipt, state, started, pending };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    const rel = relative(realpathSync(tmpdir()), realpathSync(root));
    if (rel.startsWith('..') || !rel.startsWith('e2e-isolated-app-'))
      throw new Error('cleanup root不正');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('integration専用環境の所有lifecycle', () => {
  it('worker終了までは秘密fileを保ち、証跡照合後に秘密fileとstackを片付ける', async () => {
    const fixture = setup();
    const running = runIntegrationEnvironment(fixture.root, []);
    try {
      await Promise.race([
        fixture.started.promise,
        running.then(() => {
          throw new Error('worker開始前に終了しました。');
        }),
      ]);
      expect(existsSync(fixture.file)).toBe(true);
      expect(fixture.receipt()).toMatchObject({
        status: 'running',
        phase: 'tests',
      });
      fixture.pending.release();
      expect(await running).toMatchObject({
        status: 'passed',
        phase: 'complete',
      });
      expect(fixture.state.cleanupSawClosed).toBe(true);
      expect(validateIntegrationEvidence).toHaveBeenCalledWith({
        expected: [],
        report: {},
        journals: [],
        lease: fixture.connection.lease,
      });
      expect(JSON.stringify(fixture.receipt())).not.toContain(
        'private-sentinel',
      );
    } finally {
      fixture.pending.release();
      await running;
    }
  });

  it.each([
    'runner',
    'report',
    'evidence',
    'cleanup',
    'credentials',
  ])('%sの失敗を成功へ丸めず、秘密と環境の後始末を待つ', async (fault) => {
    const fixture = setup();
    fixture.state.failRunner = fault === 'runner';
    fixture.state.writeReport = fault !== 'report';
    fixture.state.evidenceIssue = fault === 'evidence';
    fixture.state.failCleanup = fault === 'cleanup';
    fixture.state.failCredentials = fault === 'credentials';
    fixture.pending.release();
    expect(await runIntegrationEnvironment(fixture.root, [])).toMatchObject({
      status: 'failed',
    });
    expect(existsSync(fixture.file)).toBe(false);
    if (fault !== 'credentials')
      expect(fixture.state.cleanupSawClosed).toBe(true);
    expect(JSON.stringify(fixture.receipt())).not.toContain('private-');
    expect(fixture.receipt()).toMatchObject({
      environmentProgress: { phase: 'cleanup' },
    });
  });

  it('同run IDの出力directoryがあれば旧成功を読まず拒否する', async () => {
    const fixture = setup();
    mkdirSync(
      join(
        fixture.root,
        'test-results',
        'integration',
        fixture.connection.manifest.runId,
      ),
      { recursive: true },
    );
    fixture.pending.release();
    expect(await runIntegrationEnvironment(fixture.root, [])).toMatchObject({
      status: 'failed',
    });
    expect(
      vi.mocked(runLocalCommand).mock.calls.some(([tool]) => tool === 'node'),
    ).toBe(false);
    expect(validateIntegrationEvidence).not.toHaveBeenCalled();
    expect(existsSync(fixture.file)).toBe(false);
  });
});

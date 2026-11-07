import { expect, it, vi } from 'vitest';

import { runCiCli } from './ci';
import { planCiVerification } from './ciPlan';
import { recordStaticLedgerFailure } from './staticLedgerFailure';
import { createSurfaceReplayDiagnosticError } from './surfaceReplayFailure';

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

vi.mock('./ciPlan', () => ({ planCiVerification: vi.fn() }));

const entry = fileURLToPath(new URL('./ci.ts', import.meta.url));
const tsx = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const timingLines = (stderr: string) =>
  stderr
    .split('\n')
    .filter((line) => line.startsWith('[ci-timing] '))
    .map((line): unknown => JSON.parse(line.slice('[ci-timing] '.length)));

const removeOwnedRoot = (root: string, temp: string) => {
  if (dirname(realpathSync(root)) !== temp)
    throw new Error('CI CLI fixtureの削除先が不正です。');
  rmSync(root, { recursive: true, force: true });
};

const launchCi = (cwd: string, output: string, args: string[]) => {
  const env = { ...process.env };
  for (const name of Object.keys(env))
    if (/^(?:CI(?:$|_)|GITHUB_|NODE_OPTIONS$)/i.test(name))
      Reflect.deleteProperty(env, name);
  Object.assign(env, {
    GITHUB_ACTIONS: 'true',
    GITHUB_OUTPUT: output,
    GITHUB_RUN_ID: '123456',
    GITHUB_RUN_ATTEMPT: '2',
    E2E_LEDGER_BOOTSTRAP_APPROVAL: 'fixture-private-token',
  });
  return spawnSync(process.execPath, ['--import', tsx, entry, ...args], {
    cwd,
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15_000,
  });
};

it.each([
  { command: 'plan', args: ['plan'], job: 'plan' },
  { command: 'shard', args: ['shard', 'required'], job: 'required' },
  {
    command: 'desktop',
    args: ['shard', 'legacy-desktop'],
    job: 'legacy-desktop',
  },
  { command: 'mobile', args: ['shard', 'legacy-mobile'], job: 'legacy-mobile' },
  { command: '旧shard', args: ['shard', 'legacy-local'], job: null },
  { command: 'aggregate', args: ['aggregate'], job: 'aggregate' },
  { command: '不正引数', args: ['shard', 'unknown'], job: null },
])('$commandの実CLIが循環せず、CIイベントのない空cwdで失敗する', ({
  args,
  job,
}) => {
  const temp = realpathSync(tmpdir());
  const root = mkdtempSync(join(temp, 'e2e-ci-cli-'));
  try {
    const cwd = join(root, 'workspace');
    mkdirSync(cwd);
    const output = join(root, 'step-output');
    writeFileSync(output, '');
    const result = launchCi(cwd, output, args);
    expect(result.error).toBeUndefined();
    expect(result.stderr).not.toContain('unsettled top-level await');
    expect(result.status, result.stderr).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({
      schemaVersion: 1,
      status: 'failed',
      job,
      workflow: { runId: '123456', attempt: 2 },
    });
    expect(result.stdout).not.toContain('fixture-private-token');
    expect(result.stderr).not.toContain('fixture-private-token');
    if (job === 'plan') {
      expect(timingLines(result.stderr)).toEqual([
        { availableParallelism: expect.any(Number) },
        { phase: 'context', elapsedMs: expect.any(Number) },
      ]);
    } else {
      expect(timingLines(result.stderr)).toEqual([]);
    }
    if (job) {
      const folder = join(cwd, 'test-results', 'ci', job);
      expect(
        JSON.parse(readFileSync(join(folder, 'failure.json'), 'utf8')),
      ).toEqual(report);
      expect(existsSync(join(folder, 'receipt.json'))).toBe(false);
      expect(existsSync(join(folder, 'manifest.json'))).toBe(false);
      expect(readFileSync(output, 'utf8')).toBe('diagnostic_written=true\n');
    } else {
      expect(report).toMatchObject({
        code: 'CI_ARGUMENTS_INVALID',
        phase: 'arguments',
      });
      expect(existsSync(join(cwd, 'test-results'))).toBe(false);
      expect(readFileSync(output, 'utf8')).toBe('');
    }
  } finally {
    removeOwnedRoot(root, temp);
  }
}, 20_000);

it('実CLIは既存failureを上書きせず今回の安全な診断をstdoutに返す', () => {
  const temp = realpathSync(tmpdir());
  const root = mkdtempSync(join(temp, 'e2e-ci-cli-'));
  try {
    const cwd = join(root, 'workspace');
    const folder = join(cwd, 'test-results', 'ci', 'legacy-desktop');
    mkdirSync(folder, { recursive: true });
    const previous =
      '{"status":"failed","workflow":{"runId":"123456","attempt":1}}';
    const file = join(folder, 'failure.json');
    writeFileSync(file, previous);
    const output = join(root, 'step-output');
    writeFileSync(output, '');
    const result = launchCi(cwd, output, ['shard', 'legacy-desktop']);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      job: 'legacy-desktop',
      status: 'failed',
      phase: 'context',
      code: 'CI_CONTEXT_INVALID',
      workflow: { runId: '123456', attempt: 2 },
    });
    expect(readFileSync(file, 'utf8')).toBe(previous);
    expect(readFileSync(output, 'utf8')).toBe('');
  } finally {
    removeOwnedRoot(root, temp);
  }
}, 20_000);

it.each([
  true,
  false,
])('plannerの区間計測はActions実行時だけ許可済みの値をstderrへ出す: %s', async (githubActions) => {
  let now = 10;
  const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  const planned = {
    status: 'passed',
    phase: 'plan',
    workflow: { runId: '123456', attempt: 2 },
    head: 'a'.repeat(40),
  } as const;
  vi.mocked(planCiVerification).mockImplementationOnce(
    async (_root, _env, _signal, onProgress) => {
      onProgress?.({ phase: 'context' });
      now = 15;
      onProgress?.({ phase: 'inputs' });
      now = 20;
      onProgress?.({ phase: 'quality' });
      now = 22;
      onProgress?.({
        phase: 'quality',
        qualityCheck: 'typecheck',
        verificationId: '0'.repeat(12),
        issueCount: 7,
      });
      now = 40;
      onProgress?.({ phase: 'quality', qualityCheck: 'typecheck' });
      if (onProgress) {
        Reflect.apply(onProgress, undefined, [
          { phase: 'quality', qualityCheck: 'private-command' },
        ]);
        Reflect.apply(onProgress, undefined, [
          { phase: 'collection', unexpected: 'private-field' },
        ]);
      }
      now = 45;
      onProgress?.({ phase: 'quality', qualityCheck: 'test:e2e-tools' });
      now = 52;
      onProgress?.({ phase: 'artifacts' });
      now = 60;
      return planned;
    },
  );
  try {
    await expect(
      runCiCli(['plan'], process.cwd(), {
        ...process.env,
        GITHUB_ACTIONS: String(githubActions),
      }),
    ).resolves.toEqual(planned);
    const lines = timingLines(
      stderr.mock.calls.map(([line]) => String(line)).join(''),
    );
    expect(lines).toEqual(
      githubActions
        ? [
            { availableParallelism: availableParallelism() },
            { phase: 'context', elapsedMs: 5 },
            { phase: 'inputs', elapsedMs: 5 },
            { phase: 'quality', elapsedMs: 2 },
            { phase: 'quality', qualityCheck: 'typecheck', elapsedMs: 23 },
            { phase: 'quality', qualityCheck: 'test:e2e-tools', elapsedMs: 7 },
            { phase: 'artifacts', elapsedMs: 8 },
          ]
        : [],
    );
  } finally {
    stderr.mockRestore();
    clock.mockRestore();
  }
});

it.each([
  'typed',
  'unrecognized',
] as const)('静的検査から渡る%sな失敗をCIの公開証跡へ変換する', async (kind) => {
  const temp = realpathSync(tmpdir());
  const root = mkdtempSync(join(temp, 'e2e-ci-cli-'));
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  const diagnostic = {
    step: 'panda',
    processFailure: 'descendants-remained',
  } as const;
  const knownError = createSurfaceReplayDiagnosticError(diagnostic);
  knownError.message = 'private-replay-message';
  const unknownError = Object.assign(
    new Error('private-error', { cause: knownError }),
    { surfaceReplay: diagnostic },
  );
  const artifactPath = 'test-results/verification/fixture/static.json';
  vi.mocked(planCiVerification).mockImplementationOnce(
    async (cwd, _env, _signal, onProgress) => {
      onProgress?.({ phase: 'static-ledger' });
      throw recordStaticLedgerFailure({
        root: cwd,
        artifactPath,
        error: kind === 'typed' ? knownError : unknownError,
      });
    },
  );
  try {
    const output = join(root, 'step-output');
    writeFileSync(output, '');
    const report = await runCiCli(['plan'], root, {
      ...process.env,
      GITHUB_ACTIONS: 'true',
      GITHUB_OUTPUT: output,
      GITHUB_RUN_ID: '123456',
      GITHUB_RUN_ATTEMPT: '2',
    });
    expect(report).toMatchObject({
      phase: 'static-ledger',
      code: 'CI_STATIC_LEDGER_FAILED',
      workflow: { runId: '123456', attempt: 2 },
    });
    if (kind === 'typed')
      expect(report).toHaveProperty('surfaceReplay', diagnostic);
    else expect(report).not.toHaveProperty('surfaceReplay');
    expect(JSON.stringify(report)).not.toContain('private-');
    expect(
      JSON.parse(
        readFileSync(join(root, 'test-results/ci/plan/failure.json'), 'utf8'),
      ),
    ).toEqual(JSON.parse(JSON.stringify(report)));
    expect(JSON.parse(readFileSync(join(root, artifactPath), 'utf8'))).toEqual({
      status: 'failed',
      failure: 'STATIC_LEDGER_CHECK_FAILED',
    });
    const stderrLines = stderr.mock.calls.map(([line]) => String(line));
    expect(
      stderrLines.filter((line) => line.startsWith('[e2e-static] ')),
    ).toEqual([
      `[e2e-static] ${JSON.stringify({ failure: 'STATIC_LEDGER_CHECK_FAILED', artifactPath })}\n`,
    ]);
    expect(timingLines(stderrLines.join(''))).toEqual([
      { availableParallelism: expect.any(Number) },
      { phase: 'context', elapsedMs: expect.any(Number) },
      { phase: 'static-ledger', elapsedMs: expect.any(Number) },
    ]);
    expect(readFileSync(output, 'utf8')).toBe('diagnostic_written=true\n');
  } finally {
    stderr.mockRestore();
    removeOwnedRoot(root, temp);
  }
});

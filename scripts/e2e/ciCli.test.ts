import { expect, it } from 'vitest';

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
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const entry = fileURLToPath(new URL('./ci.ts', import.meta.url));
const tsx = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
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
    const folder = join(cwd, 'test-results', 'ci', 'legacy-local');
    mkdirSync(folder, { recursive: true });
    const previous =
      '{"status":"failed","workflow":{"runId":"123456","attempt":1}}';
    const file = join(folder, 'failure.json');
    writeFileSync(file, previous);
    const output = join(root, 'step-output');
    writeFileSync(output, '');
    const result = launchCi(cwd, output, ['shard', 'legacy-local']);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      job: 'legacy-local',
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

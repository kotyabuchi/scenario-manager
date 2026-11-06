import { expect, it } from 'vitest';

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const entry = fileURLToPath(new URL('./run.ts', import.meta.url));
const tsx = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

const removeOwnedRoot = (root: string, temp: string) => {
  if (dirname(realpathSync(root)) !== temp)
    throw new Error('CLI fixtureの一時rootが不正です。');
  rmSync(root, { recursive: true, force: true });
};

it.each([
  {
    mode: '差分',
    args: ['--changed', '--no-shadow'],
    receipt: 'selection',
    id: 'selectionId',
  },
  {
    mode: '全件',
    args: ['--all'],
    receipt: 'verification',
    id: 'verificationId',
  },
])('$mode CLIは実processで起動し、必須入力のないcwdで検査開始前に失敗する', ({
  args,
  receipt,
  id,
}) => {
  const temp = realpathSync(tmpdir());
  const root = mkdtempSync(join(temp, 'e2e-verify-cli-'));
  try {
    const env = { ...process.env };
    for (const name of Object.keys(env))
      if (['CI', 'NODE_OPTIONS'].includes(name.toUpperCase()))
        Reflect.deleteProperty(env, name);
    // 比較baseもcollector設定もないので、どちらの入口も外部processを起動しない。
    const output = spawnSync(
      process.execPath,
      ['--import', tsx, entry, ...args],
      {
        cwd: root,
        encoding: 'utf8',
        env,
        timeout: 15_000,
        windowsHide: true,
      },
    );
    expect(output.error).toBeUndefined();
    expect(output.stderr).not.toContain('unsettled top-level await');
    expect(output.status, output.stderr).toBe(1);
    expect(output.stdout, output.stderr).not.toBe('');
    const summary = JSON.parse(output.stdout);
    const saved = JSON.parse(
      readFileSync(
        join(root, 'test-results', 'quality', `${receipt}.json`),
        'utf8',
      ),
    );
    expect(summary).toMatchObject({
      status: 'failed',
      phase: 'preparation',
      [id]: expect.stringMatching(/^[a-f0-9]{12}$/u),
    });
    expect(saved).toMatchObject({
      status: 'failed',
      phase: 'preparation',
      [id]: summary[id],
    });
    expect(existsSync(join(root, 'test-results', 'discovery'))).toBe(false);
  } finally {
    removeOwnedRoot(root, temp);
  }
}, 20_000);

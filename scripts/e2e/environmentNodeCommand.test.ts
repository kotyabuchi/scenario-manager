import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 実processを起動したまま、親がstdoutを受信した時点を観測する。
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execFile: vi.fn(actual.execFile) };
});

let root = '';
beforeEach(async () => {
  vi.mocked(execFile).mockClear();
  root = await realpath(await mkdtemp(join(tmpdir(), 'sm-owned-node-')));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
const env = () =>
  localCommandEnvironment(
    process.env,
    process.platform === 'win32'
      ? 'npipe:////./pipe/docker_engine'
      : 'unix:///var/run/docker.sock',
  );

describe('所有するNodeプロセスの終了確認', () => {
  it('PATHのnode wrapperを探さず現在のnative Nodeで実行する', async () => {
    const output = await runLocalCommand(
      'node',
      ['-e', 'process.stdout.write(process.execPath)'],
      {
        cwd: root,
        env: { ...env(), PATH: '', Path: '' },
      },
    );
    expect(output).toBe(process.execPath);
  });

  it.each([
    false,
    true,
  ])('協調停止の許可を明示したserverだけ成功として終了する: %s', async (shouldAllowAbort) => {
    const ready = join(root, 'ready');
    const log = join(root, 'node.private.log');
    const controller = new AbortController();
    const child = runLocalCommand(
      'node',
      [
        '-e',
        "require('node:fs').writeFileSync(process.argv[1], String(process.pid)); process.stdout.write('ready'); setInterval(() => {}, 1000);",
        ready,
      ],
      {
        cwd: root,
        env: env(),
        signal: controller.signal,
        shouldAllowAbort,
        log,
      },
    );
    // rejectは直ちに監視し、signal発行前のspawn失敗も未処理にしない。
    const result = child.then(
      (value) => ({ value }),
      () => ({ value: null }),
    );
    try {
      const spawnedChild = vi.mocked(execFile).mock.results.at(-1)?.value;
      expect(spawnedChild).toBeDefined();
      let output = '';
      spawnedChild?.stdout?.on('data', (chunk: string | Buffer) => {
        output += chunk.toString();
      });
      // ready fileの存在はstdoutの受信を保証しない。親の受信後にだけ停止する。
      await expect.poll(() => output, { timeout: 3000 }).toBe('ready');
    } finally {
      controller.abort();
    }
    expect((await result).value).toBe(shouldAllowAbort ? 'ready' : null);
    expect(await readFile(log, 'utf8')).toContain('ready');
    const pid = Number(await readFile(ready, 'utf8'));
    expect(() => process.kill(pid, 0)).toThrow();
  });

  it('停止許可があってもlog保存失敗を成功へ変えない', async () => {
    const log = join(root, 'exists.private.log');
    await writeFile(log, 'preserve');
    await expect(
      runLocalCommand('node', ['-e', 'process.stdout.write("done")'], {
        cwd: root,
        env: env(),
        shouldAllowAbort: true,
        log,
      }),
    ).rejects.toThrow('nodeの実行に失敗');
    expect(await readFile(log, 'utf8')).toBe('preserve');
  });

  it('停止許可があっても非zero終了を成功へ変えない', async () => {
    await expect(
      runLocalCommand('node', ['-e', 'process.exitCode = 7'], {
        cwd: root,
        env: env(),
        shouldAllowAbort: true,
      }),
    ).rejects.toThrow('nodeの実行に失敗');
  });
});

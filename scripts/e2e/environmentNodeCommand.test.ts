import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';

import { existsSync } from 'node:fs';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

let root = '';
beforeEach(async () => {
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
      const deadline = Date.now() + 3000;
      while (!existsSync(ready) && Date.now() < deadline) await setTimeout(10);
      expect(existsSync(ready)).toBe(true);
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

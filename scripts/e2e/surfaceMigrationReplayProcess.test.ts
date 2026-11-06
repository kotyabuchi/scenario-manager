import { afterEach, expect, it, vi } from 'vitest';

import { runSurfaceReplayProcess } from './surfaceMigrationReplayProcess';

import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('node:child_process', async (original) => ({
  ...(await original<typeof import('node:child_process')>()),
  spawn: vi.fn(),
}));

const roots: string[] = [];
const PID = 12345;
const fixture = async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'srp-'));
  roots.push(cwd);
  const child = Object.assign(new EventEmitter(), {
    pid: PID,
    unref: vi.fn(),
  });
  return { cwd, child, log: join(cwd, 'command.private.log') };
};

afterEach(async () => {
  vi.restoreAllMocks();
  vi.mocked(spawn).mockReset();
  for (const root of roots.splice(0)) await rm(root, { recursive: true });
});

it('機械判定用の標準出力を別のfile descriptorへ渡す', async () => {
  const { cwd, child, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 0));
    return child as unknown as ReturnType<typeof spawn>;
  });
  vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'ESRCH' });
  });
  await runSurfaceReplayProcess('node', [], {
    cwd,
    log,
    stdoutFile: join(cwd, 'stdout.private.log'),
    env: process.env,
  });
  const stdio = vi.mocked(spawn).mock.calls[0]?.[2]?.stdio;
  expect(stdio).toEqual(['ignore', expect.any(Number), expect.any(Number)]);
  expect(stdio?.[1]).not.toBe(stdio?.[2]);
});

it('leaderのcloseだけでは成功にせず、残るprocess群を終了させる', async () => {
  const { cwd, child, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 0));
    return child as unknown as ReturnType<typeof spawn>;
  });
  let running = true;
  const kill = vi.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
    if (signal === 'SIGTERM') running = false;
    else if (!running) throw Object.assign(new Error(), { code: 'ESRCH' });
    return true;
  });
  await expect(
    runSurfaceReplayProcess('node', [], { cwd, log, env: process.env }),
  ).rejects.toThrow('子孫processが残っていました');
  expect(spawn).toHaveBeenCalledWith(
    'node',
    [],
    expect.objectContaining({ detached: true }),
  );
  expect(kill.mock.calls).toEqual([
    [-PID, 0],
    [-PID, 'SIGTERM'],
    [-PID, 0],
  ]);
});

it('中断時は所有process群の終了とleaderのcloseを待つ', async () => {
  const { cwd, child, log } = await fixture();
  const controller = new AbortController();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => controller.abort());
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
    if (signal === 'SIGTERM') {
      queueMicrotask(() => child.emit('close', null, signal));
      return true;
    }
    throw Object.assign(new Error(), { code: 'ESRCH' });
  });
  await expect(
    runSurfaceReplayProcess('node', [], {
      cwd,
      log,
      env: process.env,
      signal: controller.signal,
    }),
  ).rejects.toThrow('子processを中断しました');
  expect(kill.mock.calls).toEqual([
    [-PID, 'SIGTERM'],
    [-PID, 0],
  ]);
  expect(child.unref).toHaveBeenCalledOnce();
});

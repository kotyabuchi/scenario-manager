import { afterEach, expect, it, vi } from 'vitest';

import {
  runSurfaceReplayProcess,
  UnsettledSurfaceReplayProcess,
} from './surfaceMigrationReplayProcess';

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
  ).rejects.toMatchObject({ processFailure: 'descendants-remained' });
  expect(spawn).toHaveBeenCalledWith(
    'node',
    [],
    expect.objectContaining({ detached: true }),
  );
  const beforeStop = kill.mock.calls.findIndex(
    ([, signal]) => signal === 'SIGTERM',
  );
  expect(beforeStop).toBeGreaterThan(1);
  expect(
    kill.mock.calls
      .slice(0, beforeStop)
      .every(([pid, signal]) => pid === -PID && signal === 0),
  ).toBe(true);
  expect(kill.mock.calls.slice(beforeStop)).toEqual([
    [-PID, 'SIGTERM'],
    [-PID, 0],
  ]);
});

it('正常close後に子孫が自発終了すればシグナルを送らず成功する', async () => {
  const { cwd, child, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 0));
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'ESRCH' });
  });
  kill.mockReturnValueOnce(true);

  await runSurfaceReplayProcess('node', [], { cwd, log, env: process.env });
  expect(kill.mock.calls).toEqual([
    [-PID, 0],
    [-PID, 0],
  ]);
});

it.each([
  'abort',
  'timeout',
] as const)('自発終了待ちの%sは所有グループを停止して失敗する', async (cause) => {
  const { cwd, child, log } = await fixture();
  const controller = new AbortController();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 0));
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'ESRCH' });
  });
  kill.mockImplementationOnce(() => {
    queueMicrotask(() => {
      if (cause === 'abort') {
        controller.abort();
        vi.advanceTimersByTime(8 * 60_000);
      } else {
        vi.advanceTimersByTime(8 * 60_000);
        controller.abort();
      }
    });
    return true;
  });
  kill.mockReturnValueOnce(true);

  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    await expect(
      runSurfaceReplayProcess('node', [], {
        cwd,
        log,
        env: process.env,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({
      processFailure: cause === 'abort' ? 'aborted' : 'timeout',
    });
  } finally {
    vi.useRealTimers();
  }
  expect(kill.mock.calls).toEqual([
    [-PID, 0],
    [-PID, 'SIGTERM'],
    [-PID, 0],
  ]);
});

it.each([
  false,
  true,
])('異常終了は成功せず残るグループがあれば即停止する (残留=%s)', async (hasDescendants) => {
  const { cwd, child, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 1));
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'ESRCH' });
  });
  if (hasDescendants) kill.mockReturnValueOnce(true).mockReturnValueOnce(true);

  await expect(
    runSurfaceReplayProcess('node', [], { cwd, log, env: process.env }),
  ).rejects.toMatchObject({
    processFailure: hasDescendants ? 'descendants-remained' : 'exit-failed',
  });
  expect(kill.mock.calls).toEqual(
    hasDescendants
      ? [
          [-PID, 0],
          [-PID, 'SIGTERM'],
          [-PID, 0],
        ]
      : [[-PID, 0]],
  );
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
  ).rejects.toMatchObject({ processFailure: 'aborted' });
  expect(kill.mock.calls).toEqual([
    [-PID, 'SIGTERM'],
    [-PID, 0],
  ]);
  expect(child.unref).toHaveBeenCalledOnce();
});

it('spawn失敗はcloseが0でも成功にしない', async () => {
  const { cwd, child, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => {
      child.emit('error', new Error('spawn failed'));
      child.emit('close', 0);
    });
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'ESRCH' });
  });

  await expect(
    runSurfaceReplayProcess('node', [], { cwd, log, env: process.env }),
  ).rejects.toMatchObject({ processFailure: 'spawn-error' });
  expect(kill.mock.calls).toEqual([[-PID, 0]]);
});

it('spawnの同期例外を固定区分へ変え、生エラーを保持しない', async () => {
  const { cwd, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    throw new Error('private executable or argument');
  });

  await expect(
    runSurfaceReplayProcess('node', [], { cwd, log, env: process.env }),
  ).rejects.toMatchObject({ processFailure: 'spawn-error' });
});

it('グループの存在を確認できなければ終了未確認の型を保持する', async () => {
  const { cwd, child, log } = await fixture();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 0));
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'EPERM' });
  });

  await expect(
    runSurfaceReplayProcess('node', [], { cwd, log, env: process.env }),
  ).rejects.toBeInstanceOf(UnsettledSurfaceReplayProcess);
  expect(kill.mock.calls).toEqual([[-PID, 0]]);
});

it('中断しても停止を確認できない場合は終了未確認を優先する', async () => {
  const { cwd, child, log } = await fixture();
  const controller = new AbortController();
  vi.mocked(spawn).mockImplementation(() => {
    queueMicrotask(() => child.emit('close', 0));
    return child as unknown as ReturnType<typeof spawn>;
  });
  const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
    throw Object.assign(new Error(), { code: 'EPERM' });
  });
  kill.mockImplementationOnce(() => {
    queueMicrotask(() => controller.abort());
    return true;
  });

  await expect(
    runSurfaceReplayProcess('node', [], {
      cwd,
      log,
      env: process.env,
      signal: controller.signal,
    }),
  ).rejects.toBeInstanceOf(UnsettledSurfaceReplayProcess);
  expect(kill.mock.calls).toEqual([
    [-PID, 0],
    [-PID, 'SIGTERM'],
  ]);
});

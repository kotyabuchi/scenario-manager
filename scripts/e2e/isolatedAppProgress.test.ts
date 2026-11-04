import { isNil } from 'ramda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { appFixture } from './fixtures/isolatedApp';
import { withIsolatedApp } from './isolatedApp';

import { EventEmitter } from 'node:events';
import { realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { AppProgress } from './isolatedApp';

vi.mock('./environmentCommands', () => ({ runLocalCommand: vi.fn() }));
vi.mock('node:net', () => ({
  createServer: () =>
    Object.assign(new EventEmitter(), {
      listen(_options: unknown, callback: () => void) {
        queueMicrotask(callback);
      },
      close(callback: () => void) {
        callback();
      },
    }),
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
  const progress: AppProgress[] = [];
  const state = { hasClosed: false };
  vi.mocked(runLocalCommand).mockImplementation(
    async (_tool, args, options) => {
      if (args[1] === 'build') return '';
      return new Promise<string>((resolve) => {
        options.signal?.addEventListener(
          'abort',
          () => {
            state.hasClosed = true;
            resolve('');
          },
          { once: true },
        );
      });
    },
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('ready', {
          headers: {
            'x-scenario-e2e-run-id': fixture.connection.manifest.runId,
          },
        }),
    ),
  );
  return { ...fixture, progress, state };
};
beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-isolated-app-')))
      throw new Error('テスト一時領域以外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('所有appの進捗通知', () => {
  it('各段階の処理開始前にphase/runIdだけを通知する', async () => {
    const value = setup();
    const entered = gate();
    const pending = gate();
    const command = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(command)) throw new Error('command mockがありません。');
    vi.mocked(runLocalCommand).mockImplementation(async (...args) => {
      expect(value.progress.at(-1)?.phase).toBe(
        args[1][1] === 'build' ? 'build' : 'readiness',
      );
      return command(...args);
    });
    const running = withIsolatedApp(
      value.connection,
      new AbortController().signal,
      async () => {
        expect(value.progress.at(-1)?.phase).toBe('operation');
        entered.release();
        await pending.promise;
      },
      (progress) => {
        value.progress.push(progress);
      },
    );
    await entered.promise;
    try {
      expect(value.progress).toEqual(
        ['build', 'readiness', 'operation'].map((phase) => ({
          phase,
          runId: value.connection.manifest.runId,
        })),
      );
      expect(value.state.hasClosed).toBe(false);
    } finally {
      pending.release();
    }
    await running;
    expect(value.state.hasClosed).toBe(true);
  });

  it.each([
    'throw',
    'reject',
  ] as const)('callbackの%sでoperationとserver cleanupを妨げない', async (mode) => {
    const value = setup();
    const operation = vi.fn(async () => {});
    const callback = vi.fn(() => {
      if (mode === 'throw') throw new Error('private-callback-error');
      return Promise.reject(new Error('private-callback-error'));
    });
    await withIsolatedApp(
      value.connection,
      new AbortController().signal,
      operation,
      callback,
    );
    expect(callback).toHaveBeenCalledTimes(3);
    expect(operation).toHaveBeenCalledOnce();
    expect(value.state.hasClosed).toBe(true);
    expect(value.readStatus()).toMatchObject({
      status: 'passed',
      failures: [],
    });
    expect(JSON.stringify(value.readStatus())).not.toContain(
      'private-callback-error',
    );
  });

  it('callback失敗後もoperation本体の失敗を隠さずserver終了を待つ', async () => {
    const value = setup();
    await expect(
      withIsolatedApp(
        value.connection,
        new AbortController().signal,
        async () => {
          throw new Error('private-operation-error');
        },
        () => {
          throw new Error('private-callback-error');
        },
      ),
    ).rejects.toThrow('operation');
    expect(value.state.hasClosed).toBe(true);
    expect(value.readStatus()).toMatchObject({
      status: 'failed',
      failures: ['operation'],
    });
  });
});

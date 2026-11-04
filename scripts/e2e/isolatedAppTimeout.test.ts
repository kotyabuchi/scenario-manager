import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { appFixture } from './fixtures/isolatedApp';
import { withIsolatedApp } from './isolatedApp';

import { EventEmitter } from 'node:events';
import { realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
const setup = () => {
  const fixture = appFixture();
  roots.push(fixture.root);
  return fixture;
};
const gate = () => {
  let announce = () => {};
  const promise = new Promise<void>((resolve) => {
    announce = resolve;
  });
  return { promise, announce };
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), delay);
    return controller.signal;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-isolated-app-')))
      throw new Error('テスト一時領域以外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('期限と協調中断', () => {
  it('build期限で所有buildをabortし、その終了後に失敗を返す', async () => {
    const fixture = setup();
    const started = gate();
    let hasClosed = false;
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, options) => {
        started.announce();
        return new Promise<string>((_resolve, reject) =>
          options.signal?.addEventListener(
            'abort',
            () => {
              hasClosed = true;
              reject(new Error('private build error'));
            },
            { once: true },
          ),
        );
      },
    );
    const assertion = expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow('build');
    await started.promise;
    await vi.advanceTimersByTimeAsync(20 * 60_000);
    await assertion;
    expect(hasClosed).toBe(true);
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it('別run応答をreadinessに採用せず90秒後に所有serverを停止する', async () => {
    const fixture = setup();
    const started = gate();
    let hasClosed = false;
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, args, options) => {
        if (args[1] === 'build') return '';
        return new Promise<string>((resolve) =>
          options.signal?.addEventListener(
            'abort',
            () => {
              hasClosed = true;
              resolve('');
            },
            { once: true },
          ),
        );
      },
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        started.announce();
        return new Response('foreign app', {
          headers: { 'x-scenario-e2e-run-id': 'another-run' },
        });
      }),
    );
    const operation = vi.fn();
    const assertion = expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        operation,
      ),
    ).rejects.toThrow('readiness');
    await started.promise;
    await vi.advanceTimersByTimeAsync(90_000);
    await assertion;
    expect(hasClosed).toBe(true);
    expect(operation).not.toHaveBeenCalled();
  });

  it.each([
    'timeout',
    'caller',
  ] as const)('%sでoperationへ中断を伝え、その終了とserver停止を待つ', async (mode) => {
    const fixture = setup();
    const started = gate();
    const controller = new AbortController();
    let hasOperationClosed = false;
    let hasServerClosed = false;
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, args, options) => {
        if (args[1] === 'build') return '';
        return new Promise<string>((resolve) =>
          options.signal?.addEventListener(
            'abort',
            () => {
              hasServerClosed = true;
              resolve('');
            },
            { once: true },
          ),
        );
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
    const assertion = expect(
      withIsolatedApp(
        fixture.connection,
        controller.signal,
        async ({ signal }) => {
          started.announce();
          await new Promise<void>((resolve) =>
            signal.addEventListener(
              'abort',
              () => {
                hasOperationClosed = true;
                resolve();
              },
              { once: true },
            ),
          );
        },
      ),
    ).rejects.toThrow('operation');
    await started.promise;
    if (mode === 'caller') controller.abort();
    else await vi.advanceTimersByTimeAsync(20 * 60_000);
    await assertion;
    expect(hasOperationClosed).toBe(true);
    expect(hasServerClosed).toBe(true);
    expect(fixture.readStatus()).toMatchObject({
      status: 'failed',
      failures: ['operation'],
    });
  });
});

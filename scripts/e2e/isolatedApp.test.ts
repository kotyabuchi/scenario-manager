import { isNil } from 'ramda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { normalizeNextEnv } from './fingerprintNextEnv';
import { appFixture } from './fixtures/isolatedApp';
import { withIsolatedApp } from './isolatedApp';

import { EventEmitter } from 'node:events';
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const network = vi.hoisted(() => ({ isOccupied: false, closes: 0 }));
vi.mock('./environmentCommands', () => ({ runLocalCommand: vi.fn() }));
vi.mock('node:net', () => ({
  createServer: () => {
    const emitter = new EventEmitter();
    return Object.assign(emitter, {
      listen(_options: unknown, callback: () => void) {
        if (network.isOccupied)
          queueMicrotask(() => emitter.emit('error', new Error('EADDRINUSE')));
        else queueMicrotask(callback);
      },
      close(callback: (error?: Error) => void) {
        network.closes++;
        callback();
      },
    });
  },
}));
const roots: string[] = [];
const setup = () => {
  const fixture = appFixture();
  roots.push(fixture.root);
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
  return fixture;
};
const mockCommands = () => {
  const state = { finishServer: () => {}, didClose: false };
  vi.mocked(runLocalCommand).mockImplementation(
    async (_tool, args, options) => {
      if (args[1] === 'build') return '';
      return new Promise<string>((resolve) => {
        state.finishServer = () => {
          if (state.didClose) return;
          state.didClose = true;
          options.onClose?.({ exitCode: 0, signal: null });
          resolve('');
        };
        options.signal?.addEventListener('abort', state.finishServer, {
          once: true,
        });
      });
    },
  );
  return state;
};
beforeEach(() => {
  vi.resetAllMocks();
  network.isOccupied = false;
  network.closes = 0;
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

describe('所有Next production process', () => {
  it('browserとserverの実closeを停止順に安全な診断へ保存する', async () => {
    const fixture = setup();
    writeFileSync(join(fixture.root, 'next-env.d.ts'), normalizeNextEnv());
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, args, options) => {
        if (args[1] === 'build') return '';
        return new Promise<string>((resolve) =>
          options.signal?.addEventListener(
            'abort',
            () => {
              options.onClose?.({ exitCode: null, signal: 'secret-signal' });
              resolve('');
            },
            { once: true },
          ),
        );
      },
    );
    await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async (app) => {
        app.recordBrowserClose({ exitCode: 7, signal: null });
        app.recordBrowserReport('private-secret ERR_CONNECTION_FAILED');
      },
    );
    const text = readFileSync(
      join(fixture.workdir, 'app', 'diagnostic.json'),
      'utf8',
    );
    const diagnostic = JSON.parse(text);
    expect(text).not.toContain('secret-signal');
    expect(
      diagnostic.events.map((event: { event: string }) => event.event),
    ).toEqual([
      'server-start-requested',
      'browser-close',
      'browser-report-read',
      'stop-requested',
      'server-close',
      'server-cleanup-finished',
    ]);
    expect(diagnostic.events[1]).toMatchObject({
      serverCloseObserved: false,
      outcome: 'nonzero',
    });
    expect(diagnostic.events[2]).toMatchObject({
      outcome: 'connection-failed-text',
    });
    expect(diagnostic.events[4]).toMatchObject({
      serverCloseObserved: true,
      outcome: 'signal',
    });
    expect(text).not.toContain('private-secret');
    expect(diagnostic.nextEnv.before).toMatchObject({
      status: 'known',
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      normalizedHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(diagnostic.nextEnv.after).toEqual(diagnostic.nextEnv.before);
  });

  it('未知のnext-env内容を公開せずtemplate不明として残す', async () => {
    const fixture = setup();
    writeFileSync(join(fixture.root, 'next-env.d.ts'), 'private-secret');
    mockCommands();
    await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async () => {},
    );
    const text = readFileSync(
      join(fixture.workdir, 'app', 'diagnostic.json'),
      'utf8',
    );
    expect(text).not.toContain('private-secret');
    expect(JSON.parse(text).nextEnv).toEqual({
      before: { status: 'unknown-template' },
      after: { status: 'unknown-template' },
    });
  });

  it('診断ファイルの書込失敗や未知templateでも本来の成功とcleanupを変えない', async () => {
    const fixture = setup();
    writeFileSync(join(fixture.root, 'next-env.d.ts'), 'private-secret');
    const server = mockCommands();
    await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async () => {
        mkdirSync(join(fixture.workdir, 'app', 'diagnostic.json'));
      },
    );
    expect(server.didClose).toBe(true);
    expect(fixture.readStatus()).toMatchObject({ status: 'passed' });
    expect(JSON.stringify(fixture.readStatus())).not.toContain(
      'private-secret',
    );
  });
  it('build後に固定host/portで起動し、利用者公開envとsignalだけをoperationへ渡す', async () => {
    const fixture = setup();
    const server = mockCommands();
    const operation = vi.fn(async (context) => {
      expect(context.baseURL).toBe('http://127.0.0.1:23100');
      expect(context.signal.aborted).toBe(false);
      expect(context.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
        fixture.connection.anonKey,
      );
      expect(context.env).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
    });
    await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      operation,
    );
    expect(operation).toHaveBeenCalledTimes(1);
    expect(server.didClose).toBe(true);
    expect(network.closes).toBe(2);
    expect(vi.mocked(runLocalCommand).mock.calls).toEqual([
      [
        'node',
        [fixture.nextCLI, 'build'],
        expect.objectContaining({
          cwd: fixture.root,
          log: join(fixture.workdir, 'app', 'build.private.log'),
        }),
      ],
      [
        'node',
        [
          fixture.nextCLI,
          'start',
          '--hostname',
          '127.0.0.1',
          '--port',
          '23100',
        ],
        expect.objectContaining({
          shouldAllowAbort: true,
          log: join(fixture.workdir, 'app', 'server.private.log'),
        }),
      ],
    ]);
    expect(vi.mocked(runLocalCommand).mock.calls[0]?.[2]).not.toHaveProperty(
      'shouldAllowAbort',
    );
    expect(fixture.readStatus()).toMatchObject({
      status: 'passed',
      phase: 'finished',
      failures: [],
    });
  });

  it('run専用tsconfigは相対pathで作成し、元configの保持とnext-env生成変更を記録する', async () => {
    const fixture = setup();
    const original = '{"compilerOptions":{"strict":true}}';
    writeFileSync(join(fixture.root, 'tsconfig.json'), original);
    writeFileSync(join(fixture.root, 'next-env.d.ts'), '// before');
    mockCommands();
    const command = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(command)) throw new Error('command mockがありません。');
    vi.mocked(runLocalCommand).mockImplementation(async (...args) => {
      if (args[1][1] === 'build')
        writeFileSync(join(fixture.root, 'next-env.d.ts'), '// generated');
      return command(...args);
    });
    await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async () => {},
    );
    const config: unknown = JSON.parse(
      readFileSync(join(fixture.workdir, 'app', 'tsconfig.json'), 'utf8'),
    );
    const root = '../../../..';
    expect(config).toMatchObject({
      extends: `${root}/tsconfig.json`,
      include: [
        `${root}/next-env.d.ts`,
        `${root}/src/**/*.ts`,
        `${root}/src/**/*.tsx`,
        `${root}/next.config.ts`,
        `${root}/.next-e2e/run-${fixture.connection.manifest.runId}/types/**/*.ts`,
      ],
      exclude: [
        `${root}/node_modules`,
        `${root}/test-results`,
        `${root}/styled-system/**/*.d.ts`,
        `${root}/styled-system/**/*.js`,
        `${root}/styled-system/**/*.mjs`,
      ],
    });
    expect(readFileSync(join(fixture.root, 'tsconfig.json'), 'utf8')).toBe(
      original,
    );
    expect(fixture.readStatus()).toMatchObject({
      status: 'passed',
      nextEnvChanged: true,
    });
  });

  it('operation終了後も所有serverの実closeが完了するまで返さない', async () => {
    const fixture = setup();
    let close = () => {};
    let announced = () => {};
    const stopping = new Promise<void>((resolve) => {
      announced = resolve;
    });
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, args, options) => {
        if (args[1] === 'build') return '';
        return new Promise<string>((resolve) => {
          close = () => resolve('');
          options.signal?.addEventListener('abort', announced, { once: true });
        });
      },
    );
    let hasReturned = false;
    const result = withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async () => {},
    ).then(() => {
      hasReturned = true;
    });
    await stopping;
    expect(hasReturned).toBe(false);
    close();
    await result;
    expect(hasReturned).toBe(true);
  });

  it('operation失敗とserver log/停止失敗を両方報告しraw errorを公開しない', async () => {
    const fixture = setup();
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, args, options) => {
        if (args[1] === 'build') return '';
        return new Promise<string>((_resolve, reject) =>
          options.signal?.addEventListener(
            'abort',
            () => reject(new Error('private-log-secret')),
            { once: true },
          ),
        );
      },
    );
    const error = await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async () => {
        throw new Error('private-operation-secret');
      },
    ).catch((value: unknown) => value);
    expect(String(error)).toContain('operation, server-stop');
    expect(String(error)).not.toContain('secret');
    expect(fixture.readStatus()).toMatchObject({
      status: 'failed',
      failures: ['operation', 'server-stop'],
    });
  });

  it('server異常終了をoperationへ中断通知し、operation終了後に失敗を返す', async () => {
    const fixture = setup();
    const server = mockCommands();
    let hasOperationClosed = false;
    await expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        async ({ signal }) => {
          await new Promise<void>((resolve) => {
            signal.addEventListener(
              'abort',
              () => {
                hasOperationClosed = true;
                resolve();
              },
              { once: true },
            );
            server.finishServer();
          });
        },
      ),
    ).rejects.toThrow('server-exit');
    expect(hasOperationClosed).toBe(true);
    const diagnostic = JSON.parse(
      readFileSync(join(fixture.workdir, 'app', 'diagnostic.json'), 'utf8'),
    );
    expect(
      diagnostic.events.map((event: { event: string }) => event.event),
    ).toEqual([
      'server-start-requested',
      'server-close',
      'stop-requested',
      'server-cleanup-finished',
    ]);
    expect(diagnostic.events[1]).toMatchObject({
      phase: 'operation',
      serverCloseObserved: true,
      outcome: 'zero',
    });
  });

  it('build失敗ではstartせず、秘密を含む子errorを段階に置き換える', async () => {
    const fixture = setup();
    vi.mocked(runLocalCommand).mockRejectedValueOnce(
      new Error('private-build-secret'),
    );
    await expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow('build');
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fixture.readStatus())).not.toContain('secret');
  });

  it.each([
    'port',
    'lock',
    'hash',
    'lease',
    'version',
    'occupied',
  ] as const)('%sの事前確認に失敗したら既存serverへ接続しない', async (fault) => {
    const fixture = setup();
    if (fault === 'port') {
      fixture.runtime.additionalPorts = [];
      fixture.saveRuntime();
    }
    if (fault === 'lock') {
      fixture.runtime.lockFiles = [];
      fixture.saveRuntime();
    }
    if (fault === 'hash') {
      for (const record of fixture.runtime.lockFiles)
        record.contentsHash = '0'.repeat(64);
      fixture.saveRuntime();
    }
    if (fault === 'lease')
      fixture.connection.lease.ownerNonce =
        '00000000-0000-4000-8000-000000000001';
    if (fault === 'version')
      writeFileSync(fixture.nextPackage, '{"version":"16.2.0"}');
    if (fault === 'occupied') network.isOccupied = true;
    const operation = vi.fn();
    await expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        operation,
      ),
    ).rejects.toThrow('preflight');
    expect(runLocalCommand).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });

  it('同runの古いbuild出力を再利用しない', async () => {
    const fixture = setup();
    mockCommands();
    await withIsolatedApp(
      fixture.connection,
      new AbortController().signal,
      async () => {},
    );
    vi.mocked(runLocalCommand).mockClear();
    await expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow('preflight');
    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('中断済み入力ではbuild/serverを起動しない', async () => {
    const fixture = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(
      withIsolatedApp(fixture.connection, controller.signal, async () => {}),
    ).rejects.toThrow('preflight');
    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('runtimeのapp portとworktree予約を実fileのinode/hashで確認する', async () => {
    const fixture = setup();
    const record = fixture.runtime.lockFiles[0];
    if (isNil(record)) throw new Error('port lock fixtureがありません。');
    const contents = readFileSync(record.path);
    rmSync(record.path);
    writeFileSync(record.path, contents);
    record.ino = '0';
    fixture.saveRuntime();
    await expect(
      withIsolatedApp(
        fixture.connection,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow('preflight');
    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

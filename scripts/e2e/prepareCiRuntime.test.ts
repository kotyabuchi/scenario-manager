import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { renderEnvironmentConfig } from './environmentInputs';
import { EXCLUDED_SERVICES } from './environmentProbe';
import {
  CI_RUNTIME_IMAGES,
  ciRuntimeProgressSchema,
  IMAGE_PREFETCH_TIMEOUT_MS,
  prepareCiRuntime,
} from './prepareCiRuntime';

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { CiRuntimeProgress } from './prepareCiRuntime';

const versionState = vi.hoisted(() => ({ version: '2.75.0' }));
vi.mock('./supabaseCli', () => ({
  get SUPABASE_CLI_VERSION() {
    return versionState.version;
  },
}));
vi.mock('./environmentCommands', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));

const ROOT = process.cwd();
const ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-test-key',
  PATH: process.env.PATH,
  SUPABASE_INTERNAL_IMAGE_REGISTRY: 'public.ecr.aws',
  PRIVATE_TEST_VALUE: 'secret-must-not-escape',
};
const run = vi.mocked(runLocalCommand);
const LOCAL_DOCKER_HOST = 'unix:///var/run/docker.sock';
const mockCommands = (implementation: typeof runLocalCommand) =>
  run.mockImplementation((tool, args, commandOptions) => {
    if (tool === 'docker' && args[0] === 'context')
      return Promise.resolve(LOCAL_DOCKER_HOST);
    return implementation(tool, args, commandOptions);
  });
const events: CiRuntimeProgress[] = [];
const record = (event: CiRuntimeProgress) => events.push(event);
const options = () => ({
  root: ROOT,
  env: ENV,
  platform: 'linux' as const,
  arch: 'x64',
  onProgress: record,
});
const deferred = () => {
  let resolve: (value: string) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<string>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  // mock commandのclose通知とallSettledのmicrotaskを完了させる。
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
};
const isPull = (args: string[]) => args[0] === 'pull';

beforeEach(() => {
  run.mockReset();
  mockCommands(async () => '');
  versionState.version = '2.75.0';
  events.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CI runtime準備', () => {
  it('正式Playwright入口と5imageのinspectを並行開始し、cache時はpullしない', async () => {
    const chromium = deferred();
    mockCommands(async (tool) => (tool === 'node' ? chromium.promise : ''));
    let hasReturned = false;
    const result = prepareCiRuntime(options()).then((value) => {
      hasReturned = true;
      return value;
    });
    await flush();
    expect(run.mock.calls.filter(([tool]) => tool === 'docker')).toHaveLength(
      6,
    );
    expect(hasReturned).toBe(false);
    const require = createRequire(import.meta.url);
    const packageFile = require.resolve('playwright/package.json');
    expect(JSON.parse(readFileSync(packageFile, 'utf8')).bin.playwright).toBe(
      'cli.js',
    );
    const entry = join(dirname(packageFile), 'cli.js');
    expect(readFileSync(entry, 'utf8')).toContain(
      'program.parse(process.argv)',
    );
    expect(run.mock.calls[0]).toEqual([
      'node',
      [entry, 'install', '--with-deps', 'chromium'],
      expect.objectContaining({ cwd: ROOT, env: ENV }),
    ]);
    expect(run.mock.calls.some(([, args]) => isPull(args))).toBe(false);
    expect(events.filter((event) => event.status === 'cached')).toHaveLength(5);
    chromium.resolve('secret command output');
    expect(await result).toBe(true);
    expect(events.at(-1)).toMatchObject({
      scope: 'runtime',
      status: 'completed',
    });
  });

  it('inspect失敗のimageだけ固定refでpullし、成功した先読みを報告する', async () => {
    const missing = CI_RUNTIME_IMAGES.images[2];
    mockCommands(async (tool, args) => {
      if (tool === 'docker' && args[0] === 'image' && args[2] === missing)
        throw new Error('secret inspect failure');
      return 'secret output';
    });
    expect(await prepareCiRuntime(options())).toBe(true);
    expect(run.mock.calls.filter(([, args]) => isPull(args))).toEqual([
      [
        'docker',
        ['pull', '--quiet', missing],
        expect.objectContaining({
          env: expect.not.objectContaining({
            PRIVATE_TEST_VALUE: expect.anything(),
          }),
        }),
      ],
    ]);
    const pullEvents = events.filter((event) => event.image === missing);
    expect(pullEvents.map((event) => event.status)).toEqual([
      'pulling',
      'pulled',
    ]);
    expect(pullEvents[1]?.elapsedMs).toBeGreaterThanOrEqual(
      pullEvents[0]?.elapsedMs ?? 0,
    );
  });

  it('一部pull失敗は全image終了後fallbackし、Chromium成功を保持する', async () => {
    const slowImage = deferred();
    mockCommands(async (tool, args) => {
      if (tool === 'node') return '';
      if (args[0] === 'image') throw new Error('secret absent');
      if (args[2] === CI_RUNTIME_IMAGES.images[0]) return slowImage.promise;
      if (args[2] === CI_RUNTIME_IMAGES.images[1])
        throw new Error('secret pull');
      return '';
    });
    let hasReturned = false;
    const result = prepareCiRuntime(options()).then((value) => {
      hasReturned = true;
      return value;
    });
    await flush();
    expect(run.mock.calls.filter(([, args]) => isPull(args))).toHaveLength(5);
    expect(hasReturned).toBe(false);
    slowImage.resolve('');
    expect(await result).toBe(true);
    expect(events).toContainEqual(
      expect.objectContaining({ scope: 'images', status: 'fallback' }),
    );
    expect(JSON.stringify(events)).not.toContain('secret');
  });

  it.each([
    { env: { ...ENV, SUPABASE_INTERNAL_IMAGE_REGISTRY: 'ghcr.io' } },
    { env: { ...ENV, SUPABASE_INTERNAL_IMAGE_REGISTRY: undefined } },
    { platform: 'win32' as const },
    { arch: 'arm64' },
  ])('非対応registry/platformでは先読みだけを明示skipする', async (override) => {
    expect(await prepareCiRuntime({ ...options(), ...override })).toBe(true);
    expect(run.mock.calls.map(([tool]) => tool)).toEqual(['node']);
    expect(events).toContainEqual(
      expect.objectContaining({ scope: 'images', status: 'skipped' }),
    );
  });

  it.each([
    'tcp://private-docker:2376',
    '',
    'not-a-socket',
  ])('remoteまたは不正Docker contextではimageを触らずfallbackする', async (host) => {
    run.mockImplementation(async (tool) => (tool === 'docker' ? host : ''));
    expect(await prepareCiRuntime(options())).toBe(true);
    expect(run.mock.calls.filter(([tool]) => tool === 'docker')).toEqual([
      [
        'docker',
        ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
        expect.anything(),
      ],
    ]);
    expect(events).toContainEqual(
      expect.objectContaining({ scope: 'images', status: 'fallback' }),
    );
    expect(JSON.stringify(events)).not.toContain('private-docker');
  });

  it('Chromium失敗で全imageをabortし、全close相当の完了まで戻らない', async () => {
    const chromium = deferred();
    const imageCommands = CI_RUNTIME_IMAGES.images.map(() => deferred());
    const imageSignals: AbortSignal[] = [];
    let imageIndex = 0;
    mockCommands(async (tool, _args, commandOptions) => {
      if (tool === 'node') return chromium.promise;
      if (commandOptions.signal) imageSignals.push(commandOptions.signal);
      const command = imageCommands[imageIndex];
      imageIndex += 1;
      if (!command) throw new Error('unexpected command');
      return command.promise;
    });
    let hasReturned = false;
    const result = prepareCiRuntime(options()).then((value) => {
      hasReturned = true;
      return value;
    });
    await flush();
    chromium.reject(new Error('private Chromium failure'));
    await flush();
    expect(imageSignals).toHaveLength(5);
    expect(imageSignals.every((signal) => signal.aborted)).toBe(true);
    expect(hasReturned).toBe(false);
    for (const command of imageCommands.slice(0, -1)) command.reject('closed');
    await flush();
    expect(hasReturned).toBe(false);
    imageCommands.at(-1)?.reject('closed');
    expect(await result).toBe(false);
    expect(run.mock.calls.some(([, args]) => isPull(args))).toBe(false);
    expect(events).toContainEqual(
      expect.objectContaining({ scope: 'chromium', status: 'failed' }),
    );
  });

  it('先読みdeadlineはChromiumをabortせず、imageのclose後にfallbackする', async () => {
    vi.useFakeTimers();
    const chromium = deferred();
    const imageCommands = CI_RUNTIME_IMAGES.images.map(() => deferred());
    const imageSignals: AbortSignal[] = [];
    let browserSignal: AbortSignal | undefined;
    let imageIndex = 0;
    mockCommands(async (tool, _args, commandOptions) => {
      if (tool === 'node') {
        browserSignal = commandOptions.signal;
        return chromium.promise;
      }
      if (commandOptions.signal) imageSignals.push(commandOptions.signal);
      const command = imageCommands[imageIndex];
      imageIndex += 1;
      if (!command) throw new Error('unexpected command');
      return command.promise;
    });
    let hasReturned = false;
    const result = prepareCiRuntime(options()).then((value) => {
      hasReturned = true;
      return value;
    });
    await vi.advanceTimersByTimeAsync(IMAGE_PREFETCH_TIMEOUT_MS);
    expect(imageSignals.every((signal) => signal.aborted)).toBe(true);
    expect(browserSignal?.aborted).toBe(false);
    chromium.resolve('');
    await flush();
    expect(hasReturned).toBe(false);
    for (const command of imageCommands) command.reject('closed');
    expect(await result).toBe(true);
    expect(events).toContainEqual(
      expect.objectContaining({ scope: 'images', status: 'fallback' }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('外部abortと成功closeが競合しても取得へ進まず、listenerを残さない', async () => {
    const controller = new AbortController();
    const commands = Array.from({ length: 6 }, () => deferred());
    const signals: AbortSignal[] = [];
    const intListeners = process.listenerCount('SIGINT');
    const termListeners = process.listenerCount('SIGTERM');
    let commandIndex = 0;
    mockCommands(async (_tool, _args, commandOptions) => {
      if (commandOptions.signal) signals.push(commandOptions.signal);
      const command = commands[commandIndex];
      commandIndex += 1;
      if (!command) throw new Error('unexpected command');
      return command.promise;
    });
    const result = prepareCiRuntime({
      ...options(),
      signal: controller.signal,
    });
    await flush();
    controller.abort();
    for (const command of commands) command.resolve('secret output');
    expect(await result).toBe(false);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(run.mock.calls.some(([, args]) => isPull(args))).toBe(false);
    expect(process.listenerCount('SIGINT')).toBe(intListeners);
    expect(process.listenerCount('SIGTERM')).toBe(termListeners);
  });

  it('開始前abortでは子を生成しない', async () => {
    const controller = new AbortController();
    controller.abort('secret reason');
    expect(
      await prepareCiRuntime({ ...options(), signal: controller.signal }),
    ).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  it('observer例外を隔離し、公開schemaの固定imageと時刻だけを表示する', async () => {
    mockCommands(async () => 'secret-must-not-escape');
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    expect(
      await prepareCiRuntime({
        ...options(),
        onProgress: () => {
          throw new Error('observer failure');
        },
      }),
    ).toBe(true);
    const { onProgress: _onProgress, ...publicOptions } = options();
    expect(await prepareCiRuntime(publicOptions)).toBe(true);
    const output = stdout.mock.calls.map(([value]) => String(value)).join('');
    expect(output).not.toContain('secret');
    const publicEvents = output
      .trim()
      .split('\n')
      .map((line) => {
        expect(line.startsWith('[ci-runtime] ')).toBe(true);
        const input: unknown = JSON.parse(line.slice('[ci-runtime] '.length));
        const event = ciRuntimeProgressSchema.parse(input);
        expect(Object.keys(input ?? {}).sort()).toEqual(
          (event.image
            ? ['schemaVersion', 'scope', 'status', 'elapsedMs', 'image']
            : ['schemaVersion', 'scope', 'status', 'elapsedMs']
          ).sort(),
        );
        expect(event.elapsedMs).toBeGreaterThanOrEqual(0);
        return event;
      });
    expect(publicEvents.filter((event) => event.image)).toHaveLength(5);
    expect(publicEvents.at(-1)).toMatchObject({
      scope: 'runtime',
      status: 'completed',
    });
    expect(stderr).not.toHaveBeenCalled();
  });

  it.each([
    'initial',
    'report',
  ] as const)('時計の%s障害で準備処理や終了待機を変えない', async (phase) => {
    const clock = vi.spyOn(performance, 'now');
    if (phase === 'initial')
      clock.mockImplementationOnce(() => {
        throw new Error('secret clock failure');
      });
    else
      clock
        .mockImplementationOnce(() => 0)
        .mockImplementation(() => {
          throw new Error('secret clock failure');
        });
    const result = await prepareCiRuntime(options());
    clock.mockRestore();
    expect(result).toBe(true);
    expect(run).toHaveBeenCalledTimes(CI_RUNTIME_IMAGES.images.length + 2);
    expect(events).toEqual([]);
  });

  it('診断schema検証の失敗で準備を不合格にしない', async () => {
    vi.spyOn(ciRuntimeProgressSchema, 'parse').mockImplementation(() => {
      throw new Error('private schema failure');
    });
    expect(await prepareCiRuntime(options())).toBe(true);
    expect(run).toHaveBeenCalledTimes(CI_RUNTIME_IMAGES.images.length + 2);
    expect(events).toEqual([]);
  });

  it('CLI版が更新されたら古いimage先読み契約で起動しない', async () => {
    versionState.version = '2.76.0';
    expect(await prepareCiRuntime(options())).toBe(false);
    expect(run).not.toHaveBeenCalled();
    expect(events.at(-1)).toMatchObject({ scope: 'runtime', status: 'failed' });
  });
});

describe('固定CLIとE2E設定のimage契約', () => {
  it('版・PG major・enabled構成の意味が変わったら一覧更新を要求する', async () => {
    const { SUPABASE_CLI_VERSION } =
      await vi.importActual<typeof import('./supabaseCli')>('./supabaseCli');
    expect(CI_RUNTIME_IMAGES.cliVersion).toBe(SUPABASE_CLI_VERSION);
    const config = renderEnvironmentConfig({
      runId: '012345abcdef',
      ports: { api: 56431, db: 56432, shadow: 56430 },
    });
    const sections = new Map<string, Map<string, string>>();
    let section = '';
    for (const line of config.split('\n')) {
      const heading = /^\[([^\]]+)\]$/.exec(line.trim())?.[1];
      if (heading) {
        section = heading;
        sections.set(section, new Map());
      }
      const property = /^(\w+)\s*=\s*(.+)$/.exec(line.trim());
      if (property?.[1] && property[2])
        sections.get(section)?.set(property[1], property[2]);
    }
    expect(Number(sections.get('db')?.get('major_version'))).toBe(
      CI_RUNTIME_IMAGES.postgresMajor,
    );
    expect(
      [...sections]
        .filter(([, values]) => values.get('enabled') === 'true')
        .map(([name]) => name)
        .sort(),
    ).toEqual(['api', 'auth', 'db.migrations', 'db.seed', 'storage']);
    expect(
      [...sections]
        .filter(([, values]) => values.get('enabled') === 'false')
        .map(([name]) => name)
        .sort(),
    ).toEqual([
      'analytics',
      'api.tls',
      'db.pooler',
      'edge_runtime',
      'inbucket',
      'realtime',
      'storage.image_transformation',
      'storage.s3_protocol',
      'studio',
    ]);
  });

  it('非公開excludeが変わったら先読み対象を再評価する', () => {
    expect(EXCLUDED_SERVICES.split(',').sort()).toEqual([
      'edge-runtime',
      'imgproxy',
      'logflare',
      'mailpit',
      'postgres-meta',
      'realtime',
      'studio',
      'supavisor',
      'vector',
    ]);
  });
});

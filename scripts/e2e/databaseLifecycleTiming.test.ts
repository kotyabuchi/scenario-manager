import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDatabaseLifecycleTiming } from './databaseLifecycleTiming';
import { runLocalCommand } from './environmentCommands';
import { writeProgressStderr } from './progressStderr';

vi.mock('./environmentCommands', () => ({ runLocalCommand: vi.fn() }));
vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));

const WALL = Date.parse('2026-11-15T00:00:00Z');
const options = {
  databaseId: 'a'.repeat(64),
  projectId: 'owned-project',
  cwd: 'private-path',
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test',
  } satisfies NodeJS.ProcessEnv,
};
const info = {
  id: options.databaseId,
  name: '/supabase_db_owned-project',
  project: 'owned-project',
  created: '2026-11-15T00:00:01.123456789Z',
  started: '2026-11-15T00:00:02.250Z',
  status: 'running',
  health: 'healthy',
  restarts: 0,
};
const event = (action = 'health_status: healthy', seconds = 13) => ({
  action,
  id: info.id,
  name: 'supabase_db_owned-project',
  time: WALL / 1000 + seconds,
});
const setup = (events = [event('start', 2), event()]) => {
  vi.mocked(runLocalCommand)
    .mockResolvedValueOnce(JSON.stringify(info))
    .mockResolvedValueOnce(
      events.map((item) => JSON.stringify(item)).join('\n'),
    );
  const timing = createDatabaseLifecycleTiming();
  timing.start();
  timing.finish();
  return timing;
};
const output = () =>
  vi
    .mocked(writeProgressStderr)
    .mock.calls.map(([line]) => line)
    .join('');

beforeEach(() => {
  vi.stubEnv('GITHUB_ACTIONS', 'false');
  vi.stubEnv('E2E_CLI_TIMING', '1');
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(WALL)
    .mockReturnValueOnce(WALL + 20_000);
  vi.spyOn(performance, 'now')
    .mockReturnValueOnce(100)
    .mockReturnValueOnce(20_100);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe('所有DBの有限なlifecycle観測', () => {
  it('CreatedとStartedをms精度、healthyを秒精度の範囲として出す', async () => {
    await setup().collect(options);
    expect(output()).toContain('"invocationToCreatedMs":1123');
    expect(output()).toContain('"createdToStartedMs":1127');
    expect(output()).toContain('"startedToHealthyLowerMs":10750');
    expect(output()).toContain('"startedToHealthyUpperMs":11750');
    expect(output()).toContain('"eventPrecisionMs":1000');
    expect(output()).toContain('"status":"healthy-observed"');
    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(runLocalCommand).mock.calls;
    expect(calls[0]?.[1].join(' ')).not.toMatch(/\.Env|\.Log|\.Output/);
    expect(calls[1]?.[1]).toContain(new Date(WALL - 1000).toISOString());
    expect(calls[1]?.[1]).toContain(new Date(WALL + 20_000).toISOString());
    expect(calls[0]?.[2].signal).toBe(calls[1]?.[2].signal);
    expect(calls[0]?.[2].log).toBeUndefined();
    expect(output()).not.toMatch(/private|owned|2026|password|running/);
  });

  it('startイベントの発行がStartedAtの次秒以降でも観測を捨てない', async () => {
    await setup([event('start', 3), event()]).collect(options);
    expect(output()).toContain('"status":"healthy-observed"');
    expect(output()).toContain('"startedToHealthyLowerMs":10750');
  });

  it('startイベントがStartedAtより確実に前なら棄却する', async () => {
    await setup([event('start', 1), event()]).collect(options);
    expect(output()).toContain('"status":"timestamps-invalid"');
    expect(output()).not.toContain('Ms');
  });

  it.each([
    'id',
    'name',
    'project',
  ])('inspect所有不一致では追加readを止める: %s', async (key) => {
    const timing = setup();
    vi.mocked(runLocalCommand)
      .mockReset()
      .mockResolvedValueOnce(
        JSON.stringify({ ...info, [key]: 'private-secret' }),
      );
    await timing.collect(options);
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(output()).toContain('ownership-mismatch');
    expect(output()).not.toContain('private-secret');
  });

  it.each([
    'id',
    'name',
  ])('events所有不一致の時間は出さない: %s', async (key) => {
    await setup([{ ...event(), [key]: 'private-secret' }]).collect(options);
    expect(output()).toContain('ownership-mismatch');
    expect(output()).not.toContain('Ms');
  });

  it.each([
    'private-bad-date',
    '2026-02-30T00:00:00Z',
    '0001-01-01T00:00:00Z',
  ])('不正日時を棄却する: %s', async (created) => {
    const timing = setup();
    vi.mocked(runLocalCommand)
      .mockReset()
      .mockResolvedValueOnce(JSON.stringify({ ...info, created }))
      .mockResolvedValueOnce('');
    await timing.collect(options);
    expect(output()).toContain('timestamps-invalid');
    expect(output()).not.toContain('Ms');
  });

  it('healthy欠落は未観測とし不健康やCLI失敗を推測しない', async () => {
    await setup([]).collect(options);
    expect(output()).toContain('healthy-unobserved');
    expect(output()).not.toMatch(/startedToHealthy|unhealthy|success/);
  });

  it.each([
    'start',
    'restart',
    'die',
    'oom',
    'health_status: healthy',
  ])('複数startや異常経過では時間を出さない: %s', async (action) => {
    await setup([event('start', 2), event(action, 3), event()]).collect(
      options,
    );
    expect(output()).toContain('lifecycle-ambiguous');
    expect(output()).not.toContain('Ms');
  });

  it('RestartCountがある場合はhealthyが1件でも曖昧とする', async () => {
    const timing = setup();
    vi.mocked(runLocalCommand)
      .mockReset()
      .mockResolvedValueOnce(JSON.stringify({ ...info, restarts: 1 }))
      .mockResolvedValueOnce(JSON.stringify(event()));
    await timing.collect(options);
    expect(output()).toContain('lifecycle-ambiguous');
  });

  it.each([
    WALL - 1,
    WALL + 30_000,
  ])('壁時計逆転または単調時計とのずれでreadしない: %s', async (finish) => {
    vi.mocked(Date.now)
      .mockReset()
      .mockReturnValueOnce(WALL)
      .mockReturnValueOnce(finish);
    await setup().collect(options);
    expect(runLocalCommand).not.toHaveBeenCalled();
    expect(output()).toContain('clock-invalid');
  });

  it('無効時は時計もcommandも呼ばず、有効条件を作成時固定する', async () => {
    vi.stubEnv('E2E_CLI_TIMING', '0');
    const timing = createDatabaseLifecycleTiming();
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    timing.start();
    timing.finish();
    await timing.collect(options);
    expect(Date.now).not.toHaveBeenCalled();
    expect(performance.now).not.toHaveBeenCalled();
    expect(runLocalCommand).not.toHaveBeenCalled();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('共通2秒deadlineでabortしcommandのclose完了まで待つ', async () => {
    vi.useFakeTimers();
    const timing = setup();
    let close: (() => void) | undefined;
    let aborted = false;
    vi.mocked(runLocalCommand)
      .mockReset()
      .mockImplementation(async (_tool, _args, commandOptions) => {
        await new Promise<void>((resolve) => {
          close = resolve;
          commandOptions.signal?.addEventListener('abort', () => {
            aborted = true;
          });
        });
        throw new Error('private-secret');
      });
    let settled = false;
    const collection = timing.collect(options).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(2000);
    expect(aborted).toBe(true);
    expect(settled).toBe(false);
    close?.();
    await collection;
    expect(output()).toContain('collection-aborted');
    expect(output()).not.toContain('private-secret');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('親取消を伝播しlistenerを解放する', async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const timing = setup();
    vi.mocked(runLocalCommand)
      .mockReset()
      .mockImplementation(async (_tool, _args, commandOptions) => {
        controller.abort();
        expect(commandOptions.signal?.aborted).toBe(true);
        throw new Error('private-secret');
      });
    await timing.collect({ ...options, signal: controller.signal });
    expect(output()).toContain('collection-aborted');
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('parseと出力障害を外へ伝えず二重collectもしない', async () => {
    const timing = setup();
    vi.mocked(runLocalCommand)
      .mockReset()
      .mockResolvedValueOnce('private-invalid-json');
    vi.mocked(writeProgressStderr).mockImplementation(() => {
      throw new Error('private-output');
    });
    await expect(timing.collect(options)).resolves.toBeUndefined();
    await timing.collect(options);
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it('時計障害を隔離する', async () => {
    vi.mocked(Date.now)
      .mockReset()
      .mockImplementation(() => {
        throw new Error('private-clock');
      });
    await setup().collect(options);
    expect(output()).toContain('clock-invalid');
    expect(runLocalCommand).not.toHaveBeenCalled();
  });
});

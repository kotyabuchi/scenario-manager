import { afterEach, describe, expect, it, vi } from 'vitest';

import { writeProgressStderr } from './progressStderr';
import { createSupabaseStartTiming } from './supabaseStartTiming';

vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('Supabase起動の安全な到達点計時', () => {
  it('任意chunk境界・ANSI・CRLFでも固定到達点と経過時間だけを公開する', () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    let now = 100;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const observer = createSupabaseStartTiming();
    const input =
      '\u001b[32mStarting database...\u001b[0m\r\nInitialising schema...\nSeeding globals from /private/secret.sql...\nApplying migration secret.sql...\nApplying migration other.sql...\nSeeding data from /private/seed.sql...\rStarting containers...\nWaiting for health checks...\nStarted supabase local development setup.';
    for (const character of input) {
      now += 1;
      observer.observe(character);
    }
    observer.close();
    observer.close();
    observer.observe('Starting database...\n');
    const output = vi
      .mocked(writeProgressStderr)
      .mock.calls.map(([line]) => line);
    const events = output.map((line) =>
      JSON.parse(line.replace('[supabase-start-timing] ', '')),
    );
    expect(events.map((event) => event.milestone)).toEqual([
      'database',
      'schema',
      'globals',
      'migrations',
      'seed',
      'containers',
      'health',
      'ready',
    ]);
    expect(events.every((event) => Number.isFinite(event.elapsedMs))).toBe(
      true,
    );
    expect(output.join('')).not.toMatch(
      /secret|private|\.sql|completed|outcome/,
    );
    expect(events[0].elapsedMs).toBeLessThan(events[7].elapsedMs);
  });

  it('改行なし巨大行と偽suffixを捨て、後続の通常行を観測する', () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    const observer = createSupabaseStartTiming();
    observer.observe('x'.repeat(100_000));
    observer.observe('Starting database...\n');
    observer.observe('Starting containers...\n');
    observer.close();
    expect(writeProgressStderr).toHaveBeenCalledTimes(1);
    expect(vi.mocked(writeProgressStderr).mock.calls[0]?.[0]).toContain(
      '"milestone":"containers"',
    );
  });

  it('未完のmarkerと未知行から成功や到達を推測しない', () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    const observer = createSupabaseStartTiming();
    observer.observe('secret=Starting database...\nWaiting for health');
    observer.close();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('作成時に診断が無効なら後で有効にしても時計・parserを実行せず出力しない', () => {
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('E2E_CLI_TIMING', '0');
    const clock = vi.spyOn(performance, 'now');
    const observer = createSupabaseStartTiming();
    vi.stubEnv('E2E_CLI_TIMING', '1');
    observer.observe('x'.repeat(100_000));
    observer.observe('Starting database...\n');
    observer.close();
    expect(clock).not.toHaveBeenCalled();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('作成時に診断が有効なら後の環境変数変更で観測を停止しない', () => {
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('E2E_CLI_TIMING', '1');
    const observer = createSupabaseStartTiming();
    vi.stubEnv('E2E_CLI_TIMING', '0');
    observer.observe('Starting database...\n');
    observer.close();
    expect(writeProgressStderr).toHaveBeenCalledTimes(1);
  });

  it.each([
    NaN,
    Infinity,
    -Infinity,
  ])('非有限の時計 %s を公開しない', (value) => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValue(value);
    const observer = createSupabaseStartTiming();
    observer.observe('Starting database...\n');
    observer.close();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('初期時計と観測時計の例外を隔離する', () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    vi.spyOn(performance, 'now').mockImplementation(() => {
      throw new Error('private');
    });
    const observer = createSupabaseStartTiming();
    expect(() => observer.observe('Starting database...\n')).not.toThrow();
    observer.close();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('出力observerの例外を隔離し後続到達点の観測を続ける', () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    vi.mocked(writeProgressStderr).mockImplementationOnce(() => {
      throw new Error('private');
    });
    const observer = createSupabaseStartTiming();
    expect(() =>
      observer.observe('Starting database...\nStarting containers...\n'),
    ).not.toThrow();
    observer.close();
    expect(writeProgressStderr).toHaveBeenCalledTimes(2);
  });
});

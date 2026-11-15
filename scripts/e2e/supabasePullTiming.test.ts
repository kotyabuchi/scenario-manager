import { afterEach, describe, expect, it, vi } from 'vitest';

import { writeProgressStderr } from './progressStderr';
import {
  createSupabasePullTiming,
  supabasePullTimingSchema,
} from './supabasePullTiming';

vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const readSummary = () => {
  const line = vi.mocked(writeProgressStderr).mock.calls[0]?.[0] ?? '';
  return supabasePullTimingSchema.parse(
    JSON.parse(line.replace('[supabase-pull-timing] ', '')),
  );
};

describe('pull表示の限定観測', () => {
  it('状態ごとのlayer数と更新の観測区間を集計し並行区間を加算しない', () => {
    const timing = createSupabasePullTiming();
    timing.observeLine('postgres Pulling', 10);
    timing.observeLine('aaaaaaaaaaaa Downloading [=> ] 1MB/4MB', 20);
    timing.observeLine('bbbbbbbbbbbb Downloading 2MB/4MB', 21);
    timing.observeLine('aaaaaaaaaaaa Downloading 3MB/4MB', 30);
    timing.observeLine('aaaaaaaaaaaa Download complete', 40);
    timing.observeLine('aaaaaaaaaaaa Extracting 1MB/4MB', 35);
    timing.observeLine('aaaaaaaaaaaa Extracting 4MB/4MB', 45);
    timing.observeLine('aaaaaaaaaaaa Pull complete', 50);
    timing.observeLine('postgres Pulled', 60);
    expect(writeProgressStderr).not.toHaveBeenCalled();
    timing.close();
    timing.close();
    timing.observeLine('kong Pulling', 70);
    expect(writeProgressStderr).toHaveBeenCalledTimes(1);
    const summary = readSummary();
    expect(summary.measurement).toBe('observed-windows-only');
    expect(summary.imageLayerAttribution).toBe('unavailable');
    expect(summary.contexts[0]?.layers).toContainEqual({
      state: 'Downloading',
      count: 2,
      firstObservedMs: 20,
      lastObservedMs: 30,
    });
    expect(summary.contexts[0]?.layers).toContainEqual({
      state: 'Extracting',
      count: 1,
      firstObservedMs: 35,
      lastObservedMs: 45,
    });
    expect(JSON.stringify(summary)).not.toMatch(
      /aaaaaaaaaaaa|bbbbbbbbbbbb|duration|totalMs/,
    );
  });

  it('database前後と表示形式を跨ぐ同じIDを別に数え欠落した開始を示す', () => {
    const timing = createSupabasePullTiming();
    timing.observeLine('aaaaaaaaaaaa Download complete', 10);
    timing.observeLine('aaaaaaaaaaaa Pull complete', 20);
    timing.observeLine('Starting database...', 30);
    timing.observeLine('aaaaaaaaaaaa Download complete', 40);
    timing.observeLine('aaaaaaaaaaaa: Download complete', 50);
    timing.observeLine('aaaaaaaaaaaa: Pull complete', 60);
    timing.close();
    const summary = readSummary();
    expect(
      summary.contexts.map(({ format, phase }) => [format, phase]),
    ).toEqual([
      ['compose', 'before-database'],
      ['compose', 'after-database'],
      ['fallback', 'after-database'],
    ]);
    for (const context of summary.contexts) {
      expect(context.downloadStartMissing).toBe(true);
      expect(
        context.layers.find(({ state }) => state === 'Download complete')
          ?.count,
      ).toBe(1);
      expect(context.layers.some(({ state }) => state === 'Downloading')).toBe(
        false,
      );
    }
    expect(summary.contexts[2]?.extractStartMissing).toBe(true);
  });

  it('実際のCompose map keyと短いimage名、fallbackの固定retryだけ公開する', () => {
    const timing = createSupabasePullTiming();
    for (const line of [
      'db Skipped - Image is already present locally',
      'gateway Skipped - Image is already present locally',
      'api Skipped - Image is already present locally',
      'auth Skipped - Image is already present locally',
      'storage Skipped - Image is already present locally',
    ])
      timing.observeLine(line, 10);
    timing.observeLine('Starting database...', 20);
    timing.observeLine('17.6.1.063: Pulling from supabase/postgres', 30);
    timing.observeLine(
      'Retrying after 4s: public.ecr.aws/supabase/postgres:17.6.1.063',
      40,
    );
    timing.observeLine('Retrying after 8s: supabase/kong:2.8.1', 50);
    timing.observeLine('Retrying after 999999s: supabase/kong:private', 60);
    timing.observeLine('Retrying after 4s: private.example/secret:v1', 60);
    timing.close();
    const summary = readSummary();
    expect(summary.contexts[0]?.images.map(({ role }) => role)).toEqual([
      'postgres',
      'kong',
      'postgrest',
      'gotrue',
      'storage-api',
    ]);
    expect(summary.contexts[1]?.images.map(({ stage }) => stage)).toEqual([
      'Pulling',
      'retry-4s',
      'retry-8s',
    ]);
    expect(JSON.stringify(summary)).not.toMatch(
      /17\.6|private|999999|public\.ecr/,
    );
  });

  it('未知行・巨大行・secret混在を捨てエラー本文は固定分類へ縮約する', () => {
    const timing = createSupabasePullTiming();
    for (const line of [
      'secret=postgres Pulling',
      'unknown Pulling',
      'aaaaaaaaaaaa Downloading secret=abc',
      'postgres Pulled secret=abc',
      `${'x'.repeat(100_000)}postgres Pulling`,
    ]) {
      expect(timing.matchesLine(line)).toBe(false);
      timing.observeLine(line, 10);
    }
    timing.observeLine(
      'postgres Error unauthorized secret=private https://user:password@example.test',
      20,
    );
    timing.observeLine('kong Error toomanyrequests: secret', 30);
    timing.observeLine('postgrest Error connection timeout secret', 40);
    timing.observeLine('gotrue Error unknown secret', 50);
    timing.close();
    const summary = readSummary();
    expect(summary.contexts[0]?.failures).toEqual([
      { kind: 'registry-auth', count: 1 },
      { kind: 'rate-limit', count: 1 },
      { kind: 'network', count: 1 },
      { kind: 'other', count: 1 },
    ]);
    expect(JSON.stringify(summary)).not.toMatch(
      /secret|private|password|example|https|aaaaaaaaaaaa/,
    );
  });

  it('layer保持上限以降を捨て既知layerの更新と固定長の出力を維持する', () => {
    const timing = createSupabasePullTiming();
    for (let index = 0; index < 1100; index++)
      timing.observeLine(
        `${index.toString(16).padStart(12, '0')} Downloading 1MB/2MB`,
        index,
      );
    timing.observeLine('000000000000 Download complete', 1200);
    timing.close();
    const summary = readSummary();
    expect(summary.layerLimitReached).toBe(true);
    expect(summary.contexts[0]?.layers[0]?.count).toBe(1024);
    expect(summary.contexts[0]?.layers[1]?.count).toBe(1);
    expect(JSON.stringify(summary).length).toBeLessThan(2000);
  });

  it('不正な時計と未観測からゼロ時間を作らず出力例外を隔離する', () => {
    const timing = createSupabasePullTiming();
    for (const elapsed of [NaN, Infinity, -1])
      timing.observeLine('postgres Pulling', elapsed);
    timing.observeLine('Starting database...', 10);
    timing.close();
    expect(writeProgressStderr).not.toHaveBeenCalled();
    const failing = createSupabasePullTiming();
    failing.observeLine('postgres Pulling', 20);
    vi.mocked(writeProgressStderr).mockImplementationOnce(() => {
      throw new Error('private');
    });
    expect(() => failing.close()).not.toThrow();
    failing.close();
    expect(writeProgressStderr).toHaveBeenCalledTimes(1);
  });
});

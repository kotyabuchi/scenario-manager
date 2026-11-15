import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { createHostPressureTiming } from './hostPressureTiming';
import { writeProgressStderr } from './progressStderr';

vi.mock('./environmentCommands', () => ({ runLocalCommand: vi.fn() }));
vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));

const snapshot = (
  fields = ['10', '20', '30', '40', '50', '60', '70', '80'],
  ids = ['0', '1'],
  some = '100',
  full = '40',
) => JSON.stringify({ cpu: { fields, ids }, io: { some, full } });
const options = (signal = new AbortController().signal) => ({
  root: '/workspace',
  cwd: '/private',
  env: process.env,
  signal,
  platform: 'linux' as const,
});
const summary = () =>
  JSON.parse(
    vi
      .mocked(writeProgressStderr)
      .mock.calls[0]?.[0].replace('[supabase-host-pressure] ', '') ?? '{}',
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('E2E_CLI_TIMING', '1');
  vi.stubEnv('GITHUB_ACTIONS', 'false');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('host pressureの所有された限定観測', () => {
  it('2回のreadをstartと実closeで挟み差分だけ公開する', async () => {
    vi.mocked(runLocalCommand)
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(
        snapshot(
          ['11', '22', '33', '44', '55', '66', '77', '88'],
          ['0', '1'],
          '125',
          '47',
        ),
      );
    const timing = createHostPressureTiming(options());
    await timing.prepare();
    timing.start();
    timing.onClose();
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    await timing.finish();
    expect(vi.mocked(runLocalCommand)).toHaveBeenCalledTimes(2);
    expect(summary()).toMatchObject({
      status: 'observed',
      cpuTicks: [1, 2, 3, 4, 5, 6, 7, 8],
      ioSomeUs: 25,
      ioFullUs: 7,
      startMs: 0,
    });
    expect(JSON.stringify(summary())).not.toMatch(
      /workspace|private|\/proc|ids|percent/,
    );
    await timing.finish();
    expect(writeProgressStderr).toHaveBeenCalledTimes(1);
  });

  it.each([
    'reset',
    'topology',
    'io-missing',
    'invalid',
  ] as const)('%sは0へ変換せず部分欠測にする', async (fault) => {
    let second = snapshot();
    if (fault === 'reset')
      second = snapshot(['9', '20', '30', '40', '50', '60', '70', '80']);
    if (fault === 'topology') second = snapshot(undefined, ['0', '2']);
    if (fault === 'io-missing')
      second = JSON.stringify({ cpu: null, io: { some: null, full: null } });
    if (fault === 'invalid') second = '{private-sentinel';
    vi.mocked(runLocalCommand)
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(second);
    const timing = createHostPressureTiming(options());
    await timing.prepare();
    timing.start();
    timing.onClose();
    await timing.finish();
    expect(summary().status).toBe('partial');
    expect(summary().cpuTicks).toBeNull();
    expect(JSON.stringify(summary())).not.toContain('private-sentinel');
  });

  it('close未確認とpre-abortはpostを起動せずunknownとする', async () => {
    vi.mocked(runLocalCommand).mockResolvedValueOnce(snapshot());
    const timing = createHostPressureTiming(options());
    await timing.prepare();
    timing.start();
    await timing.finish();
    expect(summary()).toMatchObject({
      status: 'unknown',
      cpuTicks: null,
      ioSomeUs: null,
    });
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    const controller = new AbortController();
    controller.abort();
    const aborted = createHostPressureTiming(options(controller.signal));
    await aborted.prepare();
    aborted.start();
    aborted.onClose();
    await aborted.finish();
    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it('安全整数を超える差と PSI reset は unknown にする', async () => {
    vi.mocked(runLocalCommand)
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(
        snapshot(
          ['9007199254741002', '20', '30', '40', '50', '60', '70', '80'],
          ['0', '1'],
          '99',
          '40',
        ),
      );
    const timing = createHostPressureTiming(options());
    await timing.prepare();
    timing.start();
    timing.onClose();
    await timing.finish();
    expect(summary()).toMatchObject({
      status: 'partial',
      cpuTicks: null,
      ioSomeUs: null,
      ioFullUs: 0,
    });
  });

  it('無効または非Linuxではreaderや出力を起動しない', async () => {
    vi.stubEnv('E2E_CLI_TIMING', '0');
    const disabled = createHostPressureTiming(options());
    await disabled.prepare();
    disabled.start();
    disabled.onClose();
    await disabled.finish();
    vi.stubEnv('E2E_CLI_TIMING', '1');
    const windows = createHostPressureTiming({
      ...options(),
      platform: 'win32',
    });
    await windows.prepare();
    windows.start();
    windows.onClose();
    await windows.finish();
    expect(runLocalCommand).not.toHaveBeenCalled();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('deadlineは終了要求のみでcloseが返るまでreadを待つ', async () => {
    vi.useFakeTimers();
    let finish: ((value: string) => void) | undefined;
    let observed: AbortSignal | undefined;
    vi.mocked(runLocalCommand).mockImplementationOnce((_tool, _args, input) => {
      observed = input.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const timing = createHostPressureTiming(options());
    let settled = false;
    const pending = timing.prepare().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(observed?.aborted).toBe(true);
    expect(settled).toBe(false);
    if (!finish) throw new Error('reader fixture不足');
    finish(snapshot());
    await pending;
    timing.start();
    await timing.finish();
    expect(summary().before.status).toBe('timeout');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('親の中断を所有readerに伝え、closeまで待ち公開値を限定する', async () => {
    const controller = new AbortController();
    let finish: ((value: string) => void) | undefined;
    let childSignal: AbortSignal | undefined;
    vi.mocked(runLocalCommand).mockImplementationOnce((_tool, _args, input) => {
      childSignal = input.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const timing = createHostPressureTiming(options(controller.signal));
    const pending = timing.prepare();
    controller.abort();
    expect(childSignal?.aborted).toBe(true);
    if (!finish) throw new Error('reader fixture不足');
    finish(snapshot());
    await pending;
    timing.start();
    await timing.finish();
    expect(summary().before.status).toBe('cancelled');
    expect(summary().cpuTicks).toBeNull();
  });
});

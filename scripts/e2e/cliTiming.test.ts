import { afterEach, describe, expect, it, vi } from 'vitest';

import { measureCliStep } from './cliTiming';
import { writeProgressStderr } from './progressStderr';

vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe('CLI事前検査と所有環境の計時', () => {
  it('壁時計によらず単調時計の差分を丸めて出力する', async () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(123.2)
      .mockReturnValueOnce(166.8);
    vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('wall clock must not be read');
    });
    await measureCliStep('environment-start', async () => 'ok');
    expect(writeProgressStderr).toHaveBeenCalledWith(
      '[cli-timing] {"operation":"environment-start","elapsedMs":44,"outcome":"completed"}\n',
    );
  });

  it.each([
    true,
    false,
  ])('時計の診断失敗で本来の成功と例外を変えない: %s', async (shouldFail) => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    vi.spyOn(performance, 'now').mockImplementation(() => {
      throw new Error('private-clock-failure');
    });
    const failure = new Error('original');
    const operation = measureCliStep('environment-release', async () => {
      if (shouldFail) throw failure;
      return 'ok';
    });
    if (shouldFail) await expect(operation).rejects.toBe(failure);
    else await expect(operation).resolves.toBe('ok');
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });

  it('成功値を変えず固定項目だけを出力する', async () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    const secret = { password: 'private-value' };
    expect(await measureCliStep('supabase-version', async () => secret)).toBe(
      secret,
    );
    const output = vi.mocked(writeProgressStderr).mock.calls[0]?.[0] ?? '';
    const data = JSON.parse(output.replace('[cli-timing] ', ''));
    expect(data).toEqual({
      operation: 'supabase-version',
      elapsedMs: expect.any(Number),
      outcome: 'completed',
    });
    expect(data.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(output).not.toContain('private-value');
  });

  it('失敗を記録しても元の例外と本文の非公開を維持する', async () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    const failure = new Error('private-command-output');
    await expect(
      measureCliStep('docker-info', async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    const output = vi.mocked(writeProgressStderr).mock.calls[0]?.[0] ?? '';
    expect(output).toContain('"outcome":"failed"');
    expect(output).not.toContain(failure.message);
  });

  it('診断出力の例外で成功も失敗も上書きしない', async () => {
    vi.stubEnv('E2E_CLI_TIMING', '1');
    vi.mocked(writeProgressStderr).mockImplementation(() => {
      throw new Error('sink failure');
    });
    expect(await measureCliStep('git-head', async () => 'ok')).toBe('ok');
    const failure = new Error('original');
    await expect(
      measureCliStep('git-head', async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
  });

  it('通常のローカル実行では追加ログを出さない', async () => {
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('E2E_CLI_TIMING', '0');
    await measureCliStep('git-common-dir', async () => 'ok');
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });
});

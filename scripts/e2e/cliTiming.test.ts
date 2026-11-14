import { afterEach, describe, expect, it, vi } from 'vitest';

import { measureCliStep } from './cliTiming';
import { writeProgressStderr } from './progressStderr';

vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe('CLI事前検査の計時', () => {
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

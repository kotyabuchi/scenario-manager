import { afterEach, describe, expect, it, vi } from 'vitest';

import { runSupabaseCliCheck } from './checkSupabaseCli';
import { writeProgressStderr } from './progressStderr';
import { verifySupabaseCli } from './supabaseCli';

import { resolve } from 'node:path';

vi.mock('./supabaseCli', () => ({
  SUPABASE_CLI_VERSION: '2.75.0',
  verifySupabaseCli: vi.fn(),
}));
vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe('固定CLI確認の単独入口', () => {
  it.each([
    ['relative'],
    [resolve('bin'), 'unexpected'],
  ])('不正な引数ではCLIを起動しない: %j', async (...args) => {
    expect(await runSupabaseCliCheck(args)).toBe(false);
    expect(verifySupabaseCli).not.toHaveBeenCalled();
  });

  it('指定展開先だけをPATHにし資格情報を渡さない', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.stubEnv('SUPABASE_ACCESS_TOKEN', 'private-token');
    const directory = resolve('verified-bin');
    expect(await runSupabaseCliCheck([directory])).toBe(true);
    const env = vi.mocked(verifySupabaseCli).mock.calls[0]?.[0];
    expect(env?.PATH).toBe(directory);
    expect(
      Object.keys(env ?? {}).filter((key) => key.toUpperCase() === 'PATH'),
    ).toEqual(['PATH']);
    expect(env).not.toHaveProperty('SUPABASE_ACCESS_TOKEN');
    expect(stdout).toHaveBeenCalledWith(
      '{"status":"passed","cliVersion":"2.75.0"}\n',
    );
  });

  it('失敗を成功出力へ変換せず例外本文を公開しない', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.mocked(verifySupabaseCli).mockRejectedValueOnce(
      new Error('private-command-body'),
    );
    const initial = process.listenerCount('SIGTERM');
    expect(await runSupabaseCliCheck([])).toBe(false);
    expect(stdout).not.toHaveBeenCalled();
    expect(writeProgressStderr).toHaveBeenCalledWith(
      '固定版Supabase CLIの検査に失敗しました。\n',
    );
    expect(process.listenerCount('SIGTERM')).toBe(initial);
  });

  it('中断signalをhelperへ転送しlistenerを解放する', async () => {
    const initial = process.listenerCount('SIGTERM');
    vi.mocked(verifySupabaseCli).mockImplementationOnce(
      async (_env, signal) => {
        process.listeners('SIGTERM').at(-1)?.('SIGTERM');
        expect(signal?.aborted).toBe(true);
        signal?.throwIfAborted();
      },
    );
    expect(await runSupabaseCliCheck([])).toBe(false);
    expect(process.listenerCount('SIGTERM')).toBe(initial);
  });
});

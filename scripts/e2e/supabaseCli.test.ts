import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environmentManifestSchema } from './environmentSchema';
import {
  SUPABASE_CLI_VERSION,
  seedSupabaseUpdateCache,
  verifySupabaseCli,
} from './supabaseCli';

import { access, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  rm: vi.fn(),
  mkdtemp: vi.fn(),
  lstat: vi.fn(),
}));
vi.mock('./environmentCommands', () => ({ runLocalCommand: mocks.run }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...original,
    rm: mocks.rm,
    mkdtemp: mocks.mkdtemp,
    lstat: mocks.lstat,
  };
});

const actualFs =
  await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
const roots: string[] = [];
const environment = (() => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) Reflect.deleteProperty(env, key);
  env.PATH = 'native-cli-only';
  return env;
})();
const help = `Supabase CLI ${SUPABASE_CLI_VERSION}\n\nUsage:\n`;
const cachePath = (root: string) =>
  join(root, 'supabase', '.temp', 'cli-latest');
const createRoot = async () => {
  const root = await actualFs.mkdtemp(
    join(await realpath(tmpdir()), 'cli-test-'),
  );
  roots.push(root);
  return root;
};
type CommandOptions = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  signal?: AbortSignal;
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.rm.mockImplementation(actualFs.rm);
  mocks.lstat.mockImplementation(actualFs.lstat);
  mocks.mkdtemp.mockImplementation(async (prefix: string) => {
    const root = await actualFs.mkdtemp(prefix);
    roots.push(root);
    return root;
  });
  mocks.run.mockResolvedValue(help);
});

afterEach(async () => {
  for (const root of roots.splice(0))
    await actualFs.rm(root, { recursive: true, force: true });
});

describe('固定Supabase CLIの版確認', () => {
  it('schemaの要求版を使い、独立cwdのcacheでhelpを正常終了まで待つ', async () => {
    expect(SUPABASE_CLI_VERSION).toBe(
      environmentManifestSchema.shape.cliVersion.value,
    );
    const cwdValues: string[] = [];
    mocks.run.mockImplementation(
      async (tool: string, args: string[], options: CommandOptions) => {
        expect(tool).toBe('supabase');
        expect(args).toEqual(['--help']);
        expect(options.env).toBe(environment);
        expect(options.cwd).not.toBe(process.cwd());
        expect(await readFile(cachePath(options.cwd), 'utf8')).toBe(
          `v${SUPABASE_CLI_VERSION}`,
        );
        cwdValues.push(options.cwd);
        return help;
      },
    );
    await verifySupabaseCli(environment);
    await verifySupabaseCli(environment);
    expect(new Set(cwdValues).size).toBe(2);
    for (const cwd of cwdValues) await expect(access(cwd)).rejects.toThrow();
  });

  it.each([
    'Supabase CLI 0.0.0\n',
    '',
    `prefix Supabase CLI ${SUPABASE_CLI_VERSION}\n`,
    `Supabase CLI ${SUPABASE_CLI_VERSION} suffix\n`,
    `\nSupabase CLI ${SUPABASE_CLI_VERSION}\n`,
  ])('誤版・不正先頭行を拒否してcleanupする: %j', async (output) => {
    mocks.run.mockResolvedValue(output);
    await expect(verifySupabaseCli(environment)).rejects.toThrow('が必要です');
    expect(mocks.rm).toHaveBeenCalledOnce();
  });

  it('CRLFのhelpを受け付ける', async () => {
    mocks.run.mockResolvedValue(help.replaceAll('\n', '\r\n'));
    await expect(verifySupabaseCli(environment)).resolves.toBeUndefined();
  });

  it('runnerの正常終了前に成功やcleanupを公開しない', async () => {
    let complete: ((value: string) => void) | undefined;
    mocks.run.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          complete = resolve;
        }),
    );
    const verification = verifySupabaseCli(environment);
    await vi.waitFor(() => expect(mocks.run).toHaveBeenCalledOnce());
    expect(mocks.rm).not.toHaveBeenCalled();
    complete?.(help);
    await verification;
    expect(mocks.rm).toHaveBeenCalledOnce();
  });

  it('runnerが版文字列を得ても失敗なら拒否してcleanupする', async () => {
    mocks.run.mockRejectedValue(new Error('command failed'));
    await expect(verifySupabaseCli(environment)).rejects.toThrow(
      'command failed',
    );
    expect(mocks.rm).toHaveBeenCalledOnce();
  });

  it('実行中のabortを成功にせずcleanupする', async () => {
    const controller = new AbortController();
    mocks.run.mockImplementation(
      async (_tool: string, _args: string[], options: CommandOptions) => {
        expect(options.signal).toBe(controller.signal);
        controller.abort();
        return help;
      },
    );
    await expect(
      verifySupabaseCli(environment, controller.signal),
    ).rejects.toThrow();
    expect(mocks.rm).toHaveBeenCalledOnce();
  });

  it('開始前abortではtemp directoryも作らない', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      verifySupabaseCli(environment, controller.signal),
    ).rejects.toThrow();
    expect(mocks.mkdtemp).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('版確認後のcleanup失敗を成功にしない', async () => {
    mocks.rm.mockRejectedValue(new Error('cleanup failed'));
    await expect(verifySupabaseCli(environment)).rejects.toThrow(
      'cleanup failed',
    );
  });

  it('cleanup中のabortも成功にしない', async () => {
    const controller = new AbortController();
    mocks.rm.mockImplementation(
      async (root: string, options: { recursive: boolean }) => {
        await actualFs.rm(root, options);
        controller.abort();
      },
    );
    await expect(
      verifySupabaseCli(environment, controller.signal),
    ).rejects.toThrow();
  });

  it('生成先が所有prefixの外なら再帰削除しない', async () => {
    const unrelated = await createRoot();
    mocks.mkdtemp.mockResolvedValue(unrelated);
    await expect(verifySupabaseCli(environment)).rejects.toThrow('安全に削除');
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.rm).not.toHaveBeenCalled();
    await expect(access(unrelated)).resolves.toBeUndefined();
  });
});

describe('所有projectの更新cache', () => {
  it('生成済みconfigを保持して新規cacheを作る', async () => {
    const root = await createRoot();
    await mkdir(join(root, 'supabase'));
    const config = join(root, 'supabase', 'config.toml');
    await writeFile(config, 'owned config');
    await seedSupabaseUpdateCache(root);
    expect(await readFile(config, 'utf8')).toBe('owned config');
    expect(await readFile(cachePath(root), 'utf8')).toBe(
      `v${SUPABASE_CLI_VERSION}`,
    );
  });

  it('既存cacheを上書きしない', async () => {
    const root = await createRoot();
    await mkdir(join(root, 'supabase', '.temp'), { recursive: true });
    await writeFile(cachePath(root), 'existing cache');
    await expect(seedSupabaseUpdateCache(root)).rejects.toThrow();
    expect(await readFile(cachePath(root), 'utf8')).toBe('existing cache');
  });

  it.each([
    'supabase',
    'cache',
  ])('%sをsymlinkと判定したら子cacheを作らない', async (kind) => {
    const root = await createRoot();
    const supabase = join(root, 'supabase');
    await mkdir(supabase);
    const directory = kind === 'cache' ? join(supabase, '.temp') : supabase;
    if (kind === 'cache') await mkdir(directory);
    mocks.lstat.mockImplementation(async (path: string) => {
      const status = await actualFs.lstat(path);
      if (path === directory) status.isSymbolicLink = () => true;
      return status;
    });
    await expect(seedSupabaseUpdateCache(root)).rejects.toThrow('不正');
    await expect(access(cachePath(root))).rejects.toThrow();
    if (kind === 'supabase')
      await expect(access(join(supabase, '.temp'))).rejects.toThrow();
  });

  it('cache directoryと同名の通常ファイルを壊さない', async () => {
    const root = await createRoot();
    await writeFile(join(root, 'supabase'), 'existing file');
    await expect(seedSupabaseUpdateCache(root)).rejects.toThrow('不正');
    expect(await readFile(join(root, 'supabase'), 'utf8')).toBe(
      'existing file',
    );
  });
});

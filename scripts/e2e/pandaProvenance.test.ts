import { afterEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { captureInputs } from './fingerprint';
import { snapshotFixture } from './fixtures/selection';
import { listSnapshotFiles, readSnapshotFiles } from './gitSnapshot';
import { provePandaOutputs, readPandaOutputManifest } from './pandaProvenance';

import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, sep } from 'node:path';

vi.mock('./gitSnapshot', () => ({
  listSnapshotFiles: vi.fn(),
  readSnapshotFiles: vi.fn(),
}));
vi.mock('./environmentCommands', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));

const temporaryRoots = new Set<string>();
const hash = (content: string) =>
  createHash('sha256').update(content).digest('hex');
const outputs = [
  ['styled-system/css/generated.mjs', 'export const css = () => "";\n'],
  [
    'styled-system/css/generated.d.ts',
    'export declare const css: () => string;\n',
  ],
] as const;

const ownedRoot = async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'e2e-panda-test-')));
  temporaryRoots.add(root);
  return root;
};

const write = async (root: string, path: string, contents: string | Buffer) => {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents);
};

afterEach(async () => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(
    [...temporaryRoots].map((root) =>
      rm(root, { recursive: true, force: true }),
    ),
  );
  temporaryRoots.clear();
});

const reviewedFiles = async () => {
  const paths = ['panda.config.ts', 'tsconfig.json'];
  for (const entry of await readdir(join(process.cwd(), 'src/styles'), {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || entry.name.endsWith('.stories.tsx')) continue;
    paths.push(
      join(entry.parentPath, entry.name)
        .slice(process.cwd().length + 1)
        .replaceAll(sep, '/'),
    );
  }
  const files = new Map(
    await Promise.all(
      paths.map(
        async (path) => [path, Buffer.from(await readFile(path))] as const,
      ),
    ),
  );
  files.set('package.json', Buffer.from('{}'));
  files.set('pnpm-lock.yaml', Buffer.from("lockfileVersion: '9.0'\n"));
  return files;
};

const writeOutputs = async (directory: string) => {
  for (const [path, contents] of outputs)
    await write(directory, path, contents);
};

const proofFixture = async () => {
  const temporary = await ownedRoot();
  const root = join(temporary, 'worktree');
  const directory = join(temporary, 'replay');
  const files = await reviewedFiles();
  const lock = files.get('pnpm-lock.yaml');
  if (lock === undefined) throw new Error('fixture不足');
  for (const [path, body] of files) await write(root, path, body);
  await writeOutputs(root);
  await write(root, 'node_modules/.pnpm/lock.yaml', lock);
  const pandaModule = 'node_modules/@pandacss/dev';
  await write(root, `${pandaModule}/package.json`, '{"version":"1.8.1"}');
  await write(root, `${pandaModule}/bin.js`, '// fixture only\n');

  vi.mocked(listSnapshotFiles).mockImplementation(() => [...files.keys()]);
  vi.mocked(readSnapshotFiles).mockImplementation(
    (_capture, _revision, paths) =>
      new Map(paths.map((path) => [path, files.get(path)])),
  );
  vi.mocked(runLocalCommand).mockImplementation(
    async (_tool, _args, options) => {
      await writeOutputs(options.cwd);
      return '';
    },
  );
  const input = {
    root,
    directory,
    capture: { snapshot: snapshotFixture([]) },
    inputs: await captureInputs(root),
  };
  return { input, files, pandaModule };
};

describe('Panda生成出力manifest', () => {
  it('拡張子を問わず相対名とraw SHA-256を保持する', async () => {
    const root = await ownedRoot();
    await writeOutputs(root);
    expect(await readPandaOutputManifest(root)).toEqual(
      outputs
        .map(([path, contents]) => ({ path, sha256: hash(contents) }))
        .sort((left, right) =>
          left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
        ),
    );
  });

  it('生成出力に含まれるjunctionやsymlinkを拒否する', async () => {
    const root = await ownedRoot();
    const target = join(root, 'outside');
    await mkdir(target);
    await writeOutputs(root);
    await symlink(
      target,
      join(root, 'styled-system/link'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(readPandaOutputManifest(root)).rejects.toThrow(/link/u);
  });
});

describe('Panda再生成による由来確認', () => {
  it('固定した4版の入力で一致した全出力だけを証明し、秘密やpreloadを渡さない', async () => {
    const { input } = await proofFixture();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture-secret');
    vi.stubEnv('GITHUB_TOKEN', 'fixture-secret');
    vi.stubEnv('NODE_OPTIONS', '--require fixture-untrusted.cjs');
    const result = await provePandaOutputs(input);
    expect(result).toMatchObject({
      status: 'proven',
      reason: 'REPLAY_MATCHED',
      snapshotDigest: input.capture.snapshot.digest,
      inputDigest: input.inputs.digest,
      paths: outputs.map(([path]) => path).sort(),
    });
    expect(runLocalCommand).toHaveBeenCalledOnce();
    const command = vi.mocked(runLocalCommand).mock.calls[0];
    expect(command?.[2].cwd).toBe(input.directory);
    expect(command?.[2].env).toMatchObject({
      CI: '1',
      NO_UPDATE_NOTIFIER: '1',
      TEMP: join(input.directory, '.tmp'),
    });
    expect(command?.[2].env).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
    expect(command?.[2].env).not.toHaveProperty('GITHUB_TOKEN');
    expect(command?.[2].env).not.toHaveProperty('NODE_OPTIONS');
  });

  it.each([
    'missing',
    'extra',
    'modified',
  ] as const)('出力の%sで証明を取り消す', async (mode) => {
    const { input } = await proofFixture();
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, { cwd }) => {
        const [first, second] = outputs;
        await write(
          cwd,
          first[0],
          mode === 'modified' ? `${first[1]}\r\n` : first[1],
        );
        if (mode !== 'missing') await write(cwd, second[0], second[1]);
        if (mode === 'extra')
          await write(cwd, 'styled-system/extra.txt', 'extra');
        return '';
      },
    );
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      reason: 'OUTPUT_MISMATCH',
      paths: [],
    });
  });

  it('同一ファイル集合でもindexの生成入力が異なる場合は評価しない', async () => {
    const { input, files } = await proofFixture();
    vi.mocked(readSnapshotFiles).mockImplementation(
      (_capture, revision, paths) =>
        new Map(
          paths.map((path) => [
            path,
            revision === 'index' && path === 'panda.config.ts'
              ? Buffer.from('// staged config')
              : files.get(path),
          ]),
        ),
    );
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      reason: 'GENERATOR_INPUT_CHANGED',
      paths: [],
    });
    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('4版のbyteが一致しても未審査のconfigは評価しない', async () => {
    const { input, files } = await proofFixture();
    files.set('panda.config.ts', Buffer.from('// changed config'));
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      reason: 'UNREVIEWED_CONFIG',
      paths: [],
    });
    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('codegen失敗の例外本文を保存せず証明を取り消す', async () => {
    const { input } = await proofFixture();
    vi.mocked(runLocalCommand).mockRejectedValue(new Error('fixture-secret'));
    const result = await provePandaOutputs(input);
    expect(result).toMatchObject({
      status: 'unproven',
      reason: 'REPLAY_FAILED',
      paths: [],
    });
    expect(JSON.stringify(result)).not.toContain('fixture-secret');
  });

  it.each([
    'src/unexpected.ts',
    'panda.config.ts',
  ])('再生成側の予期しないwrite %sを拒否する', async (path) => {
    const { input } = await proofFixture();
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, { cwd }) => {
        await writeOutputs(cwd);
        await write(cwd, path, 'unexpected mutation');
        return '';
      },
    );
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      paths: [],
    });
    expect(runLocalCommand).toHaveBeenCalledOnce();
  });

  it('再生成中に実作業ツリーの入力が変化した場合は証明を取り消す', async () => {
    const { input } = await proofFixture();
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, { cwd }) => {
        await writeOutputs(cwd);
        await write(input.root, 'src/changed.ts', 'export const value = 1;');
        return '';
      },
    );
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      paths: [],
    });
    expect(runLocalCommand).toHaveBeenCalledOnce();
  });

  it('installのlockが一致しない場合はcodegenしない', async () => {
    const { input } = await proofFixture();
    await write(input.root, 'node_modules/.pnpm/lock.yaml', 'different lock');
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      paths: [],
    });
    expect(runLocalCommand).not.toHaveBeenCalled();
  });

  it('再生成中にPanda CLI実体が変わった場合は証明を取り消す', async () => {
    const { input, pandaModule } = await proofFixture();
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, { cwd }) => {
        await writeOutputs(cwd);
        await write(input.root, `${pandaModule}/bin.js`, '// changed CLI\n');
        return '';
      },
    );
    expect(await provePandaOutputs(input)).toMatchObject({
      status: 'unproven',
      paths: [],
    });
    expect(runLocalCommand).toHaveBeenCalledOnce();
  });
});

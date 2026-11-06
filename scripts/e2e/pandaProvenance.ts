import { isNil } from 'ramda';
import { z } from 'zod';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import { captureInputs, compareInputs } from './fingerprint';
import { assertInputPath } from './fingerprintPaths';
import { listSnapshotFiles, readSnapshotFiles } from './gitSnapshot';
import { assertPandaReplayTree } from './pandaReplayFiles';

import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import type { InputFingerprint } from './fingerprint';
import type { GitSnapshotCapture } from './gitSnapshot';

const hash = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');
const manifestDigest = (files: { path: string; sha256: string }[]) =>
  hash(
    JSON.stringify(
      [...files].sort((a, b) =>
        a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
      ),
    ),
  );

// この閉包は静的なPanda設定・プリセットのみ。設定変更時は全件へ戻し、再レビュー後に更新する。
const REVIEWED_CONFIG_DIGEST =
  'aac1c4bee4f1ec16e7c5d3fdf0112d3d410203ae0b618caf4ac6b52766bd433f';
const GENERATOR_ROOTS = [
  'panda.config.ts',
  'tsconfig.json',
  'package.json',
  'pnpm-lock.yaml',
];
const revisions = ['base', 'head', 'index', 'working'] as const;
const isConfig = (path: string) =>
  ['panda.config.ts', 'tsconfig.json'].includes(path) ||
  (path.startsWith('src/styles/') && !path.endsWith('.stories.tsx'));
const isGeneratorInput = (path: string) =>
  isConfig(path) ||
  GENERATOR_ROOTS.includes(path) ||
  path.startsWith('patches/') ||
  path === 'pnpm-workspace.yaml';

export const pandaProvenanceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  status: z.enum(['proven', 'unproven']),
  reason: z.enum([
    'REPLAY_MATCHED',
    'GENERATOR_INPUT_CHANGED',
    'UNREVIEWED_CONFIG',
    'REPLAY_FAILED',
    'OUTPUT_MISMATCH',
  ]),
  snapshotDigest: z.string().regex(/^[a-f0-9]{64}$/),
  inputDigest: z.string().regex(/^[a-f0-9]{64}$/),
  generatorDigest: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
  outputDigest: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
  paths: z.array(z.string()),
  toolchain: z.strictObject({
    panda: z.literal('1.8.1'),
    node: z.string(),
    platform: z.string(),
    arch: z.string(),
    installedLockDigest: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    cliDigest: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
  }),
});

/** 所有出力を通常ファイルだけで読み、余分なファイルも照合対象にする。 */
export const readPandaOutputManifest = async (root: string) => {
  const files: { path: string; sha256: string }[] = [];
  const names = new Set<string>();
  const visit = async (path: string) => {
    assertInputPath(path);
    const absolute = join(root, path);
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink())
      throw new Error('生成出力のlinkは許可されません。');
    const key = path.normalize('NFC').toLowerCase();
    if (names.has(key)) throw new Error('生成出力のpathが衝突しています。');
    names.add(key);
    if (stat.isDirectory()) {
      for (const name of (await readdir(absolute)).sort())
        await visit(`${path}/${name}`);
    } else if (stat.isFile()) {
      files.push({ path, sha256: hash(await readFile(absolute)) });
    } else throw new Error('生成出力が通常fileではありません。');
  };
  await visit('styled-system');
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
};

/** 同一のレビュー済み閉包を所有cwdで再生成し、ignored実入力の由来を証明する。 */
export const provePandaOutputs = async (input: {
  root: string;
  directory: string;
  capture: GitSnapshotCapture;
  inputs: InputFingerprint;
  signal?: AbortSignal;
}) => {
  const { root, directory, capture, inputs } = input;
  const proof: z.infer<typeof pandaProvenanceSchema> = {
    schemaVersion: 1,
    status: 'unproven',
    reason: 'GENERATOR_INPUT_CHANGED',
    snapshotDigest: capture.snapshot.digest,
    inputDigest: inputs.digest,
    generatorDigest: null,
    outputDigest: null,
    paths: [],
    toolchain: {
      panda: '1.8.1',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      installedLockDigest: null,
      cliDigest: null,
    },
  };
  const pathSets = revisions.map((revision) =>
    listSnapshotFiles(capture, revision).filter(isGeneratorInput).sort(),
  );
  const paths = pathSets[0] ?? [];
  if (
    GENERATOR_ROOTS.some((path) => !paths.includes(path)) ||
    pathSets.some((set) => JSON.stringify(set) !== JSON.stringify(paths))
  )
    return proof;
  const files: { path: string; body: Buffer; sha256: string }[] = [];
  const captured = revisions.map((revision) =>
    readSnapshotFiles(capture, revision, paths),
  );
  for (const path of paths) {
    const body = captured[0]?.get(path);
    if (isNil(body) || captured.some((files) => !files.get(path)?.equals(body)))
      return proof;
    files.push({ path, body, sha256: hash(body) });
  }
  proof.generatorDigest = manifestDigest(
    files.map(({ path, sha256 }) => ({ path, sha256 })),
  );
  if (
    manifestDigest(
      files
        .filter(({ path }) => isConfig(path))
        .map(({ path, sha256 }) => ({ path, sha256 })),
    ) !== REVIEWED_CONFIG_DIGEST
  ) {
    proof.reason = 'UNREVIEWED_CONFIG';
    return proof;
  }
  proof.reason = 'REPLAY_FAILED';
  try {
    // 依存実体は他のrunnerと同じ固定installを使用する。任意の旧設定・旧依存は実行しない。
    const require = createRequire(join(root, 'package.json'));
    const packagePath = require.resolve('@pandacss/dev/package.json');
    const cli = join(dirname(packagePath), 'bin.js');
    const installedLock = join(root, 'node_modules/.pnpm/lock.yaml');
    const nodeModules = await realpath(join(root, 'node_modules'));
    proof.toolchain.installedLockDigest = hash(await readFile(installedLock));
    proof.toolchain.cliDigest = hash(await readFile(cli));
    if (
      proof.toolchain.installedLockDigest !==
      files.find(({ path }) => path === 'pnpm-lock.yaml')?.sha256
    )
      return proof;
    z.object({ version: z.literal('1.8.1') }).parse(
      JSON.parse(await readFile(packagePath, 'utf8')),
    );
    await mkdir(directory, { recursive: false });
    const physical = await realpath(directory);
    if (physical.toLowerCase() !== resolve(directory).toLowerCase())
      throw new Error('生成cwdが物理pathではありません。');
    for (const { path, body } of files) {
      assertInputPath(path);
      const target = join(directory, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body, { flag: 'wx' });
    }
    await symlink(
      nodeModules,
      join(directory, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const temp = join(directory, '.tmp');
    await mkdir(temp);
    await runLocalCommand(
      'node',
      [
        cli,
        'codegen',
        '--cwd',
        directory,
        '--config',
        'panda.config.ts',
        '--silent',
      ],
      {
        cwd: directory,
        env: {
          ...localCommandEnvironment(process.env),
          CI: '1',
          NO_UPDATE_NOTIFIER: '1',
          TEMP: temp,
          TMP: temp,
          TMPDIR: temp,
        },
        ...(isNil(input.signal) ? {} : { signal: input.signal }),
      },
    );
    const output = await readPandaOutputManifest(directory);
    await assertPandaReplayTree({
      root: directory,
      nodeModules,
      files: [
        ...files.map(({ path, sha256 }) => ({ path, sha256 })),
        ...output,
      ],
    });
    if (
      proof.toolchain.installedLockDigest !==
        hash(await readFile(installedLock)) ||
      proof.toolchain.cliDigest !== hash(await readFile(cli))
    )
      return proof;
    const expected = inputs.files
      .filter(({ path }) => path.startsWith('styled-system/'))
      .map(({ path, sha256 }) => ({ path, sha256 }));
    proof.outputDigest = manifestDigest(output);
    proof.reason = 'OUTPUT_MISMATCH';
    if (output.length === 0 || proof.outputDigest !== manifestDigest(expected))
      return proof;
    const changes = compareInputs(inputs, await captureInputs(root));
    if (Object.values(changes).some((set) => set.length > 0)) return proof;
    proof.status = 'proven';
    proof.reason = 'REPLAY_MATCHED';
    proof.paths = output.map(({ path }) => path);
  } catch {
    // 秘密や例外本文をreceiptへ持ち込まず、通常の全件fallbackに残す。
  }
  return pandaProvenanceSchema.parse(proof);
};

export type PandaProvenance = z.infer<typeof pandaProvenanceSchema>;

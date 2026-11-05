import { isNil } from 'ramda';
import { z } from 'zod';

import {
  integrationCollectionSchema,
  integrationRegistrationSchema,
  integrationRunnerSchema,
} from './integrationSchema';
import { escapeTestPathForGlob, getTestProjects } from './testClassification';

import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TIMEOUT_MS = 30_000;
const ENV_NAMES = new Set([
  'PATH',
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
]);
const collectedSchema = z.strictObject({
  runner: integrationRunnerSchema,
  tests: z.array(integrationRegistrationSchema),
});

/** 新verified一覧だけをDB・test bodyなしで収集し、runner optionsも保持する。 */
export const discoverIntegration = async ({
  root,
  timeoutMs = TIMEOUT_MS,
}: {
  root: string;
  timeoutMs?: number;
}) => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error('正のtimeoutMsが必要です');
  const physicalRoot = await realpath(root);
  const files = getTestProjects(physicalRoot)['integration-verified'];
  if (files.length === 0)
    return integrationCollectionSchema.parse({
      schemaVersion: 1,
      runner: {
        name: 'vitest',
        version: '3.2.4',
        project: 'integration',
        pool: 'threads',
        fileParallelism: false,
        maxWorkers: 1,
        includeTaskLocation: true,
      },
      config: 'vitest.integration.collect.config.ts',
      discovery: {
        schemaVersion: 1,
        profile: 'integration',
        projects: [
          {
            name: 'integration',
            testDir: 'src',
            dependencies: [],
            repeatEach: 1,
          },
        ],
        tests: [],
        errors: [],
      },
      registrations: [],
    });
  const parent = join(physicalRoot, 'test-results', 'discovery');
  await mkdir(parent, { recursive: true });
  if ((await realpath(parent)) !== parent)
    throw new Error('収集結果の保存先が不正です');
  const directory = await mkdtemp(join(parent, 'integration-'));
  for (const name of ['empty-env', 'tmp']) await mkdir(join(directory, name));
  await writeFile(
    join(directory, 'request.json'),
    JSON.stringify({
      root: physicalRoot,
      files: files.map(escapeTestPathForGlob),
    }),
    { flag: 'wx' },
  );
  const env = { ...process.env };
  for (const name of Object.keys(env))
    if (!ENV_NAMES.has(name.toUpperCase())) Reflect.deleteProperty(env, name);
  Object.assign(env, {
    CI: '1',
    NO_COLOR: '1',
    FORCE_COLOR: '0',
    E2E_DISCOVERY_ROOT: physicalRoot,
    E2E_DISCOVERY_DIRECTORY: directory,
    TMP: join(directory, 'tmp'),
    TEMP: join(directory, 'tmp'),
    TMPDIR: join(directory, 'tmp'),
    ESBUILD_WORKER_THREADS: '0',
  });
  const entry = fileURLToPath(
    new URL('./integrationCollectEntry.mjs', import.meta.url),
  );
  let failed = false;
  await new Promise<void>((done) => {
    execFile(
      process.execPath,
      [entry],
      {
        cwd: physicalRoot,
        env,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      },
      (error) => {
        failed = !isNil(error);
        done();
      },
    );
  });
  const markers = [join(directory, 'violations.jsonl')];
  for (const child of await readdir(directory))
    if (/^worker-\d+$/.test(child))
      markers.push(join(directory, child, 'violations.jsonl'));
  for (const marker of markers) {
    const contents = await readFile(marker, 'utf8').catch((error: unknown) => {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return '';
      throw error;
    });
    if (contents.trim()) throw new Error('Vitest収集中の副作用を検出しました');
  }
  if (failed) throw new Error('Vitest収集に失敗しました');
  const collected = collectedSchema.parse(
    JSON.parse(await readFile(join(directory, 'collection.json'), 'utf8')),
  );
  if (
    collected.runner.pool !== 'threads' ||
    collected.runner.fileParallelism !== false ||
    collected.runner.maxWorkers !== 1 ||
    collected.runner.includeTaskLocation !== true
  )
    throw new Error('収集runner設定が不正です');
  if (
    collected.tests.length === 0 ||
    new Set(collected.tests.map(({ testId }) => testId)).size !==
      collected.tests.length
  )
    throw new Error('Vitest登録が空または重複しています');
  for (const test of collected.tests) {
    if (
      !files.includes(test.file) ||
      test.options.mode !== 'run' ||
      test.options.fails ||
      test.options.concurrent ||
      test.options.retry !== 0 ||
      test.options.repeats !== 0
    )
      throw new Error('verified integrationの登録が実行不能です');
  }
  for (const file of files)
    if (!collected.tests.some((test) => test.file === file))
      throw new Error('verified fileの登録が欠落しています');
  return integrationCollectionSchema.parse({
    schemaVersion: 1,
    runner: collected.runner,
    config: 'vitest.integration.collect.config.ts',
    registrations: collected.tests,
    discovery: {
      schemaVersion: 1,
      profile: 'integration',
      projects: [
        {
          name: 'integration',
          testDir: 'src',
          dependencies: [],
          repeatEach: 1,
        },
      ],
      errors: [],
      tests: collected.tests.map((test) => ({
        testId: test.testId,
        file: test.file,
        line: test.line,
        column: test.column,
        titlePath: test.titlePath,
        project: 'integration',
        repeatEachIndex: 0,
        tags: [
          `@case:${test.claim.caseId}`,
          `@variant:${test.claim.variant}`,
          `@binding:${test.claim.binding}`,
        ],
        expectedStatus: 'passed',
        annotations: [],
        isSetup: false,
      })),
    },
  });
};

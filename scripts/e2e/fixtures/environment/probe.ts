import { isNil } from 'ramda';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import { EXPECTED_ENVIRONMENT_CATALOG } from '../../environmentCatalogExpected';
import { runLocalCommand } from '../../environmentCommands';
import { createDockerDriver } from '../../environmentDocker';
import { prepareEnvironmentInputs } from '../../environmentInputs';
import { acquireEnvironmentLock } from '../../environmentLock';

import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

import type { EnvironmentResources } from '../../environmentSchema';

// 各testファイルで登録したmockを共有し、実DockerやCLIを起動せずに診断境界を検証する。
export const empty = (): EnvironmentResources => ({
  containers: [],
  networks: [],
  volumes: [],
});
const config = 'synthetic-config';
export let root = '';
export let workdir = '';
export const probeState = {
  isResourcePresent: false,
  shouldFailStart: false,
  shouldInterruptStart: false,
  version: '2.75.0',
  catalogText: '',
};
let createdAt = '';
let initialSignalCounts = { SIGINT: 0, SIGTERM: 0 };
export const release = vi.fn(async () => {});
export const remove = vi.fn(async (_resources: EnvironmentResources) => {
  probeState.isResourcePresent = false;
  return [];
});
const resourcesFor = (projectId: string): EnvironmentResources => ({
  containers: [
    {
      id: '1'.repeat(64),
      name: `supabase_db_${projectId}`,
      projectLabel: projectId,
      createdAt,
      imageId: `sha256:${'2'.repeat(64)}`,
    },
  ],
  networks: [],
  volumes: [],
});
export const interrupt = (event: 'SIGINT' | 'SIGTERM') => {
  // runner全体へOS signalを送らず、このprobeが登録したhandlerだけを呼ぶ。
  const registered = vi
    .mocked(process.once)
    .mock.calls.findLast(([name]) => name === event);
  if (isNil(registered)) throw new Error('中断handlerが未登録です。');
  registered[1]();
};
export const startCalls = () =>
  vi
    .mocked(runLocalCommand)
    .mock.calls.filter(
      ([tool, args]) => tool === 'supabase' && args[0] === 'start',
    );

beforeEach(async () => {
  vi.clearAllMocks();
  release.mockResolvedValue();
  root = await realpath(await mkdtemp(join(tmpdir(), 'sm-environment-probe-')));
  await mkdir(join(root, '.git'));
  workdir = '';
  probeState.isResourcePresent = false;
  probeState.shouldFailStart = false;
  probeState.shouldInterruptStart = false;
  probeState.version = '2.75.0';
  probeState.catalogText = JSON.stringify(EXPECTED_ENVIRONMENT_CATALOG);
  createdAt = new Date().toISOString();
  initialSignalCounts = {
    SIGINT: process.listenerCount('SIGINT'),
    SIGTERM: process.listenerCount('SIGTERM'),
  };
  vi.spyOn(process, 'once');
  vi.mocked(runLocalCommand).mockImplementation(async (tool, args) => {
    if (tool === 'docker' && args[0] === 'context')
      return 'npipe:////./pipe/docker_engine';
    if (tool === 'docker' && args[0] === 'info') return '28.0.0';
    if (tool === 'supabase' && args[0] === '--help')
      return `Supabase CLI ${probeState.version}\n\nUsage:\n`;
    if (tool === 'git' && args[1] === 'HEAD') return 'a'.repeat(40);
    if (tool === 'git' && args[1] === '--git-common-dir')
      return join(root, '.git');
    if (tool === 'supabase' && args[0] === 'start') {
      probeState.isResourcePresent = true;
      if (probeState.shouldInterruptStart) interrupt('SIGINT');
      if (probeState.shouldFailStart || probeState.shouldInterruptStart)
        throw new Error('synthetic start failure');
      return '';
    }
    if (tool === 'docker' && args[0] === 'exec') return probeState.catalogText;
    throw new Error('想定外のコマンドです。');
  });
  vi.mocked(acquireEnvironmentLock).mockImplementation(async (options) => ({
    registryRoot: options.registryRoot,
    worktreeRoot: options.worktreeRoot,
    projectId: options.projectId,
    ports: options.ports,
    lockFiles: [],
    release,
  }));
  vi.mocked(prepareEnvironmentInputs).mockImplementation(
    async (physicalRoot, options) => {
      workdir = join(
        physicalRoot,
        'test-results',
        'environments',
        `run-${options.runId}`,
      );
      await mkdir(join(workdir, 'supabase'), { recursive: true });
      await writeFile(join(workdir, 'supabase', 'config.toml'), config);
      return {
        workdir,
        projectId: `sm-e2e-${options.runId}`,
        inputHashes: {
          config: createHash('sha256').update(config).digest('hex'),
          migrations: 'b'.repeat(64),
          seed: 'c'.repeat(64),
        },
      };
    },
  );
  vi.mocked(createDockerDriver).mockReturnValue({
    assertFreshProject: vi.fn(async () => {}),
    observe: vi.fn(async (project) =>
      probeState.isResourcePresent ? resourcesFor(project) : empty(),
    ),
    remove,
  });
});

afterEach(async () => {
  expect(process.listenerCount('SIGINT')).toBe(initialSignalCounts.SIGINT);
  expect(process.listenerCount('SIGTERM')).toBe(initialSignalCounts.SIGTERM);
  vi.restoreAllMocks();
  // このtestが作成したtmpの直下directoryだけを削除する。
  const prefix = `${await realpath(tmpdir())}${sep}sm-environment-probe-`;
  if (!resolve(root).startsWith(prefix))
    throw new Error('test cleanup対象が不正です。');
  await rm(root, { recursive: true, force: true });
});

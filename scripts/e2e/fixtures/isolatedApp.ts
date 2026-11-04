import { fixtureContext } from './fixtureApi';

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** 実serverを起動せず、所有manifestと実ファイルのlock証跡を揃える。 */
export const appFixture = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'e2e-isolated-app-')));
  const { connection } = fixtureContext();
  connection.manifest.repoRoot = root;
  connection.manifest.worktreeRoot = root;
  connection.manifest.workdir = join(
    root,
    'test-results',
    'environments',
    `run-${connection.manifest.runId}`,
  );
  connection.lease.worktreeRoot = root;
  const workdir = connection.manifest.workdir;
  mkdirSync(workdir, { recursive: true });
  const registry = join(root, 'registry');
  mkdirSync(registry);
  const hash = (value: string) =>
    createHash('sha256').update(value).digest('hex');
  const reservations = ['port-43100', `worktree-${hash(root)}`];
  const lockFiles = reservations.map((reservation) => {
    const path = join(registry, `${reservation}.lock`);
    const contents = JSON.stringify({
      schemaVersion: 1,
      registryRoot: registry,
      repoKey: root,
      worktreeRoot: root,
      runId: connection.lease.runId,
      ownerNonce: connection.lease.ownerNonce,
      projectId: connection.lease.projectId,
      ports: [55320, 55321, 55322, 43100],
      reservation,
    });
    writeFileSync(path, contents, { flag: 'wx' });
    const stat = statSync(path, { bigint: true });
    return {
      path,
      dev: stat.dev.toString(),
      ino: stat.ino.toString(),
      contentsHash: hash(contents),
    };
  });
  const runtime = { additionalPorts: [43100], lockFiles };
  const runtimePath = join(workdir, 'runtime.json');
  const saveRuntime = () => writeFileSync(runtimePath, JSON.stringify(runtime));
  saveRuntime();
  const nextPackage = join(root, 'node_modules', 'next', 'package.json');
  mkdirSync(dirname(nextPackage), { recursive: true });
  writeFileSync(
    nextPackage,
    JSON.stringify({ name: 'next', version: '16.1.6' }),
  );
  const nextCLI = join(dirname(nextPackage), 'dist', 'bin', 'next');
  mkdirSync(dirname(nextCLI), { recursive: true });
  writeFileSync(nextCLI, '// mockであり実行しない\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module' }));
  const readStatus = (): unknown =>
    JSON.parse(readFileSync(join(workdir, 'app', 'status.json'), 'utf8'));
  return {
    root,
    connection,
    workdir,
    runtime,
    saveRuntime,
    nextCLI,
    nextPackage,
    readStatus,
  };
};

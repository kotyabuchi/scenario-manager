import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCaseActors } from '../../e2e/fixtures/actors';
import { fixtureOwnerTag } from '../../e2e/fixtures/fixtureManifest';
import { withLegacyContext } from '../../e2e/fixtures/legacyContext';
import { fixtureContext, mockFixtureApi } from './fixtures/fixtureApi';

import { existsSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, open: vi.fn(actual.open) };
});
const roots: string[] = [];
afterEach(async () => {
  vi.mocked(open).mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    if (
      !resolve(root).startsWith(
        `${resolve('test-results')}${sep}legacy-writes-`,
      )
    )
      throw new Error('テスト所有外です。');
    await rm(root, { recursive: true, force: true });
  }
});
const setup = async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(join(resolve('test-results'), 'legacy-writes-'));
  roots.push(root);
  const { connection, journal: memory } = fixtureContext(0, 'legacy-suite');
  connection.manifest.repoRoot = root;
  connection.manifest.worktreeRoot = root;
  connection.lease.worktreeRoot = root;
  const workdir = join(
    root,
    'test-results',
    'environments',
    `run-${connection.manifest.runId}`,
  );
  connection.manifest.workdir = workdir;
  await mkdir(workdir, { recursive: true });
  await mkdir(join(root, 'e2e'));
  const owner = {
    ...memory.owner,
    lease: connection.lease,
    project: 'chromium-auth',
  };
  const journal = { ...memory, owner, ownerTag: fixtureOwnerTag(owner) };
  mockFixtureApi();
  const actors = await createCaseActors(connection, journal);
  return {
    connection,
    journal,
    actor: actors['creator-only'],
    state: join(root, 'e2e', '.auth', 'user.json'),
    context: join(workdir, 'legacy-context.private.json'),
  };
};

describe('legacy秘密fileの書込途中失敗', () => {
  it.each([
    ['state', 'partial'],
    ['context', 'partial'],
    ['state', 'sync'],
    ['context', 'sync'],
  ] as const)('%sの%s失敗も新規fileだけを回収しFDを閉じる', async (kind, fault) => {
    const value = await setup();
    const { open: originalOpen } =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    const close = vi.fn();
    const sequence: string[] = [];
    const target = value[kind];
    vi.mocked(open).mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (String(args[0]) !== target) return handle;
      const originalStat = handle.stat.bind(handle);
      vi.spyOn(handle, 'stat').mockImplementation(async (options) => {
        sequence.push('stat');
        return originalStat(options);
      });
      const originalClose = handle.close.bind(handle);
      vi.spyOn(handle, 'close').mockImplementation(async () => {
        close();
        await originalClose();
      });
      if (fault === 'partial')
        vi.spyOn(handle, 'writeFile').mockImplementation(async () => {
          sequence.push('write');
          await handle.write('partial-private-secret');
          throw Object.assign(new Error('private-enospc'), { code: 'ENOSPC' });
        });
      else
        vi.spyOn(handle, 'sync').mockRejectedValue(
          Object.assign(new Error('private-eio'), { code: 'EIO' }),
        );
      return handle;
    });
    const operation = vi.fn(async () => {});
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        operation,
      ),
    ).rejects.toThrow('legacy実行');
    expect(operation).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    expect(existsSync(value.state) || existsSync(value.context)).toBe(false);
    if (fault === 'partial') expect(sequence).toEqual(['stat', 'write']);
  });

  it.each([
    'state',
    'context',
  ] as const)('%sの部分書込失敗中に別inodeへ置換されたfileは削除しない', async (kind) => {
    const value = await setup();
    const { open: originalOpen } =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    const target = value[kind];
    const close = vi.fn();
    vi.mocked(open).mockImplementation(async (...args) => {
      const handle = await originalOpen(...args);
      if (String(args[0]) !== target) return handle;
      const originalClose = handle.close.bind(handle);
      vi.spyOn(handle, 'close').mockImplementation(async () => {
        close();
        await originalClose();
      });
      vi.spyOn(handle, 'writeFile').mockImplementation(async () => {
        await handle.write('partial-private-secret');
        await rename(target, `${target}.original`);
        await writeFile(target, 'external-file', { flag: 'wx' });
        throw new Error('private-write-failure');
      });
      return handle;
    });
    await expect(
      withLegacyContext(
        value.connection,
        value.journal,
        value.actor,
        async () => {},
      ),
    ).rejects.toThrow('後始末');
    expect(close).toHaveBeenCalledOnce();
    expect(await readFile(target, 'utf8')).toBe('external-file');
    expect(await readFile(`${target}.original`, 'utf8')).toBe(
      'partial-private-secret',
    );
    expect(existsSync(kind === 'state' ? value.context : value.state)).toBe(
      false,
    );
  });
});

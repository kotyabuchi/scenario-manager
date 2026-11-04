import { isNil } from 'ramda';
import { afterEach, describe, expect, it } from 'vitest';

import { acquireEnvironmentLock } from './environmentLock';

import { createHash, randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  symlink,
  unlink,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';

import type { Server } from 'node:net';

const roots: string[] = [];
const servers: Server[] = [];
const close = (server: Server) =>
  new Promise<void>((fulfill, reject) => {
    server.close((error) => (isNil(error) ? fulfill() : reject(error)));
  });
const listen = async (host = '0.0.0.0', port = 0) => {
  const server = createServer((socket) => socket.destroy());
  await new Promise<void>((fulfill, reject) => {
    server.once('error', reject);
    server.listen(
      { host, port, ipv6Only: host.includes(':'), exclusive: true },
      () => {
        server.removeListener('error', reject);
        fulfill();
      },
    );
  });
  servers.push(server);
  const address = server.address();
  if (isNil(address) || typeof address === 'string')
    throw new Error('TCP portがありません');
  return { server, port: address.port };
};
const availablePort = async () => {
  const { server, port } = await listen();
  await close(server);
  return port;
};
const fixture = async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(resolve('test-results/environment-lock-'));
  roots.push(root);
  const worktreeRoot = join(root, 'worktree');
  const secondWorktree = join(root, 'second-worktree');
  await mkdir(worktreeRoot);
  await mkdir(secondWorktree);
  return {
    root,
    secondWorktree,
    options: {
      registryRoot: join(root, 'registry'),
      repoKey: 'repository-a',
      worktreeRoot,
      runId: 'run-a',
      ownerNonce: randomUUID(),
      projectId: 'project-a',
      ports: [] as number[],
    },
  };
};
const entries = async (root: string) => (await readdir(root)).sort();
const getFile = (files: { path: string }[], prefix: string) => {
  const found = files.find((file) => file.path.includes(`${prefix}-`));
  if (isNil(found)) throw new Error('lock fixtureがありません');
  return found.path;
};

afterEach(async () => {
  for (const server of servers.splice(0))
    if (server.listening) await close(server);
  for (const root of roots.splice(0)) {
    if (dirname(root) !== resolve('test-results'))
      throw new Error('fixture範囲外です');
    await rm(root, { recursive: true, force: true });
  }
});

describe('acquireEnvironmentLock', () => {
  it('wxでworktree・project・portを予約し、lease証拠を返して二重releaseを安全にする', async () => {
    const { options } = await fixture();
    options.ports = [await availablePort()];
    const lock = await acquireEnvironmentLock(options);
    expect(lock.lockFiles).toHaveLength(3);
    for (const lease of lock.lockFiles) {
      const info = await lstat(lease.path, { bigint: true });
      const contents = await readFile(lease.path, 'utf8');
      expect(lease.dev).toBe(String(info.dev));
      expect(lease.ino).toBe(String(info.ino));
      expect(lease.contentsHash).toBe(
        createHash('sha256').update(contents).digest('hex'),
      );
      expect(JSON.parse(contents)).toMatchObject({
        ownerNonce: options.ownerNonce,
        runId: options.runId,
      });
    }
    // probeは閉じるが、協調runner向けのport file予約はreleaseまで残る。
    const probe = await listen('0.0.0.0', options.ports[0]);
    await close(probe.server);
    await Promise.all([lock.release(), lock.release()]);
    expect(await entries(options.registryRoot)).toEqual([]);
  });

  it('同じworktreeの並行取得はrun/project/nonceが異なっても一方だけ成功する', async () => {
    const { options } = await fixture();
    const results = await Promise.allSettled([
      acquireEnvironmentLock(options),
      acquireEnvironmentLock({
        ...options,
        projectId: 'project-b',
        runId: 'run-b',
        ownerNonce: randomUUID(),
      }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    for (const result of results)
      if (result.status === 'fulfilled') await result.value.release();
    expect(await entries(options.registryRoot)).toEqual([]);
  });

  it('同じnonceによる二重取得でも既存lockを回収・上書きしない', async () => {
    const { options } = await fixture();
    const first = await acquireEnvironmentLock(options);
    const before = await Promise.all(
      first.lockFiles.map((file) => readFile(file.path, 'utf8')),
    );
    await expect(acquireEnvironmentLock(options)).rejects.toThrow(
      '既存lockは削除しません',
    );
    expect(
      await Promise.all(
        first.lockFiles.map((file) => readFile(file.path, 'utf8')),
      ),
    ).toEqual(before);
    await first.release();
  });

  it('別repo/worktreeでも同じprojectを共有できず、途中取得したworktreeだけを解放する', async () => {
    const { options, secondWorktree } = await fixture();
    const first = await acquireEnvironmentLock(options);
    const before = await entries(options.registryRoot);
    await expect(
      acquireEnvironmentLock({
        ...options,
        worktreeRoot: secondWorktree,
        repoKey: 'repository-b',
        ownerNonce: randomUUID(),
      }),
    ).rejects.toThrow('project-');
    expect(await entries(options.registryRoot)).toEqual(before);
    await first.release();
  });

  it('projectが違っても同じportを共有できず、途中取得したlockを片付ける', async () => {
    const { options, secondWorktree } = await fixture();
    options.ports = [await availablePort()];
    const first = await acquireEnvironmentLock(options);
    const before = await entries(options.registryRoot);
    await expect(
      acquireEnvironmentLock({
        ...options,
        worktreeRoot: secondWorktree,
        projectId: 'project-b',
        ownerNonce: randomUUID(),
      }),
    ).rejects.toThrow(`port-${options.ports[0]}`);
    expect(await entries(options.registryRoot)).toEqual(before);
    await first.release();
  });

  it.each([
    [12345, 12345],
    [0],
    [-1],
    [65_536],
    [12.5],
  ])('port %jを拒否する', async (...ports) => {
    const { options } = await fixture();
    await expect(
      acquireEnvironmentLock({ ...options, ports }),
    ).rejects.toThrow();
  });

  it('使用中のIPv4 portをbindで検出し、既存serverは停止せず自分のlockを解放する', async () => {
    const { options } = await fixture();
    const existing = await listen('127.0.0.1');
    await expect(
      acquireEnvironmentLock({ ...options, ports: [existing.port] }),
    ).rejects.toThrow('環境port');
    expect(existing.server.listening).toBe(true);
    expect(await entries(options.registryRoot)).toEqual([]);
  });

  it('IPv6が利用できる環境ではIPv6だけの使用中portも検出する', async (context) => {
    const { options } = await fixture();
    let existing: Awaited<ReturnType<typeof listen>>;
    try {
      existing = await listen('::1');
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        ['EAFNOSUPPORT', 'EADDRNOTAVAIL', 'EPROTONOSUPPORT'].includes(
          String(error.code),
        )
      ) {
        context.skip();
        return;
      }
      throw error;
    }
    await expect(
      acquireEnvironmentLock({ ...options, ports: [existing.port] }),
    ).rejects.toThrow('環境port');
    expect(existing.server.listening).toBe(true);
    expect(await entries(options.registryRoot)).toEqual([]);
  });

  it('port検査の途中失敗でも先にbindしたprobeとすべての自分のlockを閉じる', async () => {
    const { options } = await fixture();
    const ports = [await availablePort(), await availablePort()].sort(
      (a, b) => a - b,
    );
    const first = ports[0];
    const second = ports[1];
    if (isNil(first) || isNil(second) || first === second)
      throw new Error('異なるportが必要です');
    const existing = await listen('127.0.0.1', second);
    await expect(acquireEnvironmentLock({ ...options, ports })).rejects.toThrow(
      '環境port',
    );
    const freed = await listen('0.0.0.0', first);
    await close(freed.server);
    expect(existing.server.listening).toBe(true);
    expect(await entries(options.registryRoot)).toEqual([]);
  });

  it('古いmtimeや存在しないPIDを理由に既存lockを自動回収しない', async () => {
    const { options } = await fixture();
    const first = await acquireEnvironmentLock(options);
    const target = getFile(first.lockFiles, 'worktree');
    const original = await readFile(target, 'utf8');
    const stale = JSON.stringify({
      ...JSON.parse(original),
      pid: 2_147_483_647,
    });
    await writeFile(target, stale);
    await utimes(target, new Date(0), new Date(0));
    await expect(
      acquireEnvironmentLock({ ...options, ownerNonce: randomUUID() }),
    ).rejects.toThrow('既存lock');
    expect(await readFile(target, 'utf8')).toBe(stale);
    await writeFile(target, original);
    await first.release();
  });

  it('nonceが変わったfileは削除せず、他の自分のlockを解放して失敗を返す', async () => {
    const { options } = await fixture();
    const first = await acquireEnvironmentLock(options);
    const target = getFile(first.lockFiles, 'project');
    const changed = JSON.stringify({
      ...JSON.parse(await readFile(target, 'utf8')),
      ownerNonce: randomUUID(),
    });
    await writeFile(target, changed);
    await expect(first.release()).rejects.toThrow(AggregateError);
    expect(await readFile(target, 'utf8')).toBe(changed);
    expect(await entries(options.registryRoot)).toHaveLength(1);
  });

  it('同じnonceと全文でもfileが差し替われば別inodeを削除しない', async () => {
    const { options } = await fixture();
    const first = await acquireEnvironmentLock(options);
    const target = getFile(first.lockFiles, 'project');
    const contents = await readFile(target, 'utf8');
    await rename(target, `${target}.displaced`);
    await writeFile(target, contents);
    await expect(first.release()).rejects.toThrow(AggregateError);
    expect(await readFile(target, 'utf8')).toBe(contents);
  });

  it('release時に消えたlockも成功扱いにしない', async () => {
    const { options } = await fixture();
    const first = await acquireEnvironmentLock(options);
    await unlink(getFile(first.lockFiles, 'project'));
    await expect(first.release()).rejects.toThrow(AggregateError);
    expect(await entries(options.registryRoot)).toEqual([]);
  });

  it('registryとworktreeのsymlink祖先を拒否し外部directoryへ書き込まない', async () => {
    const { root, options, secondWorktree } = await fixture();
    const link = join(root, 'alias');
    await symlink(secondWorktree, link, 'junction');
    await expect(
      acquireEnvironmentLock({
        ...options,
        registryRoot: join(link, 'registry'),
      }),
    ).rejects.toThrow('symlink');
    await expect(
      acquireEnvironmentLock({ ...options, worktreeRoot: link }),
    ).rejects.toThrow('symlink');
    expect(await entries(secondWorktree)).toEqual([]);
  });

  it('lock自体がsymlinkへ差し替わった場合も追跡して削除しない', async () => {
    const { options, secondWorktree } = await fixture();
    const first = await acquireEnvironmentLock(options);
    const target = getFile(first.lockFiles, 'project');
    await unlink(target);
    await symlink(secondWorktree, target, 'junction');
    await writeFile(join(secondWorktree, 'untouched.txt'), 'keep');
    await expect(first.release()).rejects.toThrow(AggregateError);
    expect((await lstat(target)).isSymbolicLink()).toBe(true);
    expect(await readFile(join(secondWorktree, 'untouched.txt'), 'utf8')).toBe(
      'keep',
    );
  });

  it('registry差替えを検出し、同じpathへ作られたdirectory内のfileを削除しない', async () => {
    const { options } = await fixture();
    const first = await acquireEnvironmentLock(options);
    await rename(options.registryRoot, `${options.registryRoot}.displaced`);
    await mkdir(options.registryRoot);
    await writeFile(join(options.registryRoot, 'untouched.txt'), 'keep');
    await expect(first.release()).rejects.toThrow(AggregateError);
    expect(await entries(options.registryRoot)).toEqual(['untouched.txt']);
  });

  it('相対pathと..による逸脱を拒否する', async () => {
    const { options } = await fixture();
    await expect(
      acquireEnvironmentLock({ ...options, registryRoot: 'relative/registry' }),
    ).rejects.toThrow('絶対path');
    await expect(
      acquireEnvironmentLock({
        ...options,
        registryRoot: `${options.registryRoot}/../outside`,
      }),
    ).rejects.toThrow('絶対path');
  });
});

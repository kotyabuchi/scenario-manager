import { isNil } from 'ramda';
import { z } from 'zod';

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, realpath, unlink } from 'node:fs/promises';
import { createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

import type { BigIntStats } from 'node:fs';
import type { Server } from 'node:net';

const text = z.string().min(1);
const optionsSchema = z.strictObject({
  registryRoot: text,
  repoKey: text,
  worktreeRoot: text,
  runId: text,
  ownerNonce: text,
  projectId: text,
  ports: z.array(z.number().int().min(1).max(65_535)),
});
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const hasCode = (error: unknown, code: string) =>
  error instanceof Error && 'code' in error && error.code === code;
const sameFile = (left: BigIntStats, right: BigIntStats) =>
  left.dev === right.dev && left.ino === right.ino;

/** registryとworktreeの各祖先を検査する。親はOS tmpの物理pathを渡す。 */
const plainDirectory = async (input: string, create: boolean) => {
  if (!isAbsolute(input) || input.split(/[\\/]/).includes('..'))
    throw new Error('環境lockのdirectoryは逸脱のない絶対pathが必要です');
  const directory = resolve(input);
  const volume = parse(directory).root;
  if (directory === volume)
    throw new Error('filesystem rootは環境lockに使えません');
  let current = volume;
  for (const segment of relative(volume, directory).split(sep)) {
    current = join(current, segment);
    if (create) {
      try {
        await mkdir(current, { mode: 0o700 });
      } catch (error) {
        if (!hasCode(error, 'EEXIST')) throw error;
      }
    }
    const info = await lstat(current, { bigint: true });
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error(
        `環境lockのdirectoryにsymlinkや通常directory以外は使えません: ${current}`,
      );
  }
  return realpath(directory);
};

const closeServer = (server: Server) =>
  new Promise<void>((fulfill, reject) => {
    server.close((error) => (isNil(error) ? fulfill() : reject(error)));
  });

/** wildcardへ実bindし、loopbackだけで使用中のportも検出する。 */
const bindPort = async (port: number, host: string) => {
  const server = createServer((socket) => socket.destroy());
  try {
    await new Promise<void>((fulfill, reject) => {
      server.once('error', reject);
      server.listen(
        { port, host, exclusive: true, ipv6Only: host.includes(':') },
        () => {
          server.removeListener('error', reject);
          fulfill();
        },
      );
    });
    return server;
  } catch (cause) {
    if (
      host.includes(':') &&
      ['EAFNOSUPPORT', 'EADDRNOTAVAIL', 'EPROTONOSUPPORT'].some((code) =>
        hasCode(cause, code),
      )
    )
      return undefined;
    throw new Error(`環境portを予約できません: ${host}:${port}`, { cause });
  }
};

type AcquiredFile = {
  path: string;
  identity: BigIntStats;
  contents: string;
};

/**
 * 同一OSの協調runner間でworktree・project・portを排他的に予約する。
 * PID/経過時間によるstale回収はしない。releaseは自分の通常fileだけを削除する。
 * port probe後からDocker bindまでの競合、および悪意ある同時filesystem差替えを
 * portableなNode APIだけで完全には防げない。親は起動失敗を扱い、所有resourceの
 * 停止確認後にreleaseする。registryは信頼した物理directoryで共有する。
 */
export const acquireEnvironmentLock = async (
  input: z.input<typeof optionsSchema>,
) => {
  const options = optionsSchema.parse(input);
  if (new Set(options.ports).size !== options.ports.length)
    throw new Error('環境lockに同一portを重複指定できません');
  const worktreeRoot = await plainDirectory(options.worktreeRoot, false);
  const registryRoot = await plainDirectory(options.registryRoot, true);
  const registryIdentity = await lstat(registryRoot, { bigint: true });
  const ports = [...options.ports].sort((left, right) => left - right);
  const metadata = { ...options, registryRoot, worktreeRoot, ports };
  const reservations = [
    `worktree-${hash(worktreeRoot)}`,
    `project-${hash(options.projectId)}`,
    ...ports.map((port) => `port-${port}`),
  ];
  const acquired: AcquiredFile[] = [];
  const assertRegistry = async () => {
    await plainDirectory(registryRoot, false);
    if (
      !sameFile(registryIdentity, await lstat(registryRoot, { bigint: true }))
    )
      throw new Error(
        `環境lockのregistryが差し替わっています: ${registryRoot}`,
      );
  };
  const releaseFiles = async () => {
    const failures: unknown[] = [];
    for (const record of [...acquired].reverse()) {
      try {
        await assertRegistry();
        const verify = (info: BigIntStats) => {
          if (
            !info.isFile() ||
            info.isSymbolicLink() ||
            info.nlink !== BigInt(1) ||
            info.size !== BigInt(Buffer.byteLength(record.contents)) ||
            !sameFile(record.identity, info)
          )
            throw new Error(
              `取得した通常fileと環境lockが一致しません: ${record.path}`,
            );
        };
        verify(await lstat(record.path, { bigint: true }));
        const handle = await open(
          record.path,
          constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
        );
        try {
          verify(await handle.stat({ bigint: true }));
          // 全文一致にはownerNonceも含む。整形差でも所有者変更を推測して許可しない。
          if ((await handle.readFile('utf8')) !== record.contents)
            throw new Error(
              `環境lockのnonceまたは所有記録が一致しません: ${record.path}`,
            );
          verify(await lstat(record.path, { bigint: true }));
          await unlink(record.path);
        } finally {
          await handle.close();
        }
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length)
      throw new AggregateError(
        failures,
        '環境lockの解放に失敗しました。残留lockは自動回収しません',
      );
  };
  try {
    for (const key of reservations) {
      await assertRegistry();
      const path = join(registryRoot, `${key}.lock`);
      const contents = `${JSON.stringify({ schemaVersion: 1, ...metadata, reservation: key })}\n`;
      const handle = await open(path, 'wx', 0o600).catch((cause: unknown) => {
        throw new Error(
          `環境lockを取得できません。既存lockは削除しません: ${path}`,
          { cause },
        );
      });
      try {
        acquired.push({
          path,
          identity: await handle.stat({ bigint: true }),
          contents,
        });
        await handle.writeFile(contents, 'utf8');
      } finally {
        await handle.close();
      }
    }
    // Windowsではwildcardと特定addressのbindが共存するため両方を検査する。
    // 自分のwildcardと衝突しないようprobeごとに閉じ、file予約は最後まで保持する。
    const hosts = new Set(['0.0.0.0', '127.0.0.1', '::', '::1']);
    for (const addresses of Object.values(networkInterfaces()))
      for (const address of addresses ?? [])
        hosts.add(
          address.family === 'IPv6' &&
            address.scopeid &&
            !address.address.includes('%')
            ? `${address.address}%${address.scopeid}`
            : address.address,
        );
    for (const port of ports)
      for (const host of hosts) {
        const server = await bindPort(port, host);
        if (!isNil(server)) await closeServer(server);
      }
  } catch (cause) {
    try {
      await releaseFiles();
    } catch (cleanup) {
      throw new AggregateError(
        [cause, cleanup],
        '環境lockの取得と後片付けに失敗しました',
      );
    }
    throw cause;
  }
  let released: Promise<void> | undefined;
  return {
    registryRoot,
    worktreeRoot,
    projectId: options.projectId,
    ports,
    lockFiles: acquired.map(({ path, identity, contents }) => ({
      path,
      dev: String(identity.dev),
      ino: String(identity.ino),
      contentsHash: hash(contents),
    })),
    release: () => {
      released ??= releaseFiles();
      return released;
    },
  };
};

export type EnvironmentLock = Awaited<
  ReturnType<typeof acquireEnvironmentLock>
>;

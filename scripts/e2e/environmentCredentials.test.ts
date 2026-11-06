import { describe, expect, it, vi } from 'vitest';

import {
  assertFixtureConnection,
  readEnvironmentCredentials,
  writeEnvironmentCredentials,
} from './environmentCredentials';
import { acquireEnvironmentLock } from './environmentLock';
import { probeEnvironment } from './environmentProbe';
import {
  probeState,
  release,
  remove,
  root,
} from './fixtures/environment/probe';

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { FixtureConnection } from './environmentCredentials';
import type { EnvironmentManifest } from './environmentSchema';

vi.mock('./environmentCommands', async (original) => ({
  ...(await original<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));
vi.mock('./environmentDocker', () => ({ createDockerDriver: vi.fn() }));
vi.mock('./environmentInputs', () => ({ prepareEnvironmentInputs: vi.fn() }));
vi.mock('./environmentLock', () => ({ acquireEnvironmentLock: vi.fn() }));

const key = (role: string) =>
  `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
const status = (manifest: EnvironmentManifest) => ({
  API_URL: manifest.apiUrl,
  DB_URL: `postgresql://postgres:synthetic@127.0.0.1:${manifest.database.port}/postgres`,
  ANON_KEY: key('anon'),
  SERVICE_ROLE_KEY: key('service_role'),
  JWT_SECRET: 'do-not-copy-this-field',
});

describe('稼働環境内のoperationと秘密設定', () => {
  it('追加portも同じleaseで予約しoperationのobject変更はcleanupへ混入しない', async () => {
    const report = await probeEnvironment(
      root,
      undefined,
      undefined,
      async (manifest) => {
        expect(acquireEnvironmentLock).toHaveBeenCalledWith(
          expect.objectContaining({
            ports: [27321, 27322, 27320, 57300],
          }),
        );
        expect(
          readFileSync(join(manifest.workdir, 'runtime.json'), 'utf8'),
        ).toContain('57300');
        manifest.resources.containers = [];
        manifest.projectId = 'sm-e2e-000000000000';
      },
      [57300],
    );
    expect(report.passed).toBe(true);
    expect(remove).toHaveBeenCalledWith(
      expect.objectContaining({
        containers: [
          expect.objectContaining({ projectLabel: `sm-e2e-${report.runId}` }),
        ],
      }),
    );
  });
  it('catalog照合後・cleanup前だけoperationを実行し秘密設定を読み取れる', async () => {
    let path = '';
    const operation = vi.fn(
      async (manifest: EnvironmentManifest, signal: AbortSignal) => {
        expect(manifest.state).toBe('running');
        expect(signal.aborted).toBe(false);
        expect(remove).not.toHaveBeenCalled();
        expect(release).not.toHaveBeenCalled();
        path = writeEnvironmentCredentials(
          manifest,
          JSON.stringify(status(manifest)),
        );
        const connection = readEnvironmentCredentials(root, path);
        expect(connection.manifest.runId).toBe(manifest.runId);
        expect(connection.anonKey).toBe(key('anon'));
        expect(connection.serviceRoleKey).toBe(key('service_role'));
        expect(readFileSync(path, 'utf8')).not.toContain(
          'do-not-copy-this-field',
        );
        expect(() => assertFixtureConnection(connection)).not.toThrow();
      },
    );
    const phases: string[] = [];
    const report = await probeEnvironment(
      root,
      undefined,
      ({ phase }) => phases.push(phase),
      operation,
    );
    expect(report.passed).toBe(true);
    expect(operation).toHaveBeenCalledOnce();
    expect(phases.slice(-3)).toEqual(['inspecting', 'working', 'cleanup']);
    expect(release).toHaveBeenCalledOnce();
    expect(() => readEnvironmentCredentials(root, path)).toThrow(
      '秘密設定を読み込めません',
    );
  });

  it('operationの失敗を全体失敗として残し所有資源を片付ける', async () => {
    const report = await probeEnvironment(
      root,
      undefined,
      undefined,
      async () => {
        throw new Error('synthetic-secret-must-not-escape');
      },
    );
    expect(report).toMatchObject({
      passed: false,
      schemaParityPassed: true,
      migrationReplayPassed: true,
      cleanup: { status: 'complete' },
    });
    expect(JSON.stringify(report)).not.toContain('synthetic-secret');
    expect(remove).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });

  it('catalog不一致ならoperationへ進まない', async () => {
    probeState.catalogText = '{}';
    const operation = vi.fn();
    const report = await probeEnvironment(
      root,
      undefined,
      undefined,
      operation,
    );
    expect(report.passed).toBe(false);
    expect(operation).not.toHaveBeenCalled();
  });

  it('operation中の中断を同じsignalへ伝え、resolveされても成功としない', async () => {
    const controller = new AbortController();
    const report = await probeEnvironment(
      root,
      controller.signal,
      undefined,
      async (_manifest, signal) => {
        controller.abort();
        expect(signal.aborted).toBe(true);
      },
    );
    expect(report.passed).toBe(false);
    expect(report.cleanup?.status).toBe('complete');
  });

  it.each([
    { API_URL: 'https://remote.supabase.co' },
    { DB_URL: 'postgresql://postgres:secret@remote.example:27322/postgres' },
    { DB_URL: 'postgresql://postgres:secret@127.0.0.1:54322/postgres' },
    { DB_URL: 'postgresql://postgres:secret@127.0.0.1:27322/other' },
    {
      DB_URL:
        'postgresql://postgres:secret@127.0.0.1:27322/postgres?host=remote',
    },
    { ANON_KEY: key('service_role') },
    { SERVICE_ROLE_KEY: key('anon') },
    { SERVICE_ROLE_KEY: 'invalid-secret' },
  ])('statusの接続先・鍵取り違えを拒否する: %j', async (change) => {
    const report = await probeEnvironment(
      root,
      undefined,
      undefined,
      async (manifest) => {
        expect(() =>
          writeEnvironmentCredentials(
            manifest,
            JSON.stringify({ ...status(manifest), ...change }),
          ),
        ).toThrow('専用環境の秘密設定を作成できません。');
      },
    );
    expect(report.passed).toBe(true);
  });

  it('既存秘密設定を上書きせず、他runのownerへ差し替えられない', async () => {
    const report = await probeEnvironment(
      root,
      undefined,
      undefined,
      async (manifest) => {
        const path = writeEnvironmentCredentials(
          manifest,
          JSON.stringify(status(manifest)),
        );
        expect(() =>
          writeEnvironmentCredentials(
            manifest,
            JSON.stringify(status(manifest)),
          ),
        ).toThrow('秘密設定を作成できません');
        const value = {
          schemaVersion: 1,
          ownerNonce: manifest.ownerNonce,
          apiUrl: manifest.apiUrl,
          anonKey: key('anon'),
          serviceRoleKey: key('service_role'),
        };
        writeFileSync(
          path,
          JSON.stringify({ ...value, runId: '000000000000' }),
        );
        expect(() => readEnvironmentCredentials(root, path)).toThrow(
          '秘密設定を読み込めません',
        );
      },
    );
    expect(report.passed).toBe(true);
  });

  it('接続objectの停止・他lease・remote変更も拒否する', async () => {
    const report = await probeEnvironment(
      root,
      undefined,
      undefined,
      async (manifest) => {
        const path = writeEnvironmentCredentials(
          manifest,
          JSON.stringify(status(manifest)),
        );
        const original = readEnvironmentCredentials(root, path);
        const changes: Array<(connection: FixtureConnection) => void> = [
          (value) => {
            value.manifest.state = 'stopping';
          },
          (value) => {
            value.lease.ownerNonce = '00000000-0000-4000-8000-000000000000';
          },
          (value) => {
            value.manifest.apiUrl = 'https://remote.supabase.co';
          },
          (value) => {
            value.anonKey = key('service_role');
          },
        ];
        for (const change of changes) {
          const value = structuredClone(original);
          change(value);
          expect(() => assertFixtureConnection(value)).toThrow(
            '接続・所有権・鍵を確認できません',
          );
        }
        expect(() =>
          readEnvironmentCredentials(root, join(root, '.env')),
        ).toThrow('秘密設定を読み込めません');
      },
    );
    expect(report.passed).toBe(true);
  });
});

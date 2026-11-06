import { afterEach, describe, expect, it, vi } from 'vitest';

import { fixtureContext } from './fixtures/fixtureApi';
import { isolatedAppEnvironment } from './isolatedApp';

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-next-env-')))
      throw new Error('テスト一時領域以外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('isolated appの環境境界', () => {
  it('親の秘密・remote・NODE_OPTIONS・dotenv値を子envに継承しない', () => {
    const { connection } = fixtureContext();
    const source: NodeJS.ProcessEnv = { ...process.env };
    Object.assign(source, {
      SUPABASE_SERVICE_ROLE_KEY: 'private-key',
      DATABASE_URL: 'postgres://cloud',
      NODE_OPTIONS: '--require dangerous',
      NEXT_PUBLIC_SUPABASE_URL: 'https://cloud',
      AWS_SECRET_ACCESS_KEY: 'cloud-secret',
      GIT_CONFIG_GLOBAL: '/private/config',
      EXPERIMENTAL_FLAG: 'true',
      SCENARIO_E2E_RUN_ID: 'different-run',
    });
    const before = structuredClone(source);
    const env = isolatedAppEnvironment(connection, source);
    expect(source).toEqual(before);
    expect(env).toMatchObject({
      NODE_ENV: 'production',
      __NEXT_PROCESSED_ENV: 'true',
      SCENARIO_E2E_RUN_ID: connection.manifest.runId,
      SCENARIO_E2E_BUILD: '1',
      NEXT_PUBLIC_SUPABASE_URL: connection.manifest.apiUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: connection.anonKey,
    });
    expect(JSON.stringify(env)).not.toMatch(
      /private-key|cloud-secret|dangerous|postgres:\/\/cloud|https:\/\/cloud|different-run/,
    );
    for (const key of [
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'NODE_OPTIONS',
      'AWS_SECRET_ACCESS_KEY',
      'GIT_CONFIG_GLOBAL',
      'EXPERIMENTAL_FLAG',
    ])
      expect(env).not.toHaveProperty(key);
  });

  it('実Next16.1.6のloadEnvConfigで合成.env.production.localの秘密を読み込ませない', () => {
    const { connection } = fixtureContext();
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'e2e-next-env-')));
    roots.push(root);
    // リポジトリの.envには触れず、検証用の値だけを新規tmpへ作る。
    writeFileSync(
      join(root, '.env.production.local'),
      [
        'E2E_ENV_SENTINEL=synthetic',
        'SUPABASE_SERVICE_ROLE_KEY=synthetic-private-value',
        'DATABASE_URL=postgres://synthetic-cloud',
      ].join('\n'),
    );
    const require = createRequire(import.meta.url);
    const packagePath = require.resolve('next/package.json');
    expect(JSON.parse(readFileSync(packagePath, 'utf8'))).toMatchObject({
      version: '16.1.6',
    });
    const nextEnv = createRequire(packagePath).resolve('@next/env');
    const script = `const module = require(process.argv[1]);
      module.loadEnvConfig(process.argv[2], false, {info(){}, error(){}});
      module.loadEnvConfig(process.argv[2], false, {info(){}, error(){}});
      process.stdout.write(JSON.stringify({
        marker: Boolean(process.env.E2E_ENV_SENTINEL),
        admin: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        database: Boolean(process.env.DATABASE_URL)
      }));`;
    const env = isolatedAppEnvironment(connection);
    const inspect = (environment: NodeJS.ProcessEnv): unknown =>
      JSON.parse(
        execFileSync(process.execPath, ['-e', script, nextEnv, root], {
          env: environment,
          cwd: root,
          encoding: 'utf8',
          timeout: 10_000,
          windowsHide: true,
        }),
      );
    expect(inspect(env)).toEqual({
      marker: false,
      admin: false,
      database: false,
    });
    Reflect.deleteProperty(env, '__NEXT_PROCESSED_ENV');
    expect(inspect(env)).toEqual({ marker: true, admin: true, database: true });
  });
});

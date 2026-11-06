import { afterEach, describe, expect, it } from 'vitest';

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'e2e-discovery-guard-'));
  roots.push(root);
  const directory = join(root, 'owned');
  mkdirSync(directory);
  const outside = join(root, 'outside.txt');
  return { root, directory, outside };
};

const run = (
  directory: string,
  source: string,
  mode: 'commonjs' | 'module' = 'module',
  extraEnv: Partial<NodeJS.ProcessEnv> = {},
  entry?: string,
) => {
  const env = { ...process.env };
  const retainedKeys = new Set(['PATH', 'SystemRoot', 'TEMP', 'TMP']);
  for (const key of Object.keys(env)) {
    if (!retainedKeys.has(key)) delete env[key];
  }
  return spawnSync(
    process.execPath,
    [
      '--require',
      resolve('scripts/e2e/discoveryGuard.cjs'),
      ...(entry ? [entry] : [`--input-type=${mode}`, '--eval', source]),
    ],
    {
      cwd: process.cwd(),
      env: { ...env, E2E_DISCOVERY_DIRECTORY: directory, ...extraEnv },
      encoding: 'utf8',
      timeout: 15_000,
    },
  );
};

describe('列挙前の副作用guard', () => {
  it.each([
    'commonjs',
    'module',
  ] as const)('%sの未使用SDK importとdotenv/configを安全に列挙できる', (mode) => {
    const { directory, root } = fixture();
    const dotenv = join(root, '.env');
    writeFileSync(dotenv, 'E2E_GUARD_SECRET=must-not-load\n');
    const source =
      mode === 'commonjs'
        ? "const { createClient } = require('@supabase/supabase-js'); require('dotenv/config');"
        : "import { createClient } from '@supabase/supabase-js'; import 'dotenv/config';";
    const result = run(
      directory,
      `${source} if (typeof createClient !== 'function' || process.env.E2E_GUARD_SECRET) throw new Error('dotenv loaded');`,
      mode,
      { DOTENV_CONFIG_PATH: dotenv },
    );
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(join(directory, 'violations.jsonl'))).toBe(false);
  });

  it('専用directoryのcacheとreportを同期・非同期・atomic renameで保存できる', () => {
    const { directory } = fixture();
    const result = run(
      directory,
      `
      import fs from 'node:fs';
      import { writeFile, rename, open } from 'node:fs/promises';
      import path from 'node:path';
      const root = process.env.E2E_DISCOVERY_DIRECTORY;
      fs.mkdirSync(path.join(root, 'cache'));
      fs.writeFileSync(path.join(root, 'cache/source.js'), 'cache');
      await new Promise((resolve, reject) => fs.writeFile(path.join(root, 'callback.txt'), 'callback', error => error ? reject(error) : resolve()));
      await writeFile(path.join(root, 'report.tmp'), 'report');
      await rename(path.join(root, 'report.tmp'), path.join(root, 'report.json'));
      const handle = await open(path.join(root, 'handle.txt'), 'w');
      await handle.writeFile('handle');
      await handle.close();
    `,
    );
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(directory, 'report.json'), 'utf8')).toBe('report');
    expect(readFileSync(join(directory, 'callback.txt'), 'utf8')).toBe(
      'callback',
    );
    expect(readFileSync(join(directory, 'handle.txt'), 'utf8')).toBe('handle');
  });

  const violations: [string, string, 'commonjs' | 'module'][] = [
    ['fetch', "fetch('https://not-contacted.invalid/secret')", 'module'],
    [
      'HTTP named import',
      "import { get } from 'node:http'; get('http://127.0.0.1:9')",
      'module',
    ],
    [
      'HTTPS CommonJS',
      "require('node:https').request('https://not-contacted.invalid')",
      'commonjs',
    ],
    [
      'TCP',
      "import { Socket } from 'node:net'; new Socket().connect(9, '127.0.0.1')",
      'module',
    ],
    [
      'TLS',
      "import { connect } from 'node:tls'; connect(9, '127.0.0.1')",
      'module',
    ],
    [
      'DNS',
      "import { resolve } from 'node:dns/promises'; await resolve('not-contacted.invalid')",
      'module',
    ],
    [
      'spawn',
      "import { spawn } from 'node:child_process'; spawn(process.execPath, ['--version'])",
      'module',
    ],
    [
      'execSync',
      "require('node:child_process').execSync('echo blocked')",
      'commonjs',
    ],
    [
      'SDK ESM factory',
      "import { createClient } from '@supabase/supabase-js'; createClient('http://127.0.0.1', 'secret')",
      'module',
    ],
    [
      'SDK CJS factory',
      "require('@supabase/supabase-js').createClient('http://127.0.0.1', 'secret')",
      'commonjs',
    ],
    [
      'SDK constructor',
      "import { SupabaseClient } from '@supabase/supabase-js'; new SupabaseClient('http://127.0.0.1', 'secret')",
      'module',
    ],
    [
      'SSR factory',
      "import { createServerClient } from '@supabase/ssr'; createServerClient('http://127.0.0.1', 'secret', {})",
      'module',
    ],
    ['dotenv explicit', "import { config } from 'dotenv'; config()", 'module'],
  ];
  it.each(
    violations,
  )('%sのimport時副作用を先に拒否する', (_name, source, mode) => {
    const { directory } = fixture();
    const result = run(directory, source, mode);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(1);
    const marker = readFileSync(join(directory, 'violations.jsonl'), 'utf8');
    expect(marker).toContain('operation');
    expect(marker).not.toContain('secret');
    expect(marker).not.toContain('not-contacted.invalid');
  });

  it.each([
    'caught-fetch.cjs',
    'caught-fetch.mjs',
    'src/app/(main)/caught-fetch.cjs',
    'src/app/(main)/caught-fetch.mjs',
  ])('%sの違反をcatchしてexit 0でも、値を出さず呼出位置と失敗を保持する', (relativeFile) => {
    const { directory, root } = fixture();
    const file = join(root, relativeFile);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      "try {\n  fetch('https://not-contacted.invalid/secret');\n} catch {}\nprocess.exit(0);\n",
    );
    const result = run(
      directory,
      '',
      'module',
      { E2E_DISCOVERY_ROOT: root },
      file,
    );
    expect(result.status, result.stderr).toBe(1);
    const marker = readFileSync(join(directory, 'violations.jsonl'), 'utf8');
    const entry: unknown = JSON.parse(marker);
    expect(entry).toEqual({
      operation: 'network.fetch',
      location: { file: relativeFile, line: 2, column: 3 },
    });
    expect(marker).not.toContain('secret');
    expect(marker).not.toContain('not-contacted.invalid');
    expect(marker).not.toContain(root);
  });

  it('stack取得が失敗しても違反記録と終了失敗を残す', () => {
    const { directory } = fixture();
    const result = run(
      directory,
      `
      Error.prepareStackTrace = () => { throw new Error('secret formatter'); };
      try { fetch('https://not-contacted.invalid/secret'); } catch {}
      process.exit(0);
    `,
    );
    expect(result.status).toBe(1);
    const entry: unknown = JSON.parse(
      readFileSync(join(directory, 'violations.jsonl'), 'utf8'),
    );
    expect(entry).toEqual({ operation: 'network.fetch', location: null });
  });

  it.each([
    'writeFileSync',
    'writeFile',
    'openSync',
    'renameSync',
  ] as const)('範囲外の%sを拒否して元の内容を変更しない', (operation) => {
    const { directory, outside } = fixture();
    writeFileSync(outside, 'original');
    const operations = {
      writeFileSync: "fs.writeFileSync(outside, 'changed')",
      writeFile: "await fs.promises.writeFile(outside, 'changed')",
      openSync: "fs.openSync(outside, 'w')",
      renameSync: "fs.renameSync(outside, directory + '/moved')",
    };
    const result = run(
      directory,
      `
        import fs from 'node:fs';
        const directory = process.env.E2E_DISCOVERY_DIRECTORY;
        const outside = ${JSON.stringify(outside)};
        ${operations[operation]};
      `,
    );
    expect(result.status, result.stderr).toBe(1);
    expect(readFileSync(outside, 'utf8')).toBe('original');
    expect(existsSync(join(directory, 'violations.jsonl'))).toBe(true);
  });

  it('directory内に置いたjunctionから範囲外へ書き込まない', () => {
    const { directory, root } = fixture();
    const external = join(root, 'external');
    mkdirSync(external);
    symlinkSync(external, join(directory, 'escape'), 'junction');
    const result = run(
      directory,
      `
      import { writeFileSync } from 'node:fs';
      writeFileSync(process.env.E2E_DISCOVERY_DIRECTORY + '/escape/new.txt', 'no');
    `,
    );
    expect(result.status, result.stderr).toBe(1);
    expect(existsSync(join(external, 'new.txt'))).toBe(false);
  });
});

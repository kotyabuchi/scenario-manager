import { afterEach, describe, expect, it } from 'vitest';

import { discoverIntegration } from './discoverIntegration';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const roots: string[] = [];
const fixture = (source: string) => {
  mkdirSync(resolve('test-results'), { recursive: true });
  const root = mkdtempSync(resolve('test-results/integration-collection-'));
  roots.push(root);
  for (const directory of ['src', 'scripts/e2e'])
    mkdirSync(join(root, directory), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  writeFileSync(join(root, 'src/sample.integration.test.ts'), source);
  writeFileSync(
    join(root, 'scripts/e2e/db-test-files.json'),
    JSON.stringify({
      schemaVersion: 1,
      files: [],
      mockedFiles: [],
      verifiedFiles: [
        {
          path: 'src/sample.integration.test.ts',
          reason: '無DBのcollect検証fixture',
        },
      ],
    }),
  );
  return root;
};
const claim =
  "{meta:{ledger:{caseId:'case',variant:'default',binding:'main'}}}";
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (dirname(root) !== resolve('test-results'))
      throw new Error('fixture削除先が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('VitestのDB無しguarded collection', () => {
  it('TS/ループの登録metadataとID/座標を収集し、bodyを実行しない', async () => {
    const root = fixture(`import {test} from 'vitest';
type Row={name:string}; const rows:Row[]=[{name:'one'},{name:'two'}];
for(const row of rows) test(row.name,${claim},()=>{throw Error('body ran')});`);
    const result = await discoverIntegration({ root });
    expect(result.runner.pool).toBe('threads');
    expect(result.discovery.tests).toHaveLength(2);
    expect(new Set(result.registrations.map(({ testId }) => testId)).size).toBe(
      2,
    );
    expect(
      result.registrations.every(
        ({ line, column }) => line === 3 && column > 0,
      ),
    ).toBe(true);
    expect(result.discovery.tests[0]?.tags).toEqual([
      '@case:case',
      '@variant:default',
      '@binding:main',
    ]);
  }, 45_000);

  it.each([
    "import {spawnSync} from 'node:child_process';try{spawnSync(process.execPath,['-e','process.exit(0)'])}catch{};",
    "import {execSync} from 'node:child_process';try{execSync('echo blocked')}catch{};",
    "import {Worker} from 'node:worker_threads';try{new Worker('process.exit(0)',{eval:true})}catch{};",
    "try{await fetch('http://127.0.0.1:9')}catch{};",
    "import {writeFileSync} from 'node:fs';try{writeFileSync('outside.txt','forbidden')}catch{};",
    "import {createClient} from '@supabase/supabase-js';try{createClient('http://127.0.0.1:9','key')}catch{};",
  ])('catchされたimport時副作用も成功にしない: %s', async (effect) => {
    const root = fixture(
      `import {test} from 'vitest';${effect} test('case',${claim},()=>{});`,
    );
    await expect(discoverIntegration({ root })).rejects.toThrow('副作用');
  }, 45_000);

  it.each([
    'skip',
    'todo',
    'fails',
    'concurrent',
  ])('実行不能登録%sを消さず拒否する', async (modifier) => {
    const root = fixture(
      `import {test} from 'vitest';test.${modifier}('case',${claim},()=>{});`,
    );
    await expect(discoverIntegration({ root })).rejects.toThrow('実行不能');
  }, 45_000);

  it('claim欠落をlegacy扱いにせず拒否する', async () => {
    const root = fixture("import {test} from 'vitest';test('case',()=>{});");
    await expect(discoverIntegration({ root })).rejects.toThrow();
  }, 45_000);
});

import { afterEach, describe, expect, it } from 'vitest';

import { createLedgerFixture } from './fixtures/ledger';
import { loadLedger } from './ledger';

import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

const writeLedger = async () => {
  const root = await mkdtemp(join(tmpdir(), 'e2e-ledger-'));
  roots.push(root);
  const directory = join(root, 'e2e/ledger');
  await mkdir(join(directory, 'contracts'), { recursive: true });
  await mkdir(join(directory, 'scenarios'));
  const ledger = createLedgerFixture();
  const files = {
    'profiles.json': ledger.profiles,
    'fixtures.json': ledger.fixtures,
    'contracts/test.json': ledger.contracts,
    'scenarios/test.json': ledger.scenarios,
    'execution-groups.json': ledger.executionGroups,
    'exceptions.json': ledger.exceptions,
  };
  await Promise.all(
    Object.entries(files).map(([file, value]) =>
      writeFile(join(directory, file), JSON.stringify(value)),
    ),
  );
  return { root, directory, ledger };
};

describe('loadLedger', () => {
  it('JSONを変更せずに読み込み、同じ意味の台帳を返す', async () => {
    const { root, directory, ledger } = await writeLedger();
    const before = await readFile(
      join(directory, 'contracts/test.json'),
      'utf8',
    );
    expect(await loadLedger(root)).toEqual(ledger);
    expect(await loadLedger(root)).toEqual(ledger);
    expect(await readFile(join(directory, 'contracts/test.json'), 'utf8')).toBe(
      before,
    );
  });

  it('配列でないcollectionや不正JSONを黙って捨てない', async () => {
    const { root, directory } = await writeLedger();
    const file = join(directory, 'contracts/test.json');
    await writeFile(file, '{}');
    await expect(loadLedger(root)).rejects.toThrow('JSON配列');
    await writeFile(file, '{broken');
    const failure = loadLedger(root);
    await expect(failure).rejects.toThrow(
      'e2e/ledger/contracts/test.json: JSONを解析できません',
    );
    await expect(failure).rejects.toMatchObject({
      cause: expect.any(SyntaxError),
    });
  });

  it('ファイル分割した重複契約も検査する', async () => {
    const { root, directory, ledger } = await writeLedger();
    await writeFile(
      join(directory, 'contracts/duplicate.json'),
      JSON.stringify(ledger.contracts),
    );
    await expect(loadLedger(root)).rejects.toThrow('重複');
  });

  it('必須ファイル欠落を空の台帳として扱わない', async () => {
    const { root, directory } = await writeLedger();
    await rm(join(directory, 'exceptions.json'));
    await expect(loadLedger(root)).rejects.toThrow();
  });

  it('project外へ向くcollectionのjunctionを拒否する', async () => {
    const { root, directory } = await writeLedger();
    const external = await mkdtemp(join(tmpdir(), 'e2e-ledger-external-'));
    roots.push(external);
    await rm(join(directory, 'contracts'), { recursive: true });
    await symlink(external, join(directory, 'contracts'), 'junction');
    await expect(loadLedger(root)).rejects.toThrow('プロジェクト外');
  });
});

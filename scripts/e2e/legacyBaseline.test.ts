import { describe, expect, it } from 'vitest';

import { readVerifiedLegacyBaselines } from './legacyBaseline';

import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SOURCE = resolve(process.cwd(), 'e2e/legacy');
const FILES = {
  legacy: 'legacy-tests.generated.json',
  execution: 'legacy-execution.json',
} as const;

const withBaselines = (verify: (root: string) => void) => {
  const root = mkdtempSync(join(tmpdir(), 'legacy-baseline-'));
  const destination = join(root, 'e2e/legacy');
  mkdirSync(destination, { recursive: true });
  for (const name of Object.values(FILES))
    copyFileSync(join(SOURCE, name), join(destination, name));
  try {
    verify(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const replaceInBaseline = (
  root: string,
  name: string,
  before: string,
  after: string,
) => {
  const path = join(root, 'e2e/legacy', name);
  const original = readFileSync(path, 'utf8');
  if (!original.includes(before))
    throw new Error('test fixtureの置換元がありません。');
  writeFileSync(path, original.replace(before, after));
};

describe('readVerifiedLegacyBaselines', () => {
  it('レビュー済み933の2台帳を通す', () => {
    withBaselines((root) => {
      const result = readVerifiedLegacyBaselines(root);
      expect(result.legacy).toMatchObject({ schemaVersion: 1 });
      expect(result.execution).toMatchObject({ schemaVersion: 1 });
    });
  });

  it('単一台帳のbyte変更を入口で拒否する', () => {
    withBaselines((root) => {
      replaceInBaseline(
        root,
        FILES.legacy,
        '"expectedStatus": "passed"',
        '"expectedStatus": "skipped"',
      );
      expect(() => readVerifiedLegacyBaselines(root)).toThrow(
        '登録台帳が固定元と一致しません',
      );
    });
  });

  it('specと2台帳を同時更新しても入口で拒否する', () => {
    withBaselines((root) => {
      const spec = join(root, 'e2e/guest-prompt.spec.ts');
      writeFileSync(spec, "test.skip('変更したspec', () => {})\n");
      replaceInBaseline(
        root,
        FILES.legacy,
        '"expectedStatus": "passed"',
        '"expectedStatus": "skipped"',
      );
      replaceInBaseline(
        root,
        FILES.execution,
        '"disposition": "local"',
        '"disposition": "existing-skip"',
      );
      expect(() => readVerifiedLegacyBaselines(root)).toThrow(
        '固定元と一致しません',
      );
    });
  });

  it('期待除外を増やすexecutionだけの変更も拒否する', () => {
    withBaselines((root) => {
      replaceInBaseline(
        root,
        FILES.execution,
        '"disposition": "local"',
        '"disposition": "deferred-live"',
      );
      expect(() => readVerifiedLegacyBaselines(root)).toThrow(
        '実行先台帳が固定元と一致しません',
      );
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { legacyKey, legacyManifestSchema } from './legacy';
import { assertLegacySources, captureLegacySources } from './legacySourceGuard';

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, realpathSync: vi.fn(actual.realpathSync) };
});

const legacy = legacyManifestSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-tests.generated.json', 'utf8')),
);
const roots: string[] = [];
const setup = () => {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), 'legacy-source-guard-')),
  );
  roots.push(root);
  const files = [
    ...new Set(
      legacy.tests
        .filter((entry) => entry.profile === 'app')
        .map((entry) => entry.file),
    ),
  ];
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(
      join(root, file),
      `// ${file}\r\ntest('original', () => {})\r\n`,
    );
  }
  return { root, files, manifest: structuredClone(legacy) };
};

afterEach(() => {
  const temporaryRoot = realpathSync(tmpdir());
  for (const root of roots.splice(0)) {
    if (
      dirname(root) !== temporaryRoot ||
      !root.includes('legacy-source-guard-')
    )
      throw new Error('テスト所有外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('旧app specの実bytes差替え検査', () => {
  it('348登録の25specを重複なく安定順で実読し、保存済fingerprintを流用しない', () => {
    const value = setup();
    const snapshot = captureLegacySources(value.root, value.manifest);
    expect(snapshot.files).toHaveLength(25);
    expect(snapshot.files.map((entry) => entry.file)).toEqual(
      [...value.files].sort(),
    );
    for (const entry of snapshot.files)
      expect(entry.sha256).toBe(
        createHash('sha256')
          .update(readFileSync(join(value.root, entry.file)))
          .digest('hex'),
      );
    expect(snapshot).toEqual(captureLegacySources(value.root, value.manifest));
    expect(() => assertLegacySources(value.root, snapshot)).not.toThrow();
    expect(Object.isFrozen(snapshot.files)).toBe(true);
  });

  it('discovery後に同じtitleの本文を変えた場合も拒否する', () => {
    const value = setup();
    const snapshot = captureLegacySources(value.root, value.manifest);
    const first = snapshot.files[0];
    if (!first) throw new Error('spec不足');
    writeFileSync(
      join(value.root, first.file),
      "test('original', () => { expect(true).toBe(true) })",
    );
    expect(() => assertLegacySources(value.root, snapshot)).toThrow('変更');
  });

  it('UTF-8で同じ置換文字になる異なるbytesも区別する', () => {
    const value = setup();
    const file = value.files[0];
    if (!file) throw new Error('spec不足');
    writeFileSync(join(value.root, file), Buffer.from([0x80]));
    const snapshot = captureLegacySources(value.root, value.manifest);
    writeFileSync(join(value.root, file), Buffer.from([0x81]));
    expect(() => assertLegacySources(value.root, snapshot)).toThrow('変更');
  });

  it('capture時の欠落とcapture後の削除を拒否する', () => {
    const value = setup();
    const snapshot = captureLegacySources(value.root, value.manifest);
    const file = value.files[0];
    if (!file) throw new Error('spec不足');
    unlinkSync(join(value.root, file));
    expect(() => captureLegacySources(value.root, value.manifest)).toThrow();
    expect(() => assertLegacySources(value.root, snapshot)).toThrow();
  });

  it.each([
    'e2e/../escape.spec.ts',
    'e2e//empty.spec.ts',
    'e2e/./dot.spec.ts',
    'e2e\\windows.spec.ts',
    'C:/outside.spec.ts',
    'e2e/not-a-spec.ts',
  ])('不正path %sを拒否する', (file) => {
    const value = setup();
    const first = value.manifest.tests[0];
    if (!first) throw new Error('登録不足');
    first.file = file;
    first.key = legacyKey(first.profile, first);
    expect(() => captureLegacySources(value.root, value.manifest)).toThrow();
  });

  it('旧app集合が空の台帳と不正schemaを拒否する', () => {
    const value = setup();
    value.manifest.tests = [];
    expect(() => captureLegacySources(value.root, value.manifest)).toThrow();
    expect(() => captureLegacySources(value.root, {})).toThrow();
  });

  it('同じbytesでもphysical pathが別実体へ変わったら拒否する', () => {
    const value = setup();
    const snapshot = captureLegacySources(value.root, value.manifest);
    const outside = setup();
    // sandboxではjunction作成が禁止されるためrealpathの別実体解決を再現する。
    const inspect = vi.mocked(realpathSync);
    try {
      inspect.mockReturnValueOnce(value.root).mockReturnValueOnce(outside.root);
      expect(() => assertLegacySources(value.root, snapshot)).toThrow(
        'physical',
      );
      inspect.mockReturnValueOnce(value.root).mockReturnValueOnce(outside.root);
      expect(() => captureLegacySources(value.root, value.manifest)).toThrow(
        'physical',
      );
    } finally {
      inspect.mockReset();
    }
  });

  it('別worktreeと重複するsnapshot集合を拒否する', () => {
    const value = setup();
    const snapshot = captureLegacySources(value.root, value.manifest);
    const other = setup();
    expect(() => assertLegacySources(other.root, snapshot)).toThrow('worktree');
    expect(() =>
      assertLegacySources(value.root, {
        ...snapshot,
        files: [...snapshot.files, ...snapshot.files],
      }),
    ).toThrow('重複');
  });
});

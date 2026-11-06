import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

// 933c689:e2e/ledger のGit blob原本をSHA-256化した固定値。
// tests: 9a29135f8462c2b2fe18a9ed1af4c92bbedb56de
// execution: 1ab34977546d88a7e5e3f502ce4eb18e4666cc5b
const BASELINES = {
  legacy: {
    path: 'e2e/legacy/legacy-tests.generated.json',
    sha256: '5749da8e957182fd3546ddd54b6da1b2d1ad02507c2919031094bb6c0532dbe1',
  },
  execution: {
    path: 'e2e/legacy/legacy-execution.json',
    sha256: '5765001d944f979805973537ccd93f8dceeec88041768dd55fcabc363e42ee5b',
  },
} as const;

type LegacyBaselineBytes = { legacy: Buffer; execution: Buffer };

const sha256 = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

const readLegacyFile = (physicalRoot: string, path: string): Buffer => {
  const target = resolve(physicalRoot, path);
  const stat = lstatSync(target);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    realpathSync(target) !== target
  )
    throw new Error('旧suite台帳の物理pathが不正です。');
  return readFileSync(target);
};

/** 現行台帳との自己比較をせず、レビュー済みGit blobのbytesと照合する。 */
export const assertLegacyBaselineBytes = ({
  legacy,
  execution,
}: LegacyBaselineBytes): void => {
  if (sha256(legacy) !== BASELINES.legacy.sha256)
    throw new Error('旧suiteの登録台帳が固定元と一致しません。');
  if (sha256(execution) !== BASELINES.execution.sha256)
    throw new Error('旧suiteの実行先台帳が固定元と一致しません。');
};

/** 旧台帳を一度だけ実読・byte検証してから解析する。 */
export const readVerifiedLegacyBaselines = (root: string) => {
  const physicalRoot = realpathSync(root);
  const bytes = {
    legacy: readLegacyFile(physicalRoot, BASELINES.legacy.path),
    execution: readLegacyFile(physicalRoot, BASELINES.execution.path),
  };
  assertLegacyBaselineBytes(bytes);
  return {
    legacy: JSON.parse(bytes.legacy.toString('utf8')) as unknown,
    execution: JSON.parse(bytes.execution.toString('utf8')) as unknown,
  };
};

const UI_COMPATIBILITY_PATH = 'e2e/legacy/ui-compatibility.json';
const UI_COMPATIBILITY_SHA256 =
  '8499862c2d9f41abae27743f48e0ffcdd1b00d1e57777e5b215e56f97aaa02b8';

/** レビューした旧本文と新本文の対応だけを許可する。 */
export const readVerifiedLegacyUiCompatibility = (root: string): unknown => {
  const bytes = readLegacyFile(realpathSync(root), UI_COMPATIBILITY_PATH);
  if (sha256(bytes) !== UI_COMPATIBILITY_SHA256)
    throw new Error('旧suiteのUI互換対応が固定元と一致しません。');
  return JSON.parse(bytes.toString('utf8')) as unknown;
};

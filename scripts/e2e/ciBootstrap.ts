import { isNil } from 'ramda';

import { assertGitCommit, gitRead } from './gitObjects';
import { parseArtifact } from './ledgerArtifacts';
import { type LegacyManifest, legacyKey, legacyManifestSchema } from './legacy';
import { ARTIFACTS } from './staticGate';
import { readRevisionFile } from './trustedRevision';

import { createHash } from 'node:crypto';

import type { GithubEventPolicy } from './githubEventSchema';

// 初回導入の承認済みHEADだけで使用する、移行前の固定登録証拠。
export const BOOTSTRAP_SMOKE_REVISION =
  '933c68933c82578e54019f5ca924fbaafcd8c08b';
export const BOOTSTRAP_SMOKE_KEY_DIGEST =
  'd4a51789989a4b593eaf118c567b458f8f1754adbf517ec331046b7756eebc5a';
export const LEGACY_SMOKE_FILE = 'e2e/smoke.spec.ts';
const projects = ['chromium', 'mobile-chrome'];
const entriesPerProject = 7;
export const smokeControlAnnotations = new Set([
  'skip',
  'fixme',
  'fail',
  'todo',
  'only',
]);

type CiSmokeReference = {
  kind: 'static-base' | 'approved-bootstrap-origin';
  revision: string;
  isBootstrap: boolean;
  legacy: LegacyManifest;
};

/** 固定fileの全登録をcanonical keyにし、欠落や非実行区分を拒否する。 */
export const legacySmokeKeys = (legacy: LegacyManifest) => {
  const rows = [...legacy.tests, ...legacy.registered, ...legacy.setups].filter(
    ({ file }) => file === LEGACY_SMOKE_FILE,
  );
  const keys = rows.map((row) => legacyKey(row.profile, row)).sort();
  const legacyKeys = new Set(legacy.tests.map(({ key }) => key));
  if (
    rows.length !== projects.length * entriesPerProject ||
    new Set(keys).size !== rows.length ||
    projects.some(
      (project) =>
        rows.filter((row) => row.project === project).length !==
        entriesPerProject,
    ) ||
    rows.some(
      (row) =>
        row.profile !== 'app' ||
        row.key !== legacyKey(row.profile, row) ||
        row.expectedStatus !== 'passed' ||
        row.annotations.some(({ type }) => smokeControlAnnotations.has(type)) ||
        !legacyKeys.has(row.key),
    )
  )
    throw new Error(
      '固定legacy smokeのfile全登録が有効な既存local登録と一致しません。',
    );
  return keys;
};

export const digestLegacySmokeKeys = (keys: readonly string[]) =>
  createHash('sha256')
    .update(`${JSON.stringify(keys)}\n`)
    .digest('hex');

/** 外部承認済み静的検査の初回PRだけ、既知の祖先commitを比較元にできる。 */
export const readCiSmokeReference = (
  root: string,
  policy: Extract<GithubEventPolicy, { event: 'pull_request' }>,
  report: { isBootstrap: boolean },
): CiSmokeReference => {
  const base = policy.staticBase.sha;
  const baseLegacy = readRevisionFile(root, base, ARTIFACTS.legacy);
  const isBaselineMissing = isNil(
    readRevisionFile(root, base, ARTIFACTS.baseline),
  );
  if (
    report.isBootstrap !== isBaselineMissing ||
    isBaselineMissing !== isNil(baseLegacy)
  )
    throw new Error('静的比較元のlegacy smokeを取得できません。');
  if (!isNil(baseLegacy))
    return {
      kind: 'static-base',
      revision: base,
      isBootstrap: false,
      legacy: legacyManifestSchema.parse(
        parseArtifact(baseLegacy, ARTIFACTS.legacy),
      ),
    };
  const revision = assertGitCommit(root, BOOTSTRAP_SMOKE_REVISION);
  gitRead(root, ['merge-base', '--is-ancestor', revision, policy.head]);
  const legacy = legacyManifestSchema.parse(
    parseArtifact(
      readRevisionFile(root, revision, ARTIFACTS.legacy),
      ARTIFACTS.legacy,
    ),
  );
  if (
    digestLegacySmokeKeys(legacySmokeKeys(legacy)) !==
    BOOTSTRAP_SMOKE_KEY_DIGEST
  )
    throw new Error(
      '初回PRの固定legacy smoke originとkey digestが一致しません。',
    );
  return {
    kind: 'approved-bootstrap-origin',
    revision,
    isBootstrap: true,
    legacy,
  };
};

export type { CiSmokeReference };

import { z } from 'zod';

import { serializeBaseline } from './baseline';
import { assertGitCommit, gitRead } from './gitObjects';
import {
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import { SURFACE_RULE_DIGEST } from './surfaceProjection';

import { createHash } from 'node:crypto';

import type { PendingBaseline } from './baseline';
import type { SavedSurfaceState } from './surfaceMigration';

// M3受入済みv1と、そのUI初期移行を導入したコミット。
export const SURFACE_MIGRATION_V1_ORIGIN =
  '8bbfed403163222a566589e56f4c83854219e56f';
export const SURFACE_MIGRATION_INTRODUCTION =
  '36ee35030c757d6492b9ca4283dabf166609f811';

const digest = z.string().regex(/^[a-f0-9]{64}$/u);

export const surfaceMigrationHistoryProofSchema = z.strictObject({
  schemaVersion: z.literal(1),
  observationBaseSha: z.literal(SURFACE_MIGRATION_V1_ORIGIN),
  introductionSha: z.literal(SURFACE_MIGRATION_INTRODUCTION),
  snapshotDigest: digest,
  baselineDigest: digest,
  surfaceMigrationDigest: digest,
  surfacePendingDigest: digest,
});

type SurfaceMigrationHistoryProof = z.infer<
  typeof surfaceMigrationHistoryProofSchema
>;

/** 固定v1・導入・現行HEADの順に祖先関係を検査する。 */
export const assertSurfaceMigrationHistoryAncestry = (
  root: string,
  head: string,
) => {
  const old = assertGitCommit(root, SURFACE_MIGRATION_V1_ORIGIN);
  const introduced = assertGitCommit(root, SURFACE_MIGRATION_INTRODUCTION);
  const current = assertGitCommit(root, head);
  gitRead(root, ['merge-base', '--is-ancestor', old, introduced]);
  gitRead(root, ['merge-base', '--is-ancestor', introduced, current]);
};

/** 再生証跡の成果物digestを導入コミットの保存物と照合する。 */
export const assertSurfaceMigrationHistoryProof = (
  input: unknown,
  introduced: SavedSurfaceState,
  baseline: PendingBaseline,
) => {
  const proof = surfaceMigrationHistoryProofSchema.parse(input);
  const pendingDigest = surfacePendingDigest(introduced.pending);
  if (
    introduced.migration.observationBaseSha !== proof.observationBaseSha ||
    introduced.migration.ruleDigest !== SURFACE_RULE_DIGEST ||
    introduced.migration.newPendingDigest !== pendingDigest ||
    proof.surfacePendingDigest !== pendingDigest ||
    proof.surfaceMigrationDigest !==
      surfaceMigrationDigest(introduced.migration) ||
    proof.baselineDigest !==
      createHash('sha256').update(serializeBaseline(baseline)).digest('hex')
  )
    throw new Error('UI初期移行の履歴証跡と固定導入の成果物が一致しません。');
  return proof;
};

export type { SurfaceMigrationHistoryProof };

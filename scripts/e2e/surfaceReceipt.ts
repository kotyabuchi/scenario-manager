import { isNil } from 'ramda';
import { z } from 'zod';

import { baselineSchema, checkBaseline } from './baseline';
import { verifyGithubPushBootstrapApproval } from './githubEvent';
import { gitShaSchema } from './gitObjects';
import { inventorySchema, inventoryV1Schema } from './inventorySchema';
import { parseArtifact } from './ledgerArtifacts';
import { legacyManifestSchema } from './legacy';
import {
  readSurfaceMigrationHistoryAtRevision,
  readSurfaceStateAtRevision,
} from './surfaceGate';
import {
  checkSurfacePending,
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import {
  assertSurfaceMigrationHistoryProof,
  surfaceMigrationHistoryProofSchema,
} from './surfaceMigrationHistory';
import {
  captureSurfaceMigrationSnapshot,
  resolveSurfaceMigrationOrigin,
} from './surfaceMigrationObservation';
import { surfaceObservationDigest } from './surfacePending';
import { SURFACE_RULE_DIGEST } from './surfaceProjection';
import { readRevisionFile } from './trustedRevision';

import { isDeepStrictEqual } from 'node:util';

import type { InputFingerprint } from './fingerprint';
import type { GithubEventPolicy } from './githubEventSchema';
import type { SurfaceV1Artifacts } from './surfaceMigrationObservation';

const digest = z.string().regex(/^[a-f0-9]{64}$/u);
export const surfaceReceiptSchema = z.strictObject({
  surfacePendingDigest: digest,
  surfaceMigrationDigest: digest,
  observationBaseSha: gitShaSchema,
  surfaceMigrationOrigin: z
    .strictObject({
      kind: z.enum(['static-base', 'approved-bootstrap-origin']),
      staticBaseSha: gitShaSchema,
      observationBaseSha: gitShaSchema,
    })
    .nullable(),
  surfaceMigrationSnapshotDigest: digest.nullable(),
  surfaceMigrationHistory: surfaceMigrationHistoryProofSchema.optional(),
});

type SurfaceReceipt = z.infer<typeof surfaceReceiptSchema>;

/** plannerのVFS再抽出を重ねず、固定Git成果物・承認と静的証跡を独立照合する。 */
export const assertSurfaceReceipt = ({
  root,
  policy,
  report,
  artifacts,
  inputs,
  bootstrapApproval,
}: {
  root: string;
  policy: GithubEventPolicy;
  report: SurfaceReceipt & { base: string; baselineDigest: string };
  artifacts: SurfaceV1Artifacts;
  inputs?: InputFingerprint;
  bootstrapApproval?: string | undefined;
}) => {
  const { head, staticBase } = policy;
  const { base, baselineDigest: coreBaselineDigest } = report;
  const read = (revision: string, path: string) =>
    parseArtifact(readRevisionFile(root, revision, path), path);
  const saved = readSurfaceStateAtRevision(root, head);
  if (isNil(saved)) throw new Error('固定HEADにUI不足と移行履歴がありません。');
  const pendingDigest = surfacePendingDigest(saved.pending);
  if (
    pendingDigest !== report.surfacePendingDigest ||
    surfaceMigrationDigest(saved.migration) !== report.surfaceMigrationDigest ||
    saved.migration.observationBaseSha !== report.observationBaseSha ||
    saved.migration.ruleDigest !== SURFACE_RULE_DIGEST
  )
    throw new Error('CI静的証跡と固定HEADのUI不足・移行記録が一致しません。');
  const current = inventorySchema.parse(read(head, artifacts.inventory));
  const previous = readSurfaceStateAtRevision(root, base);
  if (!isNil(previous)) {
    if (
      !isNil(report.surfaceMigrationOrigin) ||
      !isNil(report.surfaceMigrationSnapshotDigest) ||
      !isNil(report.surfaceMigrationHistory)
    )
      throw new Error('移行済みの比較元をUI初期移行として扱えません。');
    if (base !== head) inventorySchema.parse(read(base, artifacts.inventory));
    if (policy.event === 'push' && staticBase.kind === 'push-bootstrap')
      verifyGithubPushBootstrapApproval(
        {
          event: 'push',
          repository: policy.repository,
          ref: policy.eventRef,
          before: staticBase.before,
          head,
          baselineDigest: coreBaselineDigest,
        },
        bootstrapApproval,
      );
    checkSurfacePending({
      base: previous,
      head: saved,
      current: saved.pending,
    });
    return;
  }

  const revisions = { base, head, eventPolicy: policy };
  const origin = resolveSurfaceMigrationOrigin({
    root,
    revisions,
    artifacts,
    coreBaselineDigest,
    ...(isNil(bootstrapApproval) ? {} : { bootstrapApproval }),
  });
  if (
    !isDeepStrictEqual(origin, report.surfaceMigrationOrigin) ||
    origin.observationBaseSha !== saved.migration.observationBaseSha
  )
    throw new Error('CI初期UI移行の由来が一致しません。');
  if (origin.kind === 'static-base') {
    if (!isNil(report.surfaceMigrationHistory))
      throw new Error('通常のUI初期移行に履歴証跡を指定できません。');
    if (
      saved.migration.newObservationDigest !==
        surfaceObservationDigest(current) ||
      saved.migration.newPendingDigest !== pendingDigest
    )
      throw new Error('CI初期UI移行の現在の観測が一致しません。');
  }
  inventoryV1Schema.parse(read(origin.observationBaseSha, artifacts.inventory));
  legacyManifestSchema.parse(read(origin.observationBaseSha, artifacts.legacy));
  const oldCore = baselineSchema.parse(
    read(origin.observationBaseSha, artifacts.baseline),
  );
  const currentCore = baselineSchema.parse(read(head, artifacts.baseline));
  if (
    checkBaseline({
      base: oldCore,
      head: currentCore,
      current: currentCore.items,
    }).length
  )
    throw new Error('CI初期UI移行の旧core baselineと一致しません。');
  if (origin.kind === 'approved-bootstrap-origin') {
    if (
      isNil(report.surfaceMigrationHistory) ||
      !isNil(report.surfaceMigrationSnapshotDigest)
    )
      throw new Error('CI初期UI移行の履歴証跡がないか、証跡が重複しています。');
    const { introduced, baseline } = readSurfaceMigrationHistoryAtRevision(
      root,
      head,
      artifacts.baseline,
    );
    assertSurfaceMigrationHistoryProof(
      report.surfaceMigrationHistory,
      introduced,
      baseline,
    );
    checkSurfacePending({
      base: introduced,
      head: saved,
      current: saved.pending,
    });
    return;
  }
  if (isNil(inputs) || isNil(report.surfaceMigrationSnapshotDigest))
    throw new Error('CI初期UI移行の固定snapshotがありません。');
  const { snapshot } = captureSurfaceMigrationSnapshot({
    root,
    revisions,
    origin,
    inputs,
  });
  if (snapshot.digest !== report.surfaceMigrationSnapshotDigest)
    throw new Error('CI初期UI移行のGit snapshotが一致しません。');
};

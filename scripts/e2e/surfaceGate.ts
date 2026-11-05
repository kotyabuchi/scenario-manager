import { isNil } from 'ramda';

import { baselineSchema, checkBaseline, serializeBaseline } from './baseline';
import { readSnapshotFile } from './gitSnapshot';
import { serializeInventory } from './inventory';
import { inventorySchema } from './inventorySchema';
import { parseArtifact, readArtifact } from './ledgerArtifacts';
import {
  buildSurfaceMigrationRecord,
  checkSurfaceMigration,
  checkSurfacePending,
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import {
  captureSurfaceMigrationInventories,
  resolveSurfaceMigrationOrigin,
} from './surfaceMigrationObservation';
import {
  surfaceMigrationSchema,
  surfacePendingSchema,
} from './surfaceMigrationSchema';
import {
  buildOldSurfacePending,
  surfaceObservationDigest,
} from './surfacePending';
import { SURFACE_RULE_DIGEST } from './surfaceProjection';
import { readRevisionFile } from './trustedRevision';
import { prepareVerificationDirectory } from './verificationContext';

import { createHash, randomBytes } from 'node:crypto';
import { join } from 'node:path';

import type { PendingBaseline } from './baseline';
import type { Inventory } from './inventorySchema';
import type { SavedSurfaceState } from './surfaceMigration';
import type {
  SurfaceMigrationOrigin,
  SurfaceMigrationRevisions,
  SurfaceV1Artifacts,
} from './surfaceMigrationObservation';
import type { SurfacePending } from './surfaceMigrationSchema';

export const SURFACE_ARTIFACTS = {
  pending: 'e2e/ledger/surface-pending.json',
  migration: 'e2e/ledger/surface-migration.json',
} as const;

type SurfaceState = {
  inventory: Inventory;
  baseline: PendingBaseline;
  surfacePending: SurfacePending;
};

type SurfaceGateInput = {
  root: string;
  state: SurfaceState;
  revisions: SurfaceMigrationRevisions;
  artifacts: SurfaceV1Artifacts;
  bootstrapApproval?: string;
  directory?: string;
  signal?: AbortSignal;
};

const parseSurfaceArtifacts = (
  read: (file: string) => string | undefined,
): SavedSurfaceState => ({
  pending: surfacePendingSchema.parse(
    parseArtifact(read(SURFACE_ARTIFACTS.pending), SURFACE_ARTIFACTS.pending),
  ),
  migration: surfaceMigrationSchema.parse(
    parseArtifact(
      read(SURFACE_ARTIFACTS.migration),
      SURFACE_ARTIFACTS.migration,
    ),
  ),
});

/** 固定revision上のUI不足と移行履歴を読み、片方だけの欠落は拒否する。 */
export const readSurfaceStateAtRevision = (root: string, revision: string) => {
  const pending = readRevisionFile(root, revision, SURFACE_ARTIFACTS.pending);
  const migration = readRevisionFile(
    root,
    revision,
    SURFACE_ARTIFACTS.migration,
  );
  if (isNil(pending) && isNil(migration)) return null;
  return parseSurfaceArtifacts((path) =>
    path === SURFACE_ARTIFACTS.pending ? pending : migration,
  );
};

const migrationReceipt = (
  saved: SavedSurfaceState,
  origin: SurfaceMigrationOrigin | null,
  snapshotDigest: string | null,
) => ({
  surfacePendingDigest: surfacePendingDigest(saved.pending),
  surfaceMigrationDigest: surfaceMigrationDigest(saved.migration),
  observationBaseSha: saved.migration.observationBaseSha,
  surfaceMigrationOrigin: origin,
  surfaceMigrationSnapshotDigest: snapshotDigest,
});

const observeMigration = async (input: SurfaceGateInput) => {
  const { root, artifacts, state } = input;
  const origin = resolveSurfaceMigrationOrigin({
    ...input,
    coreBaselineDigest: createHash('sha256')
      .update(serializeBaseline(state.baseline))
      .digest('hex'),
  });
  const directory =
    input.directory ??
    join(
      prepareVerificationDirectory(root, randomBytes(6).toString('hex')),
      'surface-panda',
    );
  const observed = await captureSurfaceMigrationInventories({
    ...input,
    origin,
    directory,
  });
  if (
    serializeInventory(observed.current) !== serializeInventory(state.inventory)
  )
    throw new Error(
      'UI初期移行の固定inventoryと現在の静的検査が一致しません。',
    );
  const readWorking = (path: string) =>
    readSnapshotFile(observed.capture, 'working', path)?.toString('utf8');
  const head = baselineSchema.parse(
    parseArtifact(readWorking(artifacts.baseline), artifacts.baseline),
  );
  const issues = checkBaseline({
    base: observed.oldCoreBaseline,
    head,
    current: state.baseline.items,
  });
  if (issues.length)
    throw new Error(
      `UI初期移行のcore baselineが一致しません: ${JSON.stringify(issues)}`,
    );
  return {
    origin,
    readWorking,
    snapshotDigest: observed.snapshotDigest,
    expected: {
      observationBaseSha: origin.observationBaseSha,
      ruleDigest: SURFACE_RULE_DIGEST,
      old: {
        observationDigest: surfaceObservationDigest(observed.old),
        pending: buildOldSurfacePending(observed.old, observed.oldLedger),
      },
      current: {
        observationDigest: surfaceObservationDigest(observed.current),
        pending: state.surfacePending,
      },
    },
  };
};

/** 書き込みは行わず、専用更新が保存できる初期移行候補だけを返す。 */
export const prepareSurfaceMigration = async (input: SurfaceGateInput) => {
  if (!isNil(input.revisions.eventPolicy))
    throw new Error(
      'UI初期移行の保存候補は明示baseのローカル更新でのみ作れます。',
    );
  if (!isNil(readSurfaceStateAtRevision(input.root, input.revisions.base)))
    throw new Error('UI初期移行は既に記録されています。');
  const { expected, origin, snapshotDigest } = await observeMigration(input);
  const migration = buildSurfaceMigrationRecord(expected);
  const pending = expected.current.pending;
  return {
    pending,
    migration,
    receipt: migrationReceipt({ pending, migration }, origin, snapshotDigest),
  };
};

/** 初期移行または通常更新のUI不足を静的ゲートで検査する。 */
export const checkSurfaceState = async (input: SurfaceGateInput) => {
  const { root, revisions, artifacts, state } = input;
  const base = readSurfaceStateAtRevision(root, revisions.base);
  if (isNil(base)) {
    const { expected, origin, readWorking, snapshotDigest } =
      await observeMigration(input);
    const saved = parseSurfaceArtifacts(readWorking);
    checkSurfaceMigration({ ...expected, saved });
    return migrationReceipt(saved, origin, snapshotDigest);
  }
  inventorySchema.parse(
    parseArtifact(
      readRevisionFile(root, revisions.base, artifacts.inventory),
      artifacts.inventory,
    ),
  );
  if (base.migration.ruleDigest !== SURFACE_RULE_DIGEST)
    throw new Error('移行時に固定したUI必須化の規則が変わっています。');
  const saved = parseSurfaceArtifacts((path) => readArtifact(root, path));
  checkSurfacePending({ base, head: saved, current: state.surfacePending });
  return migrationReceipt(saved, null, null);
};

type SurfaceGateReceipt = ReturnType<typeof migrationReceipt>;
export type { SurfaceGateReceipt };

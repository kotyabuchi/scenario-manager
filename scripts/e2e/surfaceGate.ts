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
  assertSurfaceMigrationHistoryAncestry,
  assertSurfaceMigrationHistoryProof,
  SURFACE_MIGRATION_INTRODUCTION,
} from './surfaceMigrationHistory';
import {
  captureSurfaceMigrationInventories,
  resolveSurfaceMigrationOrigin,
} from './surfaceMigrationObservation';
import { replaySurfaceMigration } from './surfaceMigrationReplay';
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
import type { SurfaceMigrationHistoryProof } from './surfaceMigrationHistory';
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

/** 導入時の保存物を、現行HEADにつながる固定履歴から読む。 */
export const readSurfaceMigrationHistoryAtRevision = (
  root: string,
  head: string,
  baselinePath: string,
) => {
  assertSurfaceMigrationHistoryAncestry(root, head);
  const introduced = readSurfaceStateAtRevision(
    root,
    SURFACE_MIGRATION_INTRODUCTION,
  );
  if (isNil(introduced))
    throw new Error('固定導入コミットにUI初期移行成果物がありません。');
  const baseline = baselineSchema.parse(
    parseArtifact(
      readRevisionFile(root, SURFACE_MIGRATION_INTRODUCTION, baselinePath),
      baselinePath,
    ),
  );
  return { introduced, baseline };
};

const migrationReceipt = (
  saved: SavedSurfaceState,
  origin: SurfaceMigrationOrigin | null,
  snapshotDigest: string | null,
  surfaceMigrationHistory?: SurfaceMigrationHistoryProof,
) => ({
  surfacePendingDigest: surfacePendingDigest(saved.pending),
  surfaceMigrationDigest: surfaceMigrationDigest(saved.migration),
  observationBaseSha: saved.migration.observationBaseSha,
  surfaceMigrationOrigin: origin,
  surfaceMigrationSnapshotDigest: snapshotDigest,
  ...(isNil(surfaceMigrationHistory) ? {} : { surfaceMigrationHistory }),
});

const resolveMigrationOrigin = (input: SurfaceGateInput) =>
  resolveSurfaceMigrationOrigin({
    ...input,
    coreBaselineDigest: createHash('sha256')
      .update(serializeBaseline(input.state.baseline))
      .digest('hex'),
  });

const migrationDirectory = (input: SurfaceGateInput, name: string) =>
  input.directory ??
  join(
    prepareVerificationDirectory(input.root, randomBytes(6).toString('hex')),
    name,
  );

const assertInitialCoreBaseline = (
  base: PendingBaseline,
  head: PendingBaseline,
  current: PendingBaseline,
) => {
  const issues = checkBaseline({ base, head, current: current.items });
  if (issues.length)
    throw new Error(
      `UI初期移行のcore baselineが一致しません: ${JSON.stringify(issues)}`,
    );
};

const observeMigration = async (
  input: SurfaceGateInput,
  origin: SurfaceMigrationOrigin,
) => {
  const { artifacts, state } = input;
  const observed = await captureSurfaceMigrationInventories({
    ...input,
    origin,
    directory: migrationDirectory(input, 'surface-panda'),
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
  assertInitialCoreBaseline(observed.oldCoreBaseline, head, state.baseline);
  return {
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
  const origin = resolveMigrationOrigin(input);
  const { expected, snapshotDigest } = await observeMigration(input, origin);
  const migration = buildSurfaceMigrationRecord(expected);
  const pending = expected.current.pending;
  return {
    pending,
    migration,
    receipt: migrationReceipt({ pending, migration }, origin, snapshotDigest),
  };
};

const checkHistoricalMigration = async (
  input: SurfaceGateInput,
  origin: SurfaceMigrationOrigin,
) => {
  const { root, revisions, artifacts, state, signal } = input;
  const { introduced, baseline } = readSurfaceMigrationHistoryAtRevision(
    root,
    revisions.head,
    artifacts.baseline,
  );
  const oldCore = baselineSchema.parse(
    parseArtifact(
      readRevisionFile(root, origin.observationBaseSha, artifacts.baseline),
      artifacts.baseline,
    ),
  );
  const currentCore = baselineSchema.parse(
    parseArtifact(readArtifact(root, artifacts.baseline), artifacts.baseline),
  );
  assertInitialCoreBaseline(oldCore, currentCore, state.baseline);

  const saved = parseSurfaceArtifacts((path) => readArtifact(root, path));
  checkSurfacePending({
    base: introduced,
    head: saved,
    current: state.surfacePending,
  });
  const proof = assertSurfaceMigrationHistoryProof(
    await replaySurfaceMigration({
      root,
      directory: migrationDirectory(input, 'surface-history'),
      ...(isNil(signal) ? {} : { signal }),
    }),
    introduced,
    baseline,
  );
  return migrationReceipt(saved, origin, null, proof);
};

/** 初期移行または通常更新のUI不足を静的ゲートで検査する。 */
export const checkSurfaceState = async (input: SurfaceGateInput) => {
  const { root, revisions, artifacts, state } = input;
  const base = readSurfaceStateAtRevision(root, revisions.base);
  if (isNil(base)) {
    const origin = resolveMigrationOrigin(input);
    if (origin.kind === 'approved-bootstrap-origin')
      return checkHistoricalMigration(input, origin);
    const { expected, readWorking, snapshotDigest } = await observeMigration(
      input,
      origin,
    );
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

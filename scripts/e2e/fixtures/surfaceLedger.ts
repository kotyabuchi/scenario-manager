import {
  buildSurfaceMigrationRecord,
  surfaceMigrationDigest,
  surfacePendingDigest,
} from '../surfaceMigration';
import { SURFACE_RULE_DIGEST } from '../surfaceProjection';

import type { SurfaceGateReceipt } from '../surfaceGate';
import type { SurfacePending } from '../surfaceMigrationSchema';

/** 他のゲートを独立に検査するための、UI不足が空の確定済み移行。 */
export const surfaceLedgerFixture = () => {
  const pending: SurfacePending = { schemaVersion: 1, items: [] };
  const observation = { observationDigest: 'a'.repeat(64), pending };
  const migration = buildSurfaceMigrationRecord({
    observationBaseSha: 'a'.repeat(40),
    ruleDigest: SURFACE_RULE_DIGEST,
    old: observation,
    current: observation,
  });
  const receipt: SurfaceGateReceipt = {
    surfacePendingDigest: surfacePendingDigest(pending),
    surfaceMigrationDigest: surfaceMigrationDigest(migration),
    observationBaseSha: migration.observationBaseSha,
    surfaceMigrationOrigin: null,
    surfaceMigrationSnapshotDigest: null,
  };
  return { pending, migration, receipt };
};

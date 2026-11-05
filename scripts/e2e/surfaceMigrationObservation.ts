import { isNil } from 'ramda';

import { baselineSchema } from './baseline';
import { captureInputs, compareInputs } from './fingerprint';
import { verifyGithubPushBootstrapApproval } from './githubEvent';
import { assertGitCommit, gitRead } from './gitObjects';
import { captureGitSnapshot } from './gitSnapshot';
import { projectInventoryV1, serializeInventoryV1 } from './inventory';
import { inventoryV1Schema } from './inventorySchema';
import { parseArtifact } from './ledgerArtifacts';
import { legacyManifestSchema } from './legacy';
import { provePandaOutputs } from './pandaProvenance';
import { buildSnapshotInventories } from './snapshotInventory';
import { isGeneratedLibraryPath } from './sourceFiles';
import { assertOldSurfaceLedger } from './surfaceMigration';
import {
  readRevisionFile,
  readRevisionLedger,
  verifyBootstrapApproval,
} from './trustedRevision';

import type { InputFingerprint } from './fingerprint';
import type { GithubEventPolicy } from './githubEventSchema';

// M3受入済みv1の固定祖先。初回公開時だけ、M1外部承認の検証後に使用する。
export const SURFACE_MIGRATION_V1_ORIGIN =
  '8bbfed403163222a566589e56f4c83854219e56f';

type SurfaceMigrationRevisions = {
  base: string;
  head: string;
  eventPolicy?: GithubEventPolicy;
};

type SurfaceV1Artifacts = {
  inventory: string;
  baseline: string;
  legacy: string;
};

type SurfaceMigrationOrigin = {
  kind: 'static-base' | 'approved-bootstrap-origin';
  staticBaseSha: string;
  observationBaseSha: string;
};

/** 初回公開だけ、既存M1のイベント承認を再検証して固定v1祖先へ進む。 */
export const resolveSurfaceMigrationOrigin = ({
  root,
  revisions,
  artifacts,
  bootstrapApproval,
  coreBaselineDigest,
}: {
  root: string;
  revisions: SurfaceMigrationRevisions;
  artifacts: SurfaceV1Artifacts;
  bootstrapApproval?: string;
  coreBaselineDigest: string;
}): SurfaceMigrationOrigin => {
  const { base, head, eventPolicy } = revisions;
  if (
    eventPolicy &&
    (eventPolicy.head !== head ||
      eventPolicy.staticBase.kind !== 'comparison' ||
      eventPolicy.staticBase.sha !== base)
  )
    throw new Error('UI初期移行には履歴比較のある固定イベントが必要です。');
  const staticBaseSha = assertGitCommit(root, base);
  const v1Artifacts = [
    artifacts.inventory,
    artifacts.baseline,
    artifacts.legacy,
  ];
  const present = v1Artifacts.filter(
    (path) => !isNil(readRevisionFile(root, staticBaseSha, path)),
  ).length;
  if (present === v1Artifacts.length)
    return {
      kind: 'static-base',
      staticBaseSha,
      observationBaseSha: staticBaseSha,
    };
  if (present !== 0)
    throw new Error('UI初期移行の比較元でv1成果物が部分欠落しています。');
  if (eventPolicy?.event === 'pull_request')
    verifyBootstrapApproval(
      { base: staticBaseSha, head, digest: coreBaselineDigest },
      bootstrapApproval,
    );
  else if (eventPolicy?.event === 'push')
    verifyGithubPushBootstrapApproval(
      {
        event: 'push',
        repository: eventPolicy.repository,
        ref: eventPolicy.eventRef,
        before: staticBaseSha,
        head,
        baselineDigest: coreBaselineDigest,
      },
      bootstrapApproval,
    );
  else throw new Error('UI初期移行の静的比較元にv1成果物がありません。');
  const observationBaseSha = assertGitCommit(root, SURFACE_MIGRATION_V1_ORIGIN);
  gitRead(root, ['merge-base', '--is-ancestor', observationBaseSha, head]);
  return {
    kind: 'approved-bootstrap-origin',
    staticBaseSha,
    observationBaseSha,
  };
};

/** 初期移行が観測したGit snapshotを、plannerとCI後段で同じ条件から再取得する。 */
export const captureSurfaceMigrationSnapshot = ({
  root,
  revisions,
  origin,
  inputs,
}: {
  root: string;
  revisions: SurfaceMigrationRevisions;
  origin: SurfaceMigrationOrigin;
  inputs: InputFingerprint;
}) =>
  captureGitSnapshot({
    root,
    base: origin.observationBaseSha,
    expectedHead: revisions.head,
    ...(revisions.eventPolicy
      ? { mode: 'ci' as const, eventBase: origin.staticBaseSha }
      : { mode: 'local' as const }),
    runtimeInputPaths: inputs.files.map(({ path }) => path),
  });

/** 固定VFSと同一extractorで旧・現を観測し、旧coreの保存物とも照合する。 */
export const captureSurfaceMigrationInventories = async ({
  root,
  revisions,
  origin,
  artifacts,
  directory,
  signal,
}: {
  root: string;
  revisions: SurfaceMigrationRevisions;
  origin: SurfaceMigrationOrigin;
  artifacts: SurfaceV1Artifacts;
  directory: string;
  signal?: AbortSignal;
}) => {
  const { observationBaseSha, staticBaseSha } = origin;
  if (staticBaseSha !== revisions.base)
    throw new Error('UI初期移行の静的比較元が一致しません。');
  const oldInventory = inventoryV1Schema.parse(
    parseArtifact(
      readRevisionFile(root, observationBaseSha, artifacts.inventory),
      artifacts.inventory,
    ),
  );
  const oldCoreBaseline = baselineSchema.parse(
    parseArtifact(
      readRevisionFile(root, observationBaseSha, artifacts.baseline),
      artifacts.baseline,
    ),
  );
  legacyManifestSchema.parse(
    parseArtifact(
      readRevisionFile(root, observationBaseSha, artifacts.legacy),
      artifacts.legacy,
    ),
  );
  const oldLedger = await readRevisionLedger(root, observationBaseSha);
  if (isNil(oldLedger)) throw new Error('旧v1の契約台帳がありません。');
  assertOldSurfaceLedger(oldLedger);
  signal?.throwIfAborted();
  const inputs = await captureInputs(root);
  const initial = captureSurfaceMigrationSnapshot({
    root,
    revisions,
    origin,
    inputs,
  });
  if (
    initial.snapshot.reasons.some(
      ({ code }) => code === 'DEPENDENCY_INPUT_CHANGED',
    )
  )
    throw new Error('依存が変わったsnapshotではUI初期移行できません。');
  const unversioned = new Set(
    initial.snapshot.reasons.flatMap(({ code, paths }) =>
      code === 'UNVERSIONED_RUNTIME_INPUT' ? paths : [],
    ),
  );
  if ([...unversioned].some((path) => !isGeneratedLibraryPath(path)))
    throw new Error('未証明の入力があるsnapshotではUI初期移行できません。');
  let provenPaths: string[] = [];
  if (unversioned.size > 0) {
    const proof = await provePandaOutputs({
      root,
      directory,
      capture: initial,
      inputs,
      ...(signal ? { signal } : {}),
    });
    provenPaths = proof.paths.filter((path) => unversioned.has(path));
    if (
      proof.status !== 'proven' ||
      new Set(provenPaths).size !== unversioned.size
    )
      throw new Error('Panda生成物の由来を証明できず、UI初期移行できません。');
  }
  const { base, working } = buildSnapshotInventories(initial, provenPaths);
  if (
    serializeInventoryV1(projectInventoryV1(base)) !==
    serializeInventoryV1(oldInventory)
  )
    throw new Error('旧v1 inventoryと再観測のcoreが一致しません。');
  const after = await captureInputs(root);
  const final = captureSurfaceMigrationSnapshot({
    root,
    revisions,
    origin,
    inputs: after,
  });
  if (
    Object.values(compareInputs(inputs, after)).some(
      (paths) => paths.length > 0,
    ) ||
    initial.snapshot.digest !== final.snapshot.digest
  )
    throw new Error('UI初期移行の観測中に固定入力が変化しました。');
  signal?.throwIfAborted();
  return {
    old: base,
    current: working,
    oldLedger,
    oldCoreBaseline,
    capture: initial,
    snapshotDigest: initial.snapshot.digest,
  };
};

export type {
  SurfaceMigrationOrigin,
  SurfaceMigrationRevisions,
  SurfaceV1Artifacts,
};

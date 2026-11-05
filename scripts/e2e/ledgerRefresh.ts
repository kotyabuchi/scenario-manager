import { isNil } from 'ramda';

import { baselineSchema, checkBaseline, serializeBaseline } from './baseline';
import { captureInputs, compareInputs } from './fingerprint';
import { captureGitSnapshot } from './gitSnapshot';
import { serializeInventory } from './inventory';
import { parseArtifact, readArtifact, writeArtifact } from './ledgerArtifacts';
import { legacyManifestSchema } from './legacy';
import { ARTIFACTS, baselineDigest, collectStaticState } from './staticGate';
import {
  prepareSurfaceMigration,
  readSurfaceStateAtRevision,
  SURFACE_ARTIFACTS,
} from './surfaceGate';
import {
  checkSurfacePending,
  serializeSurfacePending,
} from './surfaceMigration';
import {
  surfaceMigrationSchema,
  surfacePendingSchema,
} from './surfaceMigrationSchema';
import { SURFACE_RULE_DIGEST } from './surfaceProjection';
import { readRevisionFile, resolveRevisions } from './trustedRevision';

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const assertLocalWriter = () => {
  if (process.env.CI || process.env.GITHUB_ACTIONS === 'true')
    throw new Error('CIでは台帳を更新できません。');
};

const readWorkingSurfaceState = (root: string) => {
  const pending = readArtifact(root, SURFACE_ARTIFACTS.pending);
  const migration = readArtifact(root, SURFACE_ARTIFACTS.migration);
  if (isNil(pending) && isNil(migration)) return null;
  return {
    pending: surfacePendingSchema.parse(
      parseArtifact(pending, SURFACE_ARTIFACTS.pending),
    ),
    migration: surfaceMigrationSchema.parse(
      parseArtifact(migration, SURFACE_ARTIFACTS.migration),
    ),
  };
};

const captureWriterState = async (
  root: string,
  revisions: { base: string; head: string },
) => {
  const inputs = await captureInputs(root);
  const { snapshot } = captureGitSnapshot({
    root,
    base: revisions.base,
    expectedHead: revisions.head,
    mode: 'local',
    runtimeInputPaths: inputs.files.map(({ path }) => path),
  });
  return { inputs, snapshotDigest: snapshot.digest };
};

const assertWriterUnchanged = async (
  root: string,
  revisions: { base: string; head: string },
  initial: Awaited<ReturnType<typeof captureWriterState>>,
) => {
  const current = await captureWriterState(root, revisions);
  if (
    current.snapshotDigest !== initial.snapshotDigest ||
    Object.values(compareInputs(initial.inputs, current.inputs)).some(
      (paths) => paths.length > 0,
    )
  )
    throw new Error('台帳の候補生成中に固定入力が変化しました。');
};

/** v2の通常更新では固定HEADの不足だけを引き継ぎ、新規不足を保存しない。 */
export const refreshLedger = async (
  root: string,
  mode: 'bootstrap' | 'update',
) => {
  assertLocalWriter();
  const previous = readArtifact(root, ARTIFACTS.baseline);
  if (mode === 'bootstrap') {
    if (!isNil(previous))
      throw new Error('baselineは既に存在します。bootstrapで上書きできません');
    throw new Error(
      'e2e:ledger:bootstrapはv1専用の旧コマンドです。v2の初期化には使用できません。',
    );
  }
  if (isNil(previous)) throw new Error('保存済みcore baselineがありません。');
  baselineSchema.parse(parseArtifact(previous, ARTIFACTS.baseline));
  const revisions = await resolveRevisions({
    root,
    base: 'HEAD',
    env: process.env,
  });
  const initial = await captureWriterState(root, revisions);
  const coreAtHead = baselineSchema.parse(
    parseArtifact(
      readRevisionFile(root, revisions.head, ARTIFACTS.baseline),
      ARTIFACTS.baseline,
    ),
  );
  const state = await collectStaticState(root);
  const issues = checkBaseline({
    base: coreAtHead,
    head: state.baseline,
    current: state.baseline.items,
  });
  if (issues.length)
    throw new Error(`不足を増やす更新はできません: ${JSON.stringify(issues)}`);
  const history = readSurfaceStateAtRevision(root, revisions.head);
  const working = readWorkingSurfaceState(root);
  if (isNil(history) || isNil(working))
    throw new Error('固定HEADと作業ツリーのUI移行履歴が必要です。');
  if (history.migration.ruleDigest !== SURFACE_RULE_DIGEST)
    throw new Error('UI必須化の規則が変更されています');
  checkSurfacePending({
    base: history,
    head: { pending: state.surfacePending, migration: working.migration },
    current: state.surfacePending,
  });
  const shouldCreateCoreMigrations = isNil(
    readArtifact(root, ARTIFACTS.migrations),
  );
  await assertWriterUnchanged(root, revisions, initial);
  // すべての検証が終わってから保存する。これは検査合格やレビュー承認ではない。
  writeArtifact(root, ARTIFACTS.inventory, serializeInventory(state.inventory));
  writeArtifact(
    root,
    ARTIFACTS.legacy,
    `${JSON.stringify(state.legacy, null, 2)}\n`,
  );
  writeArtifact(root, ARTIFACTS.baseline, serializeBaseline(state.baseline));
  writeArtifact(
    root,
    SURFACE_ARTIFACTS.pending,
    serializeSurfacePending(state.surfacePending),
  );
  if (shouldCreateCoreMigrations)
    writeArtifact(
      root,
      ARTIFACTS.migrations,
      `${JSON.stringify({ schemaVersion: 1, entries: [] }, null, 2)}\n`,
    );
  return {
    mode,
    pendingItems: state.baseline.items.length,
    baselineDigest: baselineDigest(state.baseline),
    reviewRequired: false,
  };
};

/** 旧v1を同じ抽出器で観測し、許容集合の再生成を専用移行だけに限定する。 */
const prepareInitialSurfaceLegacy = (
  root: string,
  head: string,
  currentInput: Awaited<ReturnType<typeof collectStaticState>>['legacy'],
) => {
  const headLegacy = legacyManifestSchema.parse(
    parseArtifact(
      readRevisionFile(root, head, ARTIFACTS.legacy),
      ARTIFACTS.legacy,
    ),
  );
  const workingText = readArtifact(root, ARTIFACTS.legacy);
  const workingLegacy = legacyManifestSchema.parse(
    parseArtifact(workingText, ARTIFACTS.legacy),
  );
  const current = legacyManifestSchema.parse(currentInput);
  const fixed = (manifest: typeof current) => [
    manifest.tests,
    manifest.setups,
    manifest.groups,
  ];
  if (
    !isDeepStrictEqual(fixed(headLegacy), fixed(workingLegacy)) ||
    !isDeepStrictEqual(fixed(headLegacy), fixed(current))
  )
    throw new Error(
      'UI初期移行ではlegacyの未登録test・setup・groupを変更できません。',
    );
  const identity = (manifest: typeof current) =>
    manifest.registered.map((entry) => ({
      ...entry,
      fingerprint: undefined,
    }));
  if (!isDeepStrictEqual(identity(headLegacy), identity(current)))
    throw new Error('UI初期移行では登録済testのidentityを変更できません。');
  if (
    !isDeepStrictEqual(workingLegacy.registered, headLegacy.registered) &&
    !isDeepStrictEqual(workingLegacy.registered, current.registered)
  )
    throw new Error(
      '作業ツリーの登録済test metadataが移行候補と一致しません。',
    );
  const contents = `${JSON.stringify(current, null, 2)}\n`;
  return { contents, shouldWrite: !isDeepStrictEqual(workingLegacy, current) };
};

export const migrateSurfaceLedger = async (root: string, base: string) => {
  assertLocalWriter();
  const revisions = await resolveRevisions({ root, base, env: process.env });
  const initial = await captureWriterState(root, revisions);
  if (!isNil(readSurfaceStateAtRevision(root, revisions.head)))
    throw new Error('固定HEADにUI初期移行が既に記録されています。');
  const savedPending = readArtifact(root, SURFACE_ARTIFACTS.pending);
  const savedMigration = readArtifact(root, SURFACE_ARTIFACTS.migration);
  const hasSurfaceArtifact = !isNil(savedPending) || !isNil(savedMigration);
  const state = await collectStaticState(root);
  const legacy = prepareInitialSurfaceLegacy(
    root,
    revisions.head,
    state.legacy,
  );
  const candidate = await prepareSurfaceMigration({
    root,
    revisions,
    state,
    artifacts: ARTIFACTS,
  });
  const inventory = serializeInventory(state.inventory);
  const pending = serializeSurfacePending(candidate.pending);
  const migration = `${JSON.stringify(candidate.migration, null, 2)}\n`;
  const isComplete = !isNil(savedPending) && !isNil(savedMigration);
  if (hasSurfaceArtifact) {
    const inventoryMatches =
      readArtifact(root, ARTIFACTS.inventory) === inventory;
    const surfaceMatches = isComplete
      ? (() => {
          const working = readWorkingSurfaceState(root);
          return (
            !isNil(working) &&
            serializeSurfacePending(working.pending) === pending &&
            isDeepStrictEqual(working.migration, candidate.migration)
          );
        })()
      : (isNil(savedPending) || savedPending === pending) &&
        (isNil(savedMigration) || savedMigration === migration);
    if (!inventoryMatches || !surfaceMatches)
      throw new Error('作業ツリーのUI初期移行候補が固定観測と一致しません。');
  }
  await assertWriterUnchanged(root, revisions, initial);
  if (
    candidate.receipt.surfaceMigrationSnapshotDigest !== initial.snapshotDigest
  )
    throw new Error('UI初期移行の観測と保存前の固定入力が一致しません。');
  if (!hasSurfaceArtifact) writeArtifact(root, ARTIFACTS.inventory, inventory);
  if (isNil(savedPending))
    writeArtifact(root, SURFACE_ARTIFACTS.pending, pending);
  if (isNil(savedMigration))
    writeArtifact(root, SURFACE_ARTIFACTS.migration, migration);
  if (legacy.shouldWrite)
    writeArtifact(root, ARTIFACTS.legacy, legacy.contents);
  return {
    mode: 'migrate-surface',
    ...candidate.receipt,
    pendingItems: candidate.pending.items.length,
    reviewRequired: true,
  };
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const mode = args[0];
  const base = args[2];
  const isMigration =
    mode === 'migrate-surface' &&
    args.length === 3 &&
    args[1] === '--base' &&
    base &&
    !base.startsWith('-');
  if (
    !isMigration &&
    (args.length !== 1 || (mode !== 'bootstrap' && mode !== 'update'))
  ) {
    process.stderr.write(
      '使用法: ledgerRefresh.ts bootstrap|update|migrate-surface --base <ref>\n',
    );
    process.exitCode = 1;
  } else {
    const result = isMigration
      ? migrateSurfaceLedger(process.cwd(), base)
      : refreshLedger(
          process.cwd(),
          mode === 'bootstrap' ? 'bootstrap' : 'update',
        );
    result
      .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
      .catch((error: unknown) => {
        process.stderr.write(
          `${error instanceof Error ? error.message : '台帳の更新に失敗しました'}\n`,
        );
        process.exitCode = 1;
      });
  }
}

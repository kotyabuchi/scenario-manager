import { isNil } from 'ramda';
import { z } from 'zod';

import {
  baselineSchema,
  buildPendingItems,
  checkBaseline,
  serializeBaseline,
} from './baseline';
import { discover } from './discover';
import { discoverIntegration } from './discoverIntegration';
import { bindDiscovery } from './discoveryBindings';
import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import {
  captureInputs,
  compareInputs,
  type InputFingerprint,
} from './fingerprint';
import { verifyGithubPushBootstrapApproval } from './githubEvent';
import {
  type GithubEventPolicy,
  githubEventPolicySchema,
} from './githubEventSchema';
import { buildInventory, serializeInventory } from './inventory';
import { loadLedger } from './ledger';
import { parseArtifact, readArtifact } from './ledgerArtifacts';
import {
  buildLegacy,
  checkLegacy,
  legacyManifestSchema,
  legacyMigrationSchema,
} from './legacy';
import {
  comparePolicy,
  policyMigrationSchema,
  validatePolicyMigrations,
} from './policy';
import {
  measurePreparation,
  measurePreparationSync,
  type PreparationTimingObserver,
} from './preparationTiming';
import { validateLedger } from './requirements';
import { loadSource } from './source';
import { createSourceReadWitness } from './sourceReadWitness';
import { checkSurfaceState } from './surfaceGate';
import { buildSurfacePending } from './surfacePending';
import { withSurfaceNodes } from './surfaceProjection';
import {
  readRevisionFile,
  readRevisionLedger,
  verifyBootstrapApproval,
} from './trustedRevision';

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import type { LedgerIssue } from '../../e2e/ledger/schema';

export const ARTIFACTS = {
  inventory: 'e2e/ledger/inventory.generated.json',
  baseline: 'e2e/ledger/pending-baseline.json',
  legacy: 'e2e/ledger/legacy-tests.generated.json',
  migrations: 'e2e/ledger/migrations.json',
} as const;
const sha = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
export const migrationsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  entries: z.array(
    z.strictObject({
      base: sha,
      policy: z.array(policyMigrationSchema),
      legacy: z.array(legacyMigrationSchema),
    }),
  ),
});
const serialize = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

type ReusableStaticInventory = {
  root: string;
  inputDigest: string;
  inventory: ReturnType<typeof buildInventory>;
  readWitness: ReturnType<typeof createSourceReadWitness>;
};

const reusableStaticInventories = new WeakMap<
  object,
  ReusableStaticInventory
>();

/** M1の固定runnerを列挙する。ブラウザ・DB・test bodyは実行しない。 */
export const collectStaticState = async (
  root: string,
  onTiming?: PreparationTimingObserver,
  { shouldPrepareReuse = false }: { shouldPrepareReuse?: boolean } = {},
) => {
  const reuseInputs = shouldPrepareReuse
    ? await captureInputs(root)
    : undefined;
  const readWitness = shouldPrepareReuse
    ? createSourceReadWitness()
    : undefined;
  const inventory = measurePreparationSync(
    { phase: 'static-ledger', operation: 'inventory' },
    onTiming,
    () =>
      buildInventory(
        measurePreparationSync(
          { phase: 'static-ledger', operation: 'product-source' },
          onTiming,
          () =>
            loadSource(
              root,
              undefined,
              readWitness ? { observeRead: readWitness.observe } : {},
            ),
        ),
        measurePreparationSync(
          { phase: 'static-ledger', operation: 'story-source' },
          onTiming,
          () => loadStorySurfaceContext(root, undefined, readWitness?.observe),
        ),
      ),
  );
  if (reuseInputs) {
    const afterInventory = await captureInputs(root);
    if (
      Object.values(compareInputs(reuseInputs, afterInventory)).some(
        (paths) => paths.length > 0,
      )
    )
      throw new Error('静的inventory解析中に実行入力が変化しました。');
  }
  const [
    ledgerResult,
    appResult,
    storybookResult,
    isolatedResult,
    integrationResult,
  ] = await measurePreparation(
    { phase: 'static-ledger', operation: 'discovery-wait' },
    onTiming,
    () =>
      Promise.allSettled([
        measurePreparation(
          { phase: 'static-ledger', operation: 'ledger' },
          onTiming,
          () => loadLedger(root),
        ),
        measurePreparation(
          { phase: 'static-ledger', operation: 'discover-app' },
          onTiming,
          () =>
            discover({ root, profile: 'app', config: 'playwright.config.ts' }),
        ),
        measurePreparation(
          { phase: 'static-ledger', operation: 'discover-storybook' },
          onTiming,
          () =>
            discover({
              root,
              profile: 'storybook',
              config: '.storybook/playwright.config.ts',
            }),
        ),
        measurePreparation(
          { phase: 'static-ledger', operation: 'discover-isolated' },
          onTiming,
          () =>
            discover({
              root,
              profile: 'isolated',
              config: 'playwright.isolated.config.ts',
            }),
        ),
        measurePreparation(
          { phase: 'static-ledger', operation: 'discover-integration' },
          onTiming,
          () => discoverIntegration({ root }),
        ),
      ]),
  );
  // 失敗時も他の列挙子を残さず、すべての終了を待ってから返す。
  if (ledgerResult.status === 'rejected') throw ledgerResult.reason;
  if (appResult.status === 'rejected') throw appResult.reason;
  if (storybookResult.status === 'rejected') throw storybookResult.reason;
  if (isolatedResult.status === 'rejected') throw isolatedResult.reason;
  if (integrationResult.status === 'rejected') throw integrationResult.reason;
  const ledger = ledgerResult.value;
  const reports = [
    appResult.value,
    storybookResult.value,
    isolatedResult.value,
  ];
  const { bindings, validation } = measurePreparationSync(
    { phase: 'static-ledger', operation: 'bind-validate' },
    onTiming,
    () => {
      const bindings = bindDiscovery(ledger, [
        ...reports,
        integrationResult.value.discovery,
      ]);
      const validation = validateLedger({
        inventory: withSurfaceNodes(inventory),
        ledger,
        registrations: bindings.registrations,
      });
      return { bindings, validation };
    },
  );
  const issues = [...bindings.issues, ...validation.issues];
  if (issues.length)
    throw new Error(`静的台帳の整合エラー: ${JSON.stringify(issues)}`);
  const baseline = baselineSchema.parse({
    schemaVersion: 1,
    items: buildPendingItems(
      validation.deficiencies.filter(
        ({ target }) => !target.startsWith('surface:'),
      ),
      inventory.diagnostics,
    ),
  });
  const legacy = await measurePreparation(
    { phase: 'static-ledger', operation: 'legacy' },
    onTiming,
    () => buildLegacy(root, reports),
  );
  const state = {
    inventory,
    ledger,
    baseline,
    legacy,
    registrations: bindings.registrations.length,
    surfacePending: buildSurfacePending(inventory, [
      ...validation.deficiencies,
      ...validation.excepted,
    ]),
  };
  if (reuseInputs && readWitness) {
    const protectedInventory = measurePreparationSync(
      { phase: 'static-ledger', operation: 'inventory-proof' },
      onTiming,
      () => structuredClone(inventory),
    );
    reusableStaticInventories.set(state, {
      root: resolve(root),
      inputDigest: reuseInputs.digest,
      inventory: protectedInventory,
      readWitness,
    });
  }
  return state;
};

/** 固定されたstatic stateに結び付くinventoryだけを、一回限りで取り出す。 */
export const consumeReusableStaticInventory = (
  state: StaticState,
  root: string,
  inputs: InputFingerprint,
  onTiming?: PreparationTimingObserver,
): ReturnType<typeof buildInventory> | undefined => {
  const entry = reusableStaticInventories.get(state);
  reusableStaticInventories.delete(state);
  return measurePreparationSync(
    { phase: 'collection', operation: 'inventory-proof' },
    onTiming,
    () => {
      if (
        !entry ||
        entry.root !== resolve(root) ||
        entry.root !== inputs.root ||
        entry.inputDigest !== inputs.digest ||
        !entry.readWitness.matches()
      )
        return undefined;
      return entry.inventory;
    },
  );
};

/** 初期不足の内容を固定headと合わせてレビューするためのdigest。 */
export const baselineDigest = (baseline: StaticState['baseline']) =>
  createHash('sha256').update(serializeBaseline(baseline)).digest('hex');

/** 保存物の陳腐化、baseとの不足増加、契約縮小を独立して検査する。 */
export const checkStaticState = async ({
  root,
  state,
  revisions,
  bootstrapApproval,
  directory,
  signal,
}: {
  root: string;
  state: StaticState;
  revisions: { base: string; head: string; eventPolicy?: GithubEventPolicy };
  bootstrapApproval?: string;
  directory?: string;
  signal?: AbortSignal;
}) => {
  const policy = isNil(revisions.eventPolicy)
    ? undefined
    : githubEventPolicySchema.parse(revisions.eventPolicy);
  const staticBase = policy?.staticBase;
  if (
    !isNil(policy) &&
    !isNil(staticBase) &&
    (revisions.head !== policy.head ||
      revisions.base !==
        (staticBase.kind === 'push-bootstrap' ? policy.head : staticBase.sha))
  )
    throw new Error('静的比較のbase/headがGitHubイベントと一致しません');
  const issues: LedgerIssue[] = [];
  for (const [file, expected] of [
    [ARTIFACTS.inventory, serializeInventory(state.inventory)],
    [ARTIFACTS.legacy, serialize(state.legacy)],
  ] as const) {
    if (readArtifact(root, file) !== expected)
      issues.push({
        code: 'STALE_ARTIFACT',
        subject: file,
        message:
          '再抽出結果と保存物が一致しません。明示的に更新し差分を確認してください',
      });
  }
  const head = baselineSchema.parse(
    parseArtifact(readArtifact(root, ARTIFACTS.baseline), ARTIFACTS.baseline),
  );
  const migrations = migrationsSchema.parse(
    parseArtifact(
      readArtifact(root, ARTIFACTS.migrations),
      ARTIFACTS.migrations,
    ),
  );
  const baseText = readRevisionFile(root, revisions.base, ARTIFACTS.baseline);
  if (
    isNil(baseText) &&
    (staticBase?.kind === 'self' || staticBase?.kind === 'push-bootstrap')
  )
    throw new Error('固定HEADに保存済みbaselineがありません');
  const isPushBootstrap = staticBase?.kind === 'push-bootstrap';
  const isBaselineMissing = isNil(baseText);
  if (policy?.event === 'push' && (isPushBootstrap || isBaselineMissing)) {
    const { staticBase: pushBase } = policy;
    verifyGithubPushBootstrapApproval(
      {
        event: 'push',
        repository: policy.repository,
        ref: policy.eventRef,
        before:
          pushBase.kind === 'push-bootstrap' ? pushBase.before : pushBase.sha,
        head: policy.head,
        baselineDigest: baselineDigest(head),
      },
      bootstrapApproval,
    );
  }
  const eventLedger = await readRevisionLedger(root, revisions.base);
  const eventMigrationText = readRevisionFile(
    root,
    revisions.base,
    ARTIFACTS.migrations,
  );
  const eventLegacyText = readRevisionFile(
    root,
    revisions.base,
    ARTIFACTS.legacy,
  );
  if (
    policy?.event === 'pull_request' &&
    isBaselineMissing !== isNil(eventLegacyText)
  )
    throw new Error('PRの比較元にはbaselineとlegacy目録の両方が必要です');
  if (!isBaselineMissing && isNil(eventLegacyText))
    throw new Error('baseのlegacy目録が欠落しています');

  const isBootstrap = isPushBootstrap || isBaselineMissing;
  if (isNil(baseText)) {
    // PRとローカル初回導入にも、固定した比較元・HEAD・baselineの承認が必要。
    if (policy?.event !== 'push')
      verifyBootstrapApproval(
        {
          base: revisions.base,
          head: revisions.head,
          digest: baselineDigest(head),
        },
        bootstrapApproval,
      );
    issues.push(
      ...checkBaseline({ base: head, head, current: state.baseline.items }),
    );
  } else {
    if (isNil(eventLedger)) throw new Error('baseの契約台帳が欠落しています');
    issues.push(
      ...checkBaseline({
        base: baselineSchema.parse(parseArtifact(baseText, ARTIFACTS.baseline)),
        head,
        current: state.baseline.items,
      }),
    );
  }
  const surface = await checkSurfaceState({
    root,
    state,
    revisions,
    artifacts: ARTIFACTS,
    ...(bootstrapApproval ? { bootstrapApproval } : {}),
    ...(isNil(directory) ? {} : { directory }),
    ...(isNil(signal) ? {} : { signal }),
  });

  const historyBase = surface.surfaceMigrationHistory?.introductionSha;
  let baseLedger = eventLedger;
  let baseMigrationText = eventMigrationText;
  let baseLegacyText = eventLegacyText;
  if (!isNil(historyBase)) {
    // 公開比較元にある実行義務は、固定導入の履歴で上書きしない。
    if (
      !isBaselineMissing ||
      !isNil(eventLedger) ||
      !isNil(eventMigrationText) ||
      !isNil(eventLegacyText)
    )
      throw new Error('履歴再生の比較元に一部のcore台帳が存在します');
    baseLedger = await readRevisionLedger(root, historyBase);
    baseMigrationText = readRevisionFile(
      root,
      historyBase,
      ARTIFACTS.migrations,
    );
    baseLegacyText = readRevisionFile(root, historyBase, ARTIFACTS.legacy);
    if (isNil(baseLedger) || isNil(baseMigrationText) || isNil(baseLegacyText))
      throw new Error(
        '固定導入の履歴に契約台帳・移行記録・legacy目録が必要です',
      );
  }

  const previousMigrations = isNil(baseMigrationText)
    ? { schemaVersion: 1 as const, entries: [] }
    : migrationsSchema.parse(
        parseArtifact(baseMigrationText, ARTIFACTS.migrations),
      );
  const bases = new Set<string>();
  for (const entry of migrations.entries) {
    if (bases.has(entry.base))
      issues.push({
        code: 'DUPLICATE_MIGRATION_BASE',
        subject: entry.base,
        message: '同じbaseの移行記録が重複しています',
      });
    bases.add(entry.base);
    if (
      entry.base !== revisions.base &&
      !previousMigrations.entries.some(
        (old) => serialize(old) === serialize(entry),
      )
    )
      issues.push({
        code: 'UNRELATED_MIGRATION',
        subject: entry.base,
        message: '現在の比較baseに対応しない移行記録は追加・変更できません',
      });
  }
  for (const previous of previousMigrations.entries) {
    if (
      !migrations.entries.some(
        (entry) => serialize(entry) === serialize(previous),
      )
    )
      issues.push({
        code: 'REMOVED_MIGRATION_HISTORY',
        subject: previous.base,
        message: '既存の移行記録は保持してください',
      });
  }
  const migration = migrations.entries.find(
    (entry) => entry.base === revisions.base,
  );
  // 初回でも既存の契約・旧testが存在すれば比較を省略しない。
  const policyDeltas = isNil(baseLedger)
    ? []
    : comparePolicy(baseLedger, state.ledger);
  issues.push(
    ...validatePolicyMigrations(policyDeltas, migration?.policy ?? []),
  );
  if (!isNil(baseLegacyText)) {
    const baseLegacy = legacyManifestSchema.parse(
      parseArtifact(baseLegacyText, ARTIFACTS.legacy),
    );
    issues.push(
      ...checkLegacy(baseLegacy, state.legacy, migration?.legacy ?? []).map(
        ({ key, ...issue }) => ({ ...issue, subject: key }),
      ),
    );
  }
  return {
    ...surface,
    issues,
    policyDeltas,
    isBootstrap,
    ...(isPushBootstrap
      ? { historicalComparison: 'unavailable' as const }
      : policy?.event === 'push' && isBaselineMissing
        ? { historicalComparison: 'baseline-not-introduced' as const }
        : {}),
  };
};

type StaticState = Awaited<ReturnType<typeof collectStaticState>>;
export type { StaticState };

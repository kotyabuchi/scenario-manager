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
import { validateLedger } from './requirements';
import { loadSource } from './source';
import { checkSurfaceState } from './surfaceGate';
import { buildSurfacePending } from './surfacePending';
import { withSurfaceNodes } from './surfaceProjection';
import {
  readRevisionFile,
  readRevisionLedger,
  verifyBootstrapApproval,
} from './trustedRevision';

import { createHash } from 'node:crypto';

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

/** M1の固定runnerを列挙する。ブラウザ・DB・test bodyは実行しない。 */
export const collectStaticState = async (root: string) => {
  const inventory = buildInventory(
    loadSource(root),
    loadStorySurfaceContext(root),
  );
  const [
    ledgerResult,
    appResult,
    storybookResult,
    isolatedResult,
    integrationResult,
  ] = await Promise.allSettled([
    loadLedger(root),
    discover({ root, profile: 'app', config: 'playwright.config.ts' }),
    discover({
      root,
      profile: 'storybook',
      config: '.storybook/playwright.config.ts',
    }),
    discover({
      root,
      profile: 'isolated',
      config: 'playwright.isolated.config.ts',
    }),
    discoverIntegration({ root }),
  ]);
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
  const bindings = bindDiscovery(ledger, [
    ...reports,
    integrationResult.value.discovery,
  ]);
  const validation = validateLedger({
    inventory: withSurfaceNodes(inventory),
    ledger,
    registrations: bindings.registrations,
  });
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
  const legacy = await buildLegacy(root, reports);
  return {
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
}: {
  root: string;
  state: StaticState;
  revisions: { base: string; head: string; eventPolicy?: GithubEventPolicy };
  bootstrapApproval?: string;
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
  const baseLedger = await readRevisionLedger(root, revisions.base);
  const baseMigrationText = readRevisionFile(
    root,
    revisions.base,
    ARTIFACTS.migrations,
  );
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
  const baseLegacyText = readRevisionFile(
    root,
    revisions.base,
    ARTIFACTS.legacy,
  );
  if (
    policy?.event === 'pull_request' &&
    isBaselineMissing !== isNil(baseLegacyText)
  )
    throw new Error('PRの比較元にはbaselineとlegacy目録の両方が必要です');
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
  } else if (!isNil(baseText))
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
    if (isNil(baseLedger)) throw new Error('baseの契約台帳が欠落しています');
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
  });
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

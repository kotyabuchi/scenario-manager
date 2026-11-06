import { isNil } from 'ramda';

import {
  BOOTSTRAP_SMOKE_KEY_DIGEST,
  BOOTSTRAP_SMOKE_REVISION,
  type CiSmokeReference,
  digestLegacySmokeKeys,
  LEGACY_SMOKE_FILE,
  legacySmokeKeys,
  smokeControlAnnotations,
} from './ciBootstrap';
import {
  type CiPartitionManifest,
  type CiShardId,
  type CiWorkflow,
  ciPartitionManifestSchema,
} from './ciPartitionSchema';
import { type LegacyManifest, legacyKey } from './legacy';
import { projectSelection } from './projectSelection';
import {
  type SelectionDecision,
  type SelectionReason,
  selectionDecisionSchema,
  selectionReason,
} from './selectionSchema';
import { digestVerificationPlan } from './verificationPlanDigest';

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type { GithubEventPolicy } from './githubEventSchema';
import type { VerificationPlan } from './verificationSchema';

const SMOKE_CASE = 'scenario-search-reset';

type LedgerInputs = {
  ledger: Ledger;
  legacy: LegacyManifest;
  smokeReference?: CiSmokeReference;
  surfaceMigrationHistoryDigest?: string;
};

type PartitionInput = LedgerInputs & {
  workflow: CiWorkflow;
  eventPolicy: GithubEventPolicy;
  snapshotDigest: string;
  inputsDigest: string;
  fullCollectionDigest: string;
  fullPlan: VerificationPlan;
  changeDecision: SelectionDecision | null;
  runnerSelectionFallback?: CiPartitionManifest['runnerSelectionFallback'];
};

const digest = (value: unknown) =>
  createHash('sha256')
    .update(`${JSON.stringify(value)}\n`)
    .digest('hex');

export const digestCiPartitionManifest = (value: CiPartitionManifest) =>
  digest(ciPartitionManifestSchema.parse(value));

/** 全guard付き収集とVitest sidecarを、job間で同じ順序のまま照合する。 */
export const digestCiFullCollection = (
  discoveries: unknown,
  integrationCollection: unknown,
) => digest([discoveries, integrationCollection]);

const fixedPrSmoke = (input: PartitionInput, reference: CiSmokeReference) => {
  const { fullPlan, ledger, legacy } = input;
  const item = ledger.scenarios
    .flatMap(({ cases }) => cases)
    .find(({ caseId }) => caseId === SMOKE_CASE);
  const rows = fullPlan.requirements.filter(
    ({ claim }) => claim?.caseId === SMOKE_CASE,
  );
  if (
    item?.status !== 'implemented' ||
    rows.length === 0 ||
    rows.some(
      ({ kind, profile, test }) =>
        kind !== 'business' ||
        profile !== 'storybook' ||
        test.isSetup ||
        test.expectedStatus !== 'passed' ||
        test.annotations.some(({ type }) => smokeControlAnnotations.has(type)),
    )
  )
    throw new Error('固定Storybook smokeの業務登録がありません。');

  const legacyKeys = legacySmokeKeys(reference.legacy);
  const selected = fullPlan.allowedExtraTests.filter(
    ({ test }) => test.file === LEGACY_SMOKE_FILE,
  );
  if (
    !isDeepStrictEqual(legacyKeys, legacySmokeKeys(legacy)) ||
    !isDeepStrictEqual(
      legacyKeys,
      selected.map(({ legacy }) => legacy.key).sort(),
    ) ||
    selected.some(
      ({ profile, legacy: entry, test }) =>
        profile !== 'app' ||
        entry.disposition !== 'local' ||
        entry.key !== legacyKey(profile, test) ||
        test.isSetup ||
        test.expectedStatus !== 'passed' ||
        test.annotations.some(({ type }) => smokeControlAnnotations.has(type)),
    ) ||
    fullPlan.requirements.some(({ test }) => test.file === LEGACY_SMOKE_FILE)
  )
    throw new Error(
      '固定legacy smokeのexact keyまたは実行区分が一致しません。',
    );
  return { requiredCaseIds: [SMOKE_CASE], legacyKeys };
};

const assertAppRegistrations = (
  app: VerificationPlan,
  legacy: LegacyManifest,
) => {
  const registered = new Map(
    legacy.registered
      .filter(({ profile }) => profile === 'app')
      .map((entry) => [entry.key, entry]),
  );
  const business = app.requirements.filter(({ kind }) => kind === 'business');
  const legacyKeys = new Set(
    legacy.tests
      .filter(({ profile }) => profile === 'app')
      .map(({ key }) => key),
  );
  const accepted = new Set(['local', 'existing-skip', 'existing-fixme']);
  const businessKeys = business.map(({ profile, test }) =>
    legacyKey(profile, test),
  );
  const extraKeys = app.allowedExtraTests.map(({ legacy }) => legacy.key);
  if (
    registered.size !== business.length ||
    new Set(businessKeys).size !== business.length ||
    new Set(extraKeys).size !== extraKeys.length ||
    business.some(({ profile, test, claim }) => {
      const entry = registered.get(legacyKey(profile, test));
      return (
        isNil(entry) ||
        isNil(claim) ||
        entry.caseId !== claim.caseId ||
        entry.variant !== claim.variant ||
        entry.binding !== claim.binding
      );
    }) ||
    app.allowedExtraTests.some(
      ({ profile, test, legacy }) =>
        legacy.key !== legacyKey(profile, test) ||
        !legacyKeys.has(legacy.key) ||
        !accepted.has(legacy.disposition),
    )
  )
    throw new Error('app業務登録またはlegacy extrasが移行目録と一致しません。');
};

const partitionPlans = (
  plan: VerificationPlan,
  fullPlan: VerificationPlan,
  ledger: Ledger,
) => {
  const plans: Record<CiShardId, VerificationPlan> = {
    required: {
      schemaVersion: 1,
      requirements: plan.requirements.filter(
        ({ profile }) => profile !== 'app',
      ),
      allowedExtraTests: [],
    },
    'legacy-local': {
      schemaVersion: 1,
      requirements: plan.requirements.filter(
        ({ profile }) => profile === 'app',
      ),
      allowedExtraTests: plan.allowedExtraTests,
    },
  };
  const keys = [...plan.requirements, ...plan.allowedExtraTests].map(
    ({ key }) => key,
  );
  if (
    new Set(keys).size !== keys.length ||
    plan.allowedExtraTests.some(({ profile }) => profile !== 'app') ||
    !isDeepStrictEqual(
      plans['legacy-local'].requirements,
      fullPlan.requirements.filter(({ profile }) => profile === 'app'),
    ) ||
    !isDeepStrictEqual(plan.allowedExtraTests, fullPlan.allowedExtraTests)
  )
    throw new Error('全app業務登録と全legacy extrasを一意に分割できません。');

  for (const shard of Object.values(plans)) {
    if (!shard.requirements.some(({ kind }) => kind === 'business'))
      throw new Error('CI shardに業務登録がありません。');
    const required = new Set(shard.requirements.map(({ key }) => key));
    if (
      shard.requirements.some(({ dependencies }) =>
        dependencies.some((key) => !required.has(key)),
      )
    )
      throw new Error('CI shardをまたぐか不足するrunner依存があります。');
  }
  const selectedCases = new Set(
    plan.requirements.flatMap(({ claim }) =>
      isNil(claim) ? [] : [claim.caseId],
    ),
  );
  const complete = new Set(
    ledger.executionGroups
      .filter(({ caseIds }) => caseIds.every((id) => selectedCases.has(id)))
      .map(({ id }) => id),
  );
  if (
    ledger.executionGroups.some(
      ({ id, caseIds, dependsOn }) =>
        caseIds.some((caseId) => selectedCases.has(caseId)) &&
        (!complete.has(id) ||
          dependsOn.some((dependency) => !complete.has(dependency))),
    )
  )
    throw new Error('CI全体のexecutionGroupが閉じていません。');
  return plans;
};

/** 選択と閉包を全体で確定してから、既存のowner境界だけで実行計画を分ける。 */
export const createCiPartitionManifest = (input: PartitionInput) => {
  const {
    fullPlan,
    workflow,
    eventPolicy,
    snapshotDigest,
    inputsDigest,
    fullCollectionDigest,
  } = input;
  const changeDecision = isNil(input.changeDecision)
    ? null
    : selectionDecisionSchema.parse(input.changeDecision);
  const fullPlanDigest = digestVerificationPlan(fullPlan);
  let plan = fullPlan;
  let fixedSmoke: CiPartitionManifest['fixedSmoke'] = {
    requiredCaseIds: [],
    legacyKeys: [],
  };
  let projectionReasons: SelectionReason[] = [];
  let smokeReference: CiPartitionManifest['smokeReference'] = null;
  if (eventPolicy.event === 'pull_request') {
    if (
      isNil(changeDecision) ||
      changeDecision.head !== eventPolicy.head ||
      changeDecision.base !== eventPolicy.impactBase ||
      changeDecision.snapshotDigest !== snapshotDigest
    )
      throw new Error('PRの差分判断がイベントまたはsnapshotと一致しません。');
    const reference = input.smokeReference;
    if (isNil(reference))
      throw new Error('静的比較元のlegacy smokeを取得できません。');
    fixedSmoke = fixedPrSmoke(input, reference);
    const keyDigest = digestLegacySmokeKeys(fixedSmoke.legacyKeys);
    if (
      reference.kind === 'static-base'
        ? reference.revision !== eventPolicy.staticBase.sha
        : !reference.isBootstrap ||
          reference.revision !== BOOTSTRAP_SMOKE_REVISION ||
          keyDigest !== BOOTSTRAP_SMOKE_KEY_DIGEST
    )
      throw new Error('PRの固定legacy smokeの比較元が一致しません。');
    smokeReference = {
      kind: reference.kind,
      revision: reference.revision,
      isBootstrap: reference.isBootstrap,
      keyDigest,
    };
    const effective = projectSelection({
      decision: changeDecision,
      fullPlan,
      ledger: input.ledger,
      legacy: input.legacy,
      additions: {
        mandatoryCaseIds: fixedSmoke.requiredCaseIds,
        runLegacyLocal: true,
      },
    });
    if (isNil(effective)) throw new Error('CI実行計画が空です。');
    if (
      input.runnerSelectionFallback &&
      (reference.isBootstrap || changeDecision.mode === 'full-required')
    )
      throw new Error('全件CI計画にrunnerの追加fallbackは指定できません。');
    plan =
      reference.isBootstrap || input.runnerSelectionFallback
        ? fullPlan
        : effective.plan;
    projectionReasons = [...effective.reasons];
    if (reference.isBootstrap)
      projectionReasons.unshift(selectionReason('FORCED_FULL'));
    if (input.runnerSelectionFallback)
      projectionReasons.unshift(
        selectionReason('RUNNER_SELECTION_UNREPRESENTABLE'),
      );
  } else if (!isNil(changeDecision) || input.runnerSelectionFallback)
    throw new Error('全件イベントに差分判断を指定できません。');

  const plans = partitionPlans(plan, fullPlan, input.ledger);
  assertAppRegistrations(plans['legacy-local'], input.legacy);
  const describe = (id: CiShardId) => ({
    id,
    planDigest: digestVerificationPlan(plans[id]),
    requiredKeys: plans[id].requirements.map(({ key }) => key).sort(),
    extraKeys: plans[id].allowedExtraTests.map(({ key }) => key).sort(),
  });
  const manifest = ciPartitionManifestSchema.parse({
    schemaVersion: 1,
    workflow,
    eventPolicy,
    snapshotDigest,
    inputsDigest,
    fullCollectionDigest,
    fullPlanDigest,
    effectivePlanDigest: digestVerificationPlan(plan),
    fullPlan,
    changeDecision,
    decisionDigest: digest(changeDecision),
    fixedSmoke,
    smokeReference,
    ...(isNil(input.surfaceMigrationHistoryDigest)
      ? {}
      : { surfaceMigrationHistoryDigest: input.surfaceMigrationHistoryDigest }),
    ...(input.runnerSelectionFallback ? { runnerSelectionFallback: true } : {}),
    projectionReasons,
    shards: [describe('required'), describe('legacy-local')],
  });
  return { manifest, plans };
};

/** job間で受け取ったmanifestのキーや理由を、台帳と全件planから再投影する。 */
export const validateCiPartitionManifest = ({
  manifest: raw,
  ledger,
  legacy,
  smokeReference,
  surfaceMigrationHistoryDigest,
}: LedgerInputs & { manifest: unknown }) => {
  const manifest = ciPartitionManifestSchema.parse(raw);
  const {
    smokeReference: _savedReference,
    surfaceMigrationHistoryDigest: _savedHistoryDigest,
    ...manifestInputs
  } = manifest;
  const rebuilt = createCiPartitionManifest({
    ...manifestInputs,
    ledger,
    legacy,
    ...(isNil(smokeReference) ? {} : { smokeReference }),
    ...(isNil(surfaceMigrationHistoryDigest)
      ? {}
      : { surfaceMigrationHistoryDigest }),
  });
  if (!isDeepStrictEqual(manifest, rebuilt.manifest))
    throw new Error('CI manifestが全件計画からの分割と一致しません。');
  return rebuilt;
};

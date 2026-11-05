import { isNil } from 'ramda';

import { type LegacyManifest, legacyKey } from './legacy';
import {
  type SelectionDecision,
  type SelectionReason,
  selectionDecisionSchema,
  selectionReason,
} from './selectionSchema';
import { digestVerificationPlan } from './verificationPlanDigest';
import {
  type VerificationPlan,
  verificationPlanSchema,
} from './verificationSchema';

import type { Ledger } from '../../e2e/ledger/schema';

/** 全体列挙で検証済みの登録だけを使い、実行単位で必要な閉包を作る。 */
export const projectSelection = (input: {
  decision: SelectionDecision;
  fullPlan: VerificationPlan;
  ledger: Ledger;
  legacy: LegacyManifest;
  additions?: { mandatoryCaseIds: readonly string[]; runLegacyLocal: boolean };
}) => {
  const { fullPlan, ledger, legacy, additions } = input;
  const decision = selectionDecisionSchema.parse(input.decision);
  const requested = new Set(decision.requestedRequiredKeys);
  const byKey = new Map(fullPlan.requirements.map((row) => [row.key, row]));
  if (
    digestVerificationPlan(fullPlan) !== decision.fullPlanDigest ||
    byKey.size !== fullPlan.requirements.length ||
    requested.size !== decision.requestedRequiredKeys.length ||
    [...requested].some((key) => !byKey.has(key)) ||
    (decision.mode === 'full-required' && requested.size !== byKey.size)
  )
    throw new Error('変更選択と全件検証planが一致しません。');
  if (decision.mode === 'docs-only') {
    if (
      requested.size > 0 ||
      decision.coverageGaps.length > 0 ||
      decision.legacyPolicy !== 'omit' ||
      decision.reasons.some(
        ({ code }) => code !== 'DOCS_ALLOWLIST' && code !== 'NO_CHANGES',
      )
    )
      throw new Error('0件選択の根拠が不正です。');
    if (!additions?.runLegacyLocal && !additions?.mandatoryCaseIds.length)
      return null;
  }

  const selected = new Set(requested);
  const appRows = fullPlan.requirements.filter(
    ({ profile }) => profile === 'app',
  );
  const groupById = new Map(
    ledger.executionGroups.map((group) => [group.id, group]),
  );
  const reasons: SelectionReason[] = [];
  let runsLegacy = false;
  const addLegacy = () => {
    if (runsLegacy) return;
    if (appRows.length === 0)
      throw new Error('legacy-local ownerの必須登録がありません。');
    runsLegacy = true;
    for (const row of appRows) selected.add(row.key);
    reasons.push(
      selectionReason('LEGACY_REGRESSION_EXECUTION', {
        caseIds: appRows.flatMap(({ claim }) =>
          isNil(claim) ? [] : [claim.caseId],
        ),
      }),
    );
  };
  const addCase = (caseId: string) => {
    const rows = fullPlan.requirements.filter(
      ({ claim }) => claim?.caseId === caseId,
    );
    if (rows.length === 0)
      throw new Error(`executionGroupのcaseに必須登録がありません: ${caseId}`);
    for (const row of rows) selected.add(row.key);
  };
  const expandedCases = new Set<string>();
  const expandedGroups = new Set<string>();
  const expandedFiles = new Set<string>();
  const addGroup = (id: string) => {
    if (expandedGroups.has(id)) return;
    const group = groupById.get(id);
    if (isNil(group)) throw new Error('executionGroupの依存先がありません。');
    expandedGroups.add(id);
    for (const caseId of group.caseIds) addCase(caseId);
    reasons.push(
      selectionReason('EXECUTION_GROUP', {
        ruleIds: [id],
        caseIds: group.caseIds,
      }),
    );
    for (const dependency of group.dependsOn) addGroup(dependency);
  };

  const mandatoryCaseIds = additions?.mandatoryCaseIds ?? [];
  for (const caseId of mandatoryCaseIds) addCase(caseId);
  if (mandatoryCaseIds.length > 0)
    reasons.push(
      selectionReason('CI_FIXED_SMOKE', { caseIds: [...mandatoryCaseIds] }),
    );
  if (decision.legacyPolicy === 'legacy-local' || additions?.runLegacyLocal)
    addLegacy();
  // runner拡張で増えた登録もgroup/依存/fileの起点になる。
  for (const key of selected) {
    const row = byKey.get(key);
    if (isNil(row)) throw new Error('選択されたrunner依存登録がありません。');
    const caseId = row.claim?.caseId;
    if (!isNil(caseId) && !expandedCases.has(caseId)) {
      expandedCases.add(caseId);
      addCase(caseId);
      for (const group of ledger.executionGroups)
        if (group.caseIds.includes(caseId)) addGroup(group.id);
    }
    for (const dependency of row.dependencies) {
      if (selected.has(dependency)) continue;
      selected.add(dependency);
      reasons.push(
        selectionReason('RUNNER_DEPENDENCY', { viaNodes: [key, dependency] }),
      );
    }
    if (row.profile === 'app') addLegacy();
    const file = row.test.file;
    if (row.profile === 'integration' && !expandedFiles.has(file)) {
      expandedFiles.add(file);
      const rows = fullPlan.requirements.filter(
        ({ profile, test }) => profile === 'integration' && test.file === file,
      );
      if (rows.some(({ key }) => !selected.has(key)))
        reasons.push(
          selectionReason('VITEST_FILE_CLOSURE', {
            viaNodes: rows.map(({ key }) => key),
          }),
        );
      for (const item of rows) selected.add(item.key);
    }
  }
  const requirements = fullPlan.requirements.filter(({ key }) =>
    selected.has(key),
  );
  if (!requirements.some(({ kind }) => kind === 'business'))
    throw new Error('実行対象の業務登録がありません。');
  const allowedExtraTests = runsLegacy ? fullPlan.allowedExtraTests : [];
  if (runsLegacy) {
    const keys = new Set([
      ...appRows.map(({ profile, test }) => legacyKey(profile, test)),
      ...allowedExtraTests.map(({ legacy }) => legacy.key),
    ]);
    for (const group of legacy.groups) {
      if (!group.testKeys.some((key) => keys.has(key))) continue;
      if (group.testKeys.some((key) => !keys.has(key)))
        throw new Error(
          `legacy serial suite全体を安全に実行できません: ${group.id}`,
        );
      reasons.push(
        selectionReason('LEGACY_SERIAL_SUITE', { ruleIds: [group.id] }),
      );
    }
  }
  const plan = verificationPlanSchema.parse({
    schemaVersion: 1,
    requirements,
    allowedExtraTests,
  });
  return {
    plan,
    requestedRequiredKeys: [...requested].sort(),
    effectiveRequiredKeys: requirements.map(({ key }) => key).sort(),
    supportKeys: requirements
      .filter(({ kind }) => kind !== 'business')
      .map(({ key }) => key)
      .sort(),
    legacyExtraKeys: allowedExtraTests.map(({ key }) => key).sort(),
    reasons,
    selectionDigest: digestVerificationPlan(plan),
  };
};

type EffectiveSelection = NonNullable<ReturnType<typeof projectSelection>>;

export type { EffectiveSelection };

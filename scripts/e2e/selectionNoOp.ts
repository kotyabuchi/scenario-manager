import { isNil } from 'ramda';

import { type LoadedImpactRules, matchesImpactPath } from './loadImpactRules';
import {
  type SelectionDecision,
  selectionDecisionSchema,
  selectionReason,
} from './selectionSchema';
import { digestVerificationPlan } from './verificationPlanDigest';

import { isDeepStrictEqual } from 'node:util';

import type { GitSnapshot } from './gitSnapshotSchema';
import type { ImpactGraph } from './impactGraph';
import type { LegacyManifest } from './legacy';
import type { VerificationPlan } from './verificationSchema';

/** 通常の結果照合を経由しない0件runには、別途allowlistと固定入力の証拠を要求する。 */
export const assertNoOpDecision = (input: {
  decision: SelectionDecision;
  snapshot: GitSnapshot;
  endSnapshot: GitSnapshot;
  graph: ImpactGraph;
  rules: LoadedImpactRules;
  fullPlan: VerificationPlan;
  legacy: LegacyManifest;
  provenUnversionedPaths?: readonly string[];
}) => {
  const { snapshot, endSnapshot, graph, rules, fullPlan, legacy } = input;
  const decision = selectionDecisionSchema.parse(input.decision);
  if (
    decision.mode !== 'docs-only' ||
    decision.legacyPolicy !== 'omit' ||
    decision.coverageStatus !== 'no-known-gaps' ||
    decision.coverageGaps.length +
      decision.caseIds.length +
      decision.targetIds.length +
      decision.requestedRequiredKeys.length >
      0 ||
    decision.base !== snapshot.base ||
    decision.head !== snapshot.head ||
    decision.snapshotDigest !== snapshot.digest ||
    !isDeepStrictEqual(snapshot, endSnapshot) ||
    decision.graphDigest !== graph.digest ||
    decision.rulesDigest !== rules.digest ||
    decision.fullPlanDigest !== digestVerificationPlan(fullPlan) ||
    !fullPlan.requirements.some(({ kind }) => kind === 'business') ||
    graph.isUnavailable ||
    graph.hasErrors ||
    graph.hasUnlocatedDiagnostic ||
    isNil(rules.base) ||
    !isDeepStrictEqual(rules.base, rules.current)
  )
    throw new Error('0件選択のsnapshot・plan・選択状態が不正です。');

  const proven = new Set(input.provenUnversionedPaths);
  for (const reason of snapshot.reasons) {
    if (
      reason.code !== 'UNVERSIONED_RUNTIME_INPUT' ||
      reason.paths.some((path) => !proven.delete(path))
    )
      throw new Error('0件選択には比較できない実入力があります。');
  }
  if (proven.size > 0) throw new Error('0件選択の実入力由来が一致しません。');

  const paths = new Set<string>();
  for (const change of snapshot.changedPaths) {
    if (change.status === 'T')
      throw new Error('0件選択にfile種別の変更を含められません。');
    for (const path of [change.oldPath, change.newPath])
      if (!isNil(path)) paths.add(path);
  }
  if (paths.size === 0) {
    if (!isDeepStrictEqual(decision.reasons, [selectionReason('NO_CHANGES')]))
      throw new Error('差分なしの0件選択理由が一致しません。');
    return;
  }

  const nonDocs = [
    ...rules.current.alwaysFull,
    ...rules.current.databaseWide,
    ...rules.current.features,
  ];
  const registrationPaths = new Set([
    ...fullPlan.requirements.map(({ test }) => test.file),
    ...legacy.tests.map(({ file }) => file),
  ]);
  const expectedReasons = [];
  for (const path of [...paths].sort()) {
    const hits = (patterns: Parameters<typeof matchesImpactPath>[1][]) =>
      patterns.some((pattern) => matchesImpactPath(path, pattern));
    const allowed = rules.current.docsOnly.filter(({ paths }) => hits(paths));
    if (
      !path.endsWith('.md') ||
      allowed.length === 0 ||
      graph.sourcePaths.has(path) ||
      graph.byPath.has(path) ||
      registrationPaths.has(path) ||
      nonDocs.some(({ paths }) => hits(paths))
    )
      throw new Error('0件選択に文書allowlist外の差分があります。');
    expectedReasons.push(
      selectionReason('DOCS_ALLOWLIST', {
        changedPaths: [path],
        ruleIds: allowed.map(({ id }) => id),
      }),
    );
  }
  if (!isDeepStrictEqual(decision.reasons, expectedReasons))
    throw new Error('文書ごとの0件選択理由が一致しません。');
};

import { isNil } from 'ramda';

import { type ImpactGraph, traceImpact } from './impactGraph';
import { type LoadedImpactRules, matchesImpactPath } from './loadImpactRules';
import {
  type SelectionReason,
  selectionDecisionSchema,
  selectionReason,
} from './selectionSchema';
import { digestVerificationPlan } from './verificationPlanDigest';

import type { Ledger } from '../../e2e/ledger/schema';
import type { PendingBaseline } from './baseline';
import type { GitSnapshot } from './gitSnapshotSchema';
import type { LegacyManifest } from './legacy';
import type { VerificationPlan } from './verificationSchema';

type SelectInput = {
  snapshot: GitSnapshot;
  graph: ImpactGraph;
  rules: LoadedImpactRules;
  fullPlan: VerificationPlan;
  ledger: Ledger;
  legacy: LegacyManifest;
  baseline: PendingBaseline;
  provenUnversionedPaths?: readonly string[];
  forceFull?: boolean;
};

const normalized = (reasons: SelectionReason[]) =>
  [...new Map(reasons.map((reason) => [JSON.stringify(reason), reason]))]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([, reason]) => reason);

/** 固定された差分・graph・全登録から、必要な業務ケースと選択根拠を求める。 */
export const selectImpacts = (input: SelectInput) => {
  const { snapshot, graph, rules, fullPlan, ledger, legacy, baseline } = input;
  const paths = new Set<string>();
  const typeChanges = new Set<string>();
  for (const change of snapshot.changedPaths) {
    for (const path of [change.oldPath, change.newPath]) {
      if (isNil(path)) continue;
      paths.add(path);
      if (change.status === 'T') typeChanges.add(path);
    }
  }

  const caseIds = new Set<string>();
  const targetIds = new Set<string>();
  const reasons: SelectionReason[] = [];
  const coverageGaps: SelectionReason[] = [];
  let isFull = false;
  let mayAffectUnregistered = false;
  const widen = (reason: SelectionReason, broad = false) => {
    isFull = true;
    mayAffectUnregistered ||= broad;
    reasons.push(reason);
  };
  const gap = (reason: SelectionReason) => {
    coverageGaps.push(reason);
    widen(reason);
  };
  const allCases = ledger.scenarios.flatMap(({ cases }) => cases);
  const caseById = new Map(allCases.map((item) => [item.caseId, item]));
  const contracts = new Set(ledger.contracts.map(({ target }) => target));
  const availableRules = isNil(rules.base)
    ? [rules.current]
    : [rules.current, rules.base];

  if (input.forceFull) widen(selectionReason('FORCED_FULL'));
  if (isNil(rules.base)) widen(selectionReason('MISSING_BASE_RULES'));
  else if (JSON.stringify(rules.base) !== JSON.stringify(rules.current))
    widen(selectionReason('RULES_CHANGED'), true);

  const unversioned = new Set(
    snapshot.reasons
      .filter(({ code }) => code === 'UNVERSIONED_RUNTIME_INPUT')
      .flatMap(({ paths }) => paths),
  );
  const proven = new Set(input.provenUnversionedPaths);
  if ([...proven].some((path) => !unversioned.has(path)))
    throw new Error('由来を証明した入力が未追跡の実入力一覧にありません。');
  for (const reason of snapshot.reasons) {
    const changedPaths =
      reason.code === 'UNVERSIONED_RUNTIME_INPUT'
        ? reason.paths.filter((path) => !proven.has(path))
        : reason.paths;
    if (changedPaths.length > 0)
      widen(selectionReason(reason.code, { changedPaths }), true);
  }
  if (graph.isUnavailable) widen(selectionReason('GRAPH_UNAVAILABLE'), true);
  else if (graph.hasErrors || graph.hasUnlocatedDiagnostic)
    widen(selectionReason('GRAPH_INCOMPLETE'), true);

  for (const path of [...paths].sort()) {
    const changedPaths = [path];
    const { impactedNodes, reachedPaths } = traceImpact(graph, path);
    const matching = (patterns: Parameters<typeof matchesImpactPath>[1][]) =>
      [...reachedPaths].some((item) =>
        patterns.some((pattern) => matchesImpactPath(item, pattern)),
      );
    const selectedCases = new Set<string>();
    const selectedTargets = new Set<string>();
    const graphTargets = [...impactedNodes].filter((id) => contracts.has(id));
    const scopedLegacyPaths = new Set(reachedPaths);
    const isSource = graph.sourcePaths.has(path) || graph.byPath.has(path);
    const isDirectTest =
      !isSource && fullPlan.requirements.some(({ test }) => test.file === path);
    let isClassified = false;

    for (const rule of availableRules.flatMap(({ alwaysFull }) => alwaysFull)) {
      if (!matching(rule.paths)) continue;
      isClassified = true;
      widen(
        selectionReason('BROAD_CHANGE', { changedPaths, ruleIds: [rule.id] }),
        true,
      );
    }
    for (const rule of availableRules.flatMap(
      ({ databaseWide }) => databaseWide,
    )) {
      if (!rule.paths.some((pattern) => matchesImpactPath(path, pattern)))
        continue;
      isClassified = true;
      // 既存DB suiteと全browser依存を証明できるまで、登録済必須全件へ広げる。
      widen(
        selectionReason('DATABASE_WIDE', { changedPaths, ruleIds: [rule.id] }),
        true,
      );
      gap(selectionReason('LEGACY_DATABASE_UNVERIFIED', { changedPaths }));
    }
    for (const rule of availableRules.flatMap(({ features }) => features)) {
      // runnerの宣言fileだけの変更は、製品コードのディレクトリ規則とは分ける。
      if (isDirectTest || !matching(rule.paths)) continue;
      isClassified = true;
      for (const target of rule.targets) selectedTargets.add(target);
      for (const id of rule.caseIds) selectedCases.add(id);
      for (const entry of legacy.tests)
        if (
          rule.legacyPaths.some((pattern) =>
            matchesImpactPath(entry.file, pattern),
          )
        )
          scopedLegacyPaths.add(entry.file);
      reasons.push(
        selectionReason('FEATURE_RULE', {
          changedPaths,
          ruleIds: [rule.id],
          viaNodes: rule.targets,
          caseIds: rule.caseIds,
        }),
      );
    }
    for (const target of graphTargets) selectedTargets.add(target);
    if (graphTargets.length > 0) {
      isClassified = true;
      reasons.push(
        selectionReason('GRAPH_TARGET', {
          changedPaths,
          viaNodes: graphTargets,
        }),
      );
    }
    for (const item of allCases) {
      if (
        item.checks.some(
          ({ target }) =>
            selectedTargets.has(target) || impactedNodes.has(target),
        )
      )
        selectedCases.add(item.caseId);
    }
    for (const row of fullPlan.requirements) {
      if (!reachedPaths.has(row.test.file)) continue;
      isClassified = true;
      const caseId = row.claim?.caseId;
      const reason = selectionReason('TEST_FILE', {
        changedPaths,
        caseIds: isNil(caseId) ? [] : [caseId],
      });
      if (isNil(caseId)) widen(reason, true);
      else {
        selectedCases.add(caseId);
        reasons.push(reason);
      }
    }
    const retiredTargets = [...selectedTargets].filter(
      (id) => !contracts.has(id),
    );
    const retiredCases = [...selectedCases].filter((id) => !caseById.has(id));
    if (retiredTargets.length + retiredCases.length > 0)
      gap(
        selectionReason('RETIRED_RULE_REFERENCE', {
          changedPaths,
          viaNodes: retiredTargets,
          caseIds: retiredCases,
        }),
      );

    const selectedPlanned = [...selectedCases].filter(
      (id) => caseById.get(id)?.status === 'planned',
    );
    if (selectedPlanned.length > 0)
      gap(
        selectionReason('PLANNED_CASE', {
          changedPaths,
          caseIds: selectedPlanned,
        }),
      );

    const legacyRelated = legacy.tests.some(({ file }) =>
      scopedLegacyPaths.has(file),
    );
    if (legacyRelated) {
      isClassified = true;
      gap(selectionReason('LEGACY_UNMIGRATED', { changedPaths }));
    }
    for (const group of legacy.groups) {
      if (scopedLegacyPaths.has(group.file))
        reasons.push(
          selectionReason('LEGACY_SERIAL_SUITE', {
            changedPaths,
            ruleIds: [group.id],
          }),
        );
    }
    const baselineNodes = baseline.items.flatMap((item) => {
      if (item.category === 'source-diagnostic') {
        const id = item.anchor.ownerId;
        return impactedNodes.has(id) ? [id] : [];
      }
      const { target, caseId } = item.deficiency;
      return impactedNodes.has(target) ||
        selectedTargets.has(target) ||
        (!isNil(caseId) && selectedCases.has(caseId))
        ? [target]
        : [];
    });
    if (baselineNodes.length > 0)
      gap(
        selectionReason('BASELINE_RELATED', {
          changedPaths,
          viaNodes: baselineNodes,
        }),
      );

    // 未解決の呼出元が変更先を隠せるため、変更元と同じfileの診断だけに限定しない。
    if (isSource && graph.unresolvedPaths.size > 0)
      widen(selectionReason('UNKNOWN_DEPENDENCY', { changedPaths }), true);
    if (
      !isDirectTest &&
      !legacyRelated &&
      /\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(path)
    )
      gap(selectionReason('UNREGISTERED_TEST', { changedPaths }));
    if (typeChanges.has(path))
      widen(selectionReason('UNKNOWN_CHANGE', { changedPaths }), true);

    const docsRules = rules.current.docsOnly.filter((rule) =>
      rule.paths.some((pattern) => matchesImpactPath(path, pattern)),
    );
    const baseAllowsDocs = rules.base?.docsOnly.some((rule) =>
      rule.paths.some((pattern) => matchesImpactPath(path, pattern)),
    );
    if (!isClassified && !isSource && baseAllowsDocs && docsRules.length > 0) {
      reasons.push(
        selectionReason('DOCS_ALLOWLIST', {
          changedPaths,
          ruleIds: docsRules.map(({ id }) => id),
        }),
      );
    } else if (!isClassified && selectedCases.size === 0) {
      widen(selectionReason('UNKNOWN_CHANGE', { changedPaths }), true);
    }
    for (const id of selectedCases) if (caseById.has(id)) caseIds.add(id);
    for (const id of selectedTargets) if (contracts.has(id)) targetIds.add(id);
  }

  const isDocsOnly =
    !isFull &&
    [...paths].every((path) =>
      reasons.some(
        ({ code, changedPaths }) =>
          code === 'DOCS_ALLOWLIST' && changedPaths.includes(path),
      ),
    );
  if (isDocsOnly && paths.size === 0)
    reasons.push(selectionReason('NO_CHANGES'));
  if (
    !isDocsOnly &&
    !isFull &&
    !fullPlan.requirements.some(
      ({ claim }) => !isNil(claim) && caseIds.has(claim.caseId),
    )
  )
    widen(
      selectionReason('NO_REQUIRED_CASE', { changedPaths: [...paths] }),
      true,
    );
  if (mayAffectUnregistered && baseline.items.length > 0)
    gap(selectionReason('BASELINE_RELATED', { changedPaths: [...paths] }));
  if (mayAffectUnregistered && legacy.tests.length > 0)
    gap(selectionReason('LEGACY_UNMIGRATED', { changedPaths: [...paths] }));

  const requested = fullPlan.requirements.filter(
    ({ claim }) =>
      !isDocsOnly && (isFull || (!isNil(claim) && caseIds.has(claim.caseId))),
  );
  return selectionDecisionSchema.parse({
    schemaVersion: 1,
    mode: isFull ? 'full-required' : isDocsOnly ? 'docs-only' : 'partial',
    snapshotDigest: snapshot.digest,
    base: snapshot.base,
    head: snapshot.head,
    rulesDigest: rules.digest,
    graphDigest: graph.digest,
    fullPlanDigest: digestVerificationPlan(fullPlan),
    caseIds: [
      ...new Set(
        requested.flatMap(({ claim }) => (isNil(claim) ? [] : [claim.caseId])),
      ),
    ].sort(),
    targetIds: [...targetIds].sort(),
    requestedRequiredKeys: requested.map(({ key }) => key).sort(),
    reasons: normalized(reasons),
    coverageGaps: normalized(coverageGaps),
    coverageStatus: coverageGaps.length > 0 ? 'insufficient' : 'no-known-gaps',
    legacyPolicy:
      requested.some(({ profile }) => profile === 'app') ||
      coverageGaps.some(({ code }) => code === 'LEGACY_UNMIGRATED')
        ? 'legacy-local'
        : 'omit',
  });
};

export { projectSelection } from './projectSelection';

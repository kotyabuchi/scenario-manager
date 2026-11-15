import { describe, expect, it } from 'vitest';

import repositoryImpactRules from '../../e2e/ledger/impact-rules.json';
import {
  button,
  calendarFile,
  impactFixture,
  newAdapter,
  oldAdapter,
  scenariosFile,
  scenarioTarget,
  snapshotFixture,
} from './fixtures/selection';
import { mergeImpactGraphs, traceImpact } from './impactGraph';
import { loadImpactRules } from './loadImpactRules';
import { projectSelection, selectImpacts } from './select';
import { assertNoOpDecision } from './selectionNoOp';
import {
  compareSelectionShadow,
  type ShadowObservation,
} from './selectionShadow';
import { digestVerificationPlan } from './verificationPlanDigest';

import type { GitChangedPath } from './gitSnapshotSchema';

const changed = (newPath: string): GitChangedPath => ({
  status: 'M',
  origin: 'unstaged',
  newPath,
});

const choose = (...changes: GitChangedPath[]) => {
  const input = { ...impactFixture(), snapshot: snapshotFixture(changes) };
  const decision = selectImpacts(input);
  return {
    ...input,
    decision,
    effective: projectSelection({ ...input, decision }),
  };
};

describe('差分影響選択', () => {
  it('軽量DOM setup単独の変更を共通基盤の根拠で全必須へ広げる', () => {
    const input = impactFixture();
    const rawRules = JSON.stringify({
      ...input.rules.current,
      alwaysFull: repositoryImpactRules.alwaysFull,
    });
    const decision = selectImpacts({
      ...input,
      rules: loadImpactRules({
        current: rawRules,
        base: null,
        ledger: input.ledger,
      }),
      snapshot: snapshotFixture([changed('.storybook/vitest.dom.setup.ts')]),
    });
    expect(decision.mode).toBe('full-required');
    expect(decision.reasons).toContainEqual(
      expect.objectContaining({
        code: 'BROAD_CHANGE',
        ruleIds: ['test-infrastructure'],
      }),
    );
    expect(decision.reasons.map(({ code }) => code)).not.toContain(
      'UNKNOWN_CHANGE',
    );
  });

  it('旧aliasを経由した依存を削除・rename時も失わない', () => {
    for (const change of [
      { status: 'D', origin: 'committed', oldPath: oldAdapter },
      {
        status: 'R',
        origin: 'staged',
        oldPath: oldAdapter,
        newPath: newAdapter,
      },
    ] as const) {
      const result = choose(change);
      expect(result.decision.reasons).toContainEqual(
        expect.objectContaining({
          code: 'GRAPH_TARGET',
          changedPaths: [oldAdapter],
          viaNodes: [scenarioTarget],
        }),
      );
      expect(result.decision.requestedRequiredKeys).toContain('scenario');
    }
    const { graph } = impactFixture();
    expect(traceImpact(graph, oldAdapter).reachedPaths).toContain(
      'src/new-location/view.ts',
    );
  });

  it('機能ディレクトリに追加した未追跡fileをgraphと独立に選ぶ', () => {
    const result = choose({
      status: 'A',
      origin: 'untracked',
      newPath: 'src/features/scenarios/added.ts',
    });
    expect(result.decision.mode).toBe('partial');
    expect(result.decision.caseIds).toEqual(['scenario']);
    expect(result.effective?.effectiveRequiredKeys).toEqual([
      'preview-base',
      'preview-setup',
      'scenario',
      'scenario-repeat',
    ]);
  });

  it('stagedとunstagedの両方、および登録済テスト単体の差分を選ぶ', () => {
    const result = choose(
      {
        status: 'M',
        origin: 'staged',
        newPath: calendarFile,
      },
      changed(scenariosFile),
    );
    expect(result.decision.mode).toBe('partial');
    expect(result.decision.caseIds).toEqual([
      'calendar-a',
      'calendar-b',
      'scenario',
    ]);
    expect(result.effective?.effectiveRequiredKeys).not.toContain('rpc');
    expect(result.effective?.legacyExtraKeys).toEqual([]);
  });

  it.each([
    [button, 'BROAD_CHANGE'],
    ['tsconfig.json', 'BROAD_CHANGE'],
    ['pnpm-lock.yaml', 'BROAD_CHANGE'],
    ['e2e/fixtures/actor.ts', 'BROAD_CHANGE'],
    ['e2e/ledger/scenarios/scenario.json', 'BROAD_CHANGE'],
    ['supabase/migrations/new.sql', 'DATABASE_WIDE'],
    ['docs/unknown.md', 'UNKNOWN_CHANGE'],
    ['src/features/scenarios/unknown.spec.ts', 'UNREGISTERED_TEST'],
  ])('%sを全必須へ広げる', (path, code) => {
    const result = choose(changed(path));
    expect(result.decision.mode).toBe('full-required');
    expect(result.decision.reasons).toContainEqual(
      expect.objectContaining({ code }),
    );
    expect(result.effective?.effectiveRequiredKeys).toHaveLength(
      result.fullPlan.requirements.length,
    );
    if (code === 'DATABASE_WIDE')
      expect(result.decision.coverageGaps).toContainEqual(
        expect.objectContaining({
          code: 'LEGACY_DATABASE_UNVERIFIED',
        }),
      );
  });

  it('変更fileの外にある未解決の呼出元を無視しない', () => {
    const input = impactFixture();
    input.inventories.working.diagnostics.push({
      code: 'UNRESOLVED_CALL',
      message: '動的な参照',
      severity: 'warning',
      source: { file: 'src/unrelated.ts', line: 1, column: 1 },
      anchor: {
        ownerId: 'module:src/unrelated.ts',
        syntaxHash: 'a'.repeat(64),
        occurrence: 0,
      },
    });
    const decision = selectImpacts({
      ...input,
      graph: mergeImpactGraphs(input.inventories),
      snapshot: snapshotFixture([
        { status: 'D', origin: 'committed', oldPath: oldAdapter },
      ]),
    });
    expect(decision.mode).toBe('full-required');
    expect(decision.reasons).toContainEqual(
      expect.objectContaining({ code: 'UNKNOWN_DEPENDENCY' }),
    );
  });

  it('旧規則の消えた対象と関係するbaselineを証拠不足として残す', () => {
    const input = impactFixture();
    const oldRules = structuredClone(input.rules.current);
    oldRules.features[0]?.targets.push('function:retired');
    input.baseline.items.push({
      category: 'source-diagnostic',
      code: 'UNRESOLVED_CALL',
      anchor: {
        ownerId: scenarioTarget,
        syntaxHash: 'a'.repeat(64),
        occurrence: 0,
      },
    });
    const decision = selectImpacts({
      ...input,
      rules: loadImpactRules({
        current: input.rawRules,
        base: JSON.stringify(oldRules),
        ledger: input.ledger,
      }),
      snapshot: snapshotFixture([changed(oldAdapter)]),
    });
    expect(decision.coverageStatus).toBe('insufficient');
    expect(decision.coverageGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'RETIRED_RULE_REFERENCE',
          viaNodes: ['function:retired'],
        }),
        expect.objectContaining({
          code: 'BASELINE_RELATED',
          viaNodes: [scenarioTarget],
        }),
      ]),
    );
    expect(() =>
      loadImpactRules({
        current: JSON.stringify(oldRules),
        base: input.rawRules,
        ledger: input.ledger,
      }),
    ).toThrow(/現行台帳/u);
  });
});

describe('実行単位への拡張', () => {
  it('caseの全repeat、group全体と依存group、Vitestの全file内登録、setupの再帰依存を実行する', () => {
    const input = {
      ...impactFixture(),
      snapshot: snapshotFixture([changed(scenariosFile)]),
    };
    input.ledger.executionGroups.push(
      {
        id: 'storybook-group',
        caseIds: ['scenario', 'schedule'],
        dependsOn: ['calendar-group'],
      },
      { id: 'calendar-group', caseIds: ['calendar-a'], dependsOn: [] },
    );
    const decision = selectImpacts(input);
    const effective = projectSelection({ ...input, decision });
    expect(decision.requestedRequiredKeys).toEqual([
      'scenario',
      'scenario-repeat',
    ]);
    expect(effective?.effectiveRequiredKeys).toEqual([
      'calendar-a',
      'calendar-b',
      'preview-base',
      'preview-setup',
      'scenario',
      'scenario-repeat',
      'schedule',
    ]);
    expect(effective?.supportKeys).toEqual(['preview-base', 'preview-setup']);
    expect(effective?.reasons).toContainEqual(
      expect.objectContaining({ code: 'VITEST_FILE_CLOSURE' }),
    );
  });

  it('legacy-localに未移行を別計上し、選んだsuiteの途中だけを許さない', () => {
    const input = choose(changed('e2e/old.spec.ts'));
    expect(input.decision.coverageStatus).toBe('insufficient');
    expect(input.decision.legacyPolicy).toBe('legacy-local');
    expect(input.effective?.legacyExtraKeys).toHaveLength(2);
    expect(input.effective?.reasons).toContainEqual(
      expect.objectContaining({
        code: 'LEGACY_SERIAL_SUITE',
        ruleIds: ['old-suite'],
      }),
    );
    input.legacy.groups[0]?.testKeys.push('deferred-live-member');
    expect(() => projectSelection(input)).toThrow(/suite全体/u);
  });

  it('appの一部caseから起動しても既存ownerの全登録を照合する', () => {
    const input = choose(changed('e2e/sample.spec.ts'));
    expect(input.decision.mode).toBe('partial');
    expect(input.decision.requestedRequiredKeys).toHaveLength(4);
    expect(input.effective?.supportKeys).toHaveLength(1);
    expect(input.effective?.legacyExtraKeys).toHaveLength(2);
    expect(
      input.effective?.plan.requirements.every(
        ({ profile }) => profile === 'app',
      ),
    ).toBe(true);
  });
});

describe('0件選択の別証拠', () => {
  it.each([
    [],
    [changed('README.md')],
  ])('空または許可済みの文書差分だけを受理する', (...changes) => {
    const input = choose(...changes);
    expect(input.decision.mode).toBe('docs-only');
    expect(input.effective).toBeNull();
    expect(() =>
      assertNoOpDecision({
        ...input,
        endSnapshot: structuredClone(input.snapshot),
      }),
    ).not.toThrow();
    expect(() =>
      assertNoOpDecision({
        ...input,
        endSnapshot: { ...input.snapshot, digest: '0'.repeat(64) },
      }),
    ).toThrow(/snapshot/u);
    const snapshot = {
      ...input.snapshot,
      changedPaths: [changed('docs/unknown.md')],
    };
    expect(() =>
      assertNoOpDecision({ ...input, snapshot, endSnapshot: snapshot }),
    ).toThrow(/allowlist/u);
  });

  it('比較元の規則・graph・実入力の証拠がなければ0件を選ばない', () => {
    const input = choose(changed('README.md'));
    const rules = loadImpactRules({
      current: input.rawRules,
      base: null,
      ledger: input.ledger,
    });
    expect(selectImpacts({ ...input, rules }).mode).toBe('full-required');
    expect(
      selectImpacts({ ...input, graph: mergeImpactGraphs(null) }).mode,
    ).toBe('full-required');
    input.snapshot.reasons.push({
      code: 'UNVERSIONED_RUNTIME_INPUT',
      paths: ['src/styled-system/css/index.mjs'],
    });
    expect(selectImpacts(input).mode).toBe('full-required');
    const provenUnversionedPaths = ['src/styled-system/css/index.mjs'];
    const decision = selectImpacts({ ...input, provenUnversionedPaths });
    expect(decision.mode).toBe('docs-only');
    expect(() =>
      assertNoOpDecision({
        ...input,
        decision,
        endSnapshot: input.snapshot,
        provenUnversionedPaths,
      }),
    ).not.toThrow();
    expect(() =>
      assertNoOpDecision({ ...input, decision, endSnapshot: input.snapshot }),
    ).toThrow(/実入力/u);
  });
});

describe('同じsnapshotのshadow比較', () => {
  const observations = () => {
    const input = choose(changed(scenariosFile));
    if (input.effective === null) throw new Error('fixture不足');
    const fullPlanDigest = digestVerificationPlan(input.fullPlan);
    const shared = {
      fullPlanDigest,
      snapshotDigest: input.snapshot.digest,
      inputDigest: 'd'.repeat(64),
      collectionDigest: 'e'.repeat(64),
      rulesDigest: input.rules.digest,
      status: 'complete' as const,
    };
    const partial: ShadowObservation = {
      ...shared,
      verificationId: 'partial',
      selectionDigest: input.effective.selectionDigest,
      requiredKeys: input.effective.effectiveRequiredKeys,
      failedRequiredKeys: [],
    };
    const full: ShadowObservation = {
      ...shared,
      verificationId: 'full',
      selectionDigest: fullPlanDigest,
      requiredKeys: input.fullPlan.requirements.map(({ key }) => key),
      failedRequiredKeys: [],
    };
    return { fullPlan: input.fullPlan, full, partial };
  };

  it('除外された必須testに入れた回帰を検出する', () => {
    const input = observations();
    expect(compareSelectionShadow(input).status).toBe('matched');
    input.full.failedRequiredKeys.push('rpc');
    expect(compareSelectionShadow(input)).toMatchObject({
      status: 'missed-required-failure',
      missedRequiredKeys: ['rpc'],
    });
  });

  it('両runが成功してもgroupの同席caseと推移的な依存caseを省略できない', () => {
    const input = observations();
    const executionGroups = [
      {
        id: 'storybook',
        caseIds: ['scenario', 'schedule'],
        dependsOn: ['bridge'],
      },
      {
        id: 'bridge',
        caseIds: ['calendar-a', 'calendar-b'],
        dependsOn: ['rpc'],
      },
      { id: 'rpc', caseIds: ['rpc'], dependsOn: [] },
    ];
    const compare = (keys: string[]) => {
      const requiredKeys = [...input.partial.requiredKeys, ...keys];
      const plan = {
        schemaVersion: 1 as const,
        requirements: input.fullPlan.requirements.filter(({ key }) =>
          requiredKeys.includes(key),
        ),
        allowedExtraTests: [],
      };
      return compareSelectionShadow({
        ...input,
        executionGroups,
        partial: {
          ...input.partial,
          requiredKeys,
          selectionDigest: digestVerificationPlan(plan),
        },
      });
    };
    expect(compare([])).toMatchObject({
      status: 'invalid',
      reasons: ['EXECUTION_GROUP_SELECTION_MISMATCH'],
    });
    expect(compare(['schedule', 'calendar-a', 'calendar-b'])).toMatchObject({
      status: 'invalid',
      reasons: ['EXECUTION_GROUP_SELECTION_MISMATCH'],
    });
    expect(
      compare(['schedule', 'calendar-a', 'calendar-b', 'rpc']).status,
    ).toBe('matched');
  });

  it.each([
    'missing',
    'cycle',
  ] as const)('選択外のgroup依存の%sも拒否する', (failure) => {
    const input = observations();
    const executionGroups = [
      { id: 'rpc', caseIds: ['rpc'], dependsOn: ['calendar'] },
      {
        id: 'calendar',
        caseIds: ['calendar-a'],
        dependsOn: [failure === 'cycle' ? 'rpc' : 'unknown'],
      },
    ];
    expect(compareSelectionShadow({ ...input, executionGroups })).toMatchObject(
      {
        status: 'invalid',
        reasons: ['EXECUTION_GROUP_SELECTION_MISMATCH'],
      },
    );
  });

  it('片方の失敗と環境不備、snapshotの混線を区別する', () => {
    const input = observations();
    input.partial.failedRequiredKeys.push('preview-base');
    expect(compareSelectionShadow(input)).toMatchObject({
      status: 'nondeterministic',
      divergentRequiredKeys: ['preview-base'],
    });
    input.full.status = 'inconclusive';
    expect(compareSelectionShadow(input).status).toBe('inconclusive');
    input.full.snapshotDigest = '0'.repeat(64);
    expect(compareSelectionShadow(input)).toMatchObject({
      status: 'invalid',
      reasons: ['SNAPSHOT_CONTEXT_MISMATCH'],
    });
  });
});

import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import { buildPendingItems, checkBaseline } from './baseline';
import { createLedgerFixture } from './fixtures/ledger';
import {
  comparePolicy,
  policyDeltaSchema,
  policyMigrationSchema,
  validatePolicyMigrations,
} from './policy';

import type { Deficiency, Ledger } from '../../e2e/ledger/schema';
import type { PolicyDelta } from './policy';

const fixture = () => {
  const ledger = createLedgerFixture();
  const contract = ledger.contracts[0];
  const requirement = contract?.requirements[0];
  const scenario = ledger.scenarios[0];
  const item = scenario?.cases[0];
  const profile = ledger.profiles[0];
  const actorFixture = ledger.fixtures[0];
  const execution = item?.executions[0];
  if (
    isNil(contract) ||
    isNil(requirement) ||
    isNil(scenario) ||
    isNil(item) ||
    isNil(profile) ||
    isNil(actorFixture) ||
    isNil(execution)
  )
    throw new Error('fixture不足');
  return {
    ledger,
    contract,
    requirement,
    scenario,
    item,
    profile,
    actorFixture,
    execution,
  };
};
const kinds = (base: Ledger, head: Ledger) =>
  comparePolicy(base, head).map((delta) => delta.kind);
const explain = (deltas: PolicyDelta[]) =>
  deltas.map((delta) => ({
    deltaId: delta.id,
    reason: '対象仕様の廃止に伴う変更',
    reference: 'docs/plans/retirement.md',
  }));
const deficiency = (): Deficiency => ({
  target: 'action:save',
  aspect: 'persist',
  layer: 'browser',
  caseId: 'save',
  variant: 'creator',
  profile: 'app',
  project: 'chromium',
  runtime: 'next-production',
  actorBindings: [{ role: 'operator', actor: 'creator' }],
});

describe('台帳policyの変更検出', () => {
  it('配列・objectの記述順、タイトルだけの変更、implementedへの昇格は免除追加ではない', () => {
    const { ledger: head, item, requirement, scenario } = fixture();
    const base = structuredClone(head);
    head.profiles.reverse();
    item.executions.reverse();
    requirement.layers.reverse();
    requirement.executions.reverse();
    item.title = '説明を明確にする';
    scenario.title = '日程保存';
    item.status = 'implemented';
    expect(comparePolicy(base, head)).toEqual([]);
  });

  it('通常の契約・case・観点・execution追加は移行理由を要求しない', () => {
    const {
      ledger: head,
      item,
      contract,
      requirement,
      scenario,
      actorFixture,
      profile,
    } = fixture();
    const base = structuredClone(head);
    head.contracts.push({ ...structuredClone(contract), target: 'action:new' });
    scenario.cases.push({ ...structuredClone(item), caseId: 'new-case' });
    contract.requirements.push({
      ...structuredClone(requirement),
      aspect: 'validation',
    });
    const extra = {
      ...structuredClone(item.executions[0]),
      profile: 'app',
      project: 'firefox',
      runtime: 'next-production' as const,
      variant: 'keeper',
      actorBindings: [{ role: 'operator', actor: 'keeper' }],
    };
    requirement.executions.push(extra);
    item.executions.push(extra);
    item.testBindings.push('additional-proof');
    actorFixture.actors.push('observer');
    profile.executions.push({ project: 'firefox', runtime: 'next-production' });
    expect(comparePolicy(base, head)).toEqual([]);
  });

  it.each([
    ['classification', 'CLASSIFICATION_CHANGED'],
    ['expectation', 'REQUIREMENT_TEXT_CHANGED'],
    ['basis', 'REQUIREMENT_TEXT_CHANGED'],
    ['layer', 'REQUIREMENT_LAYERS_REMOVED'],
    ['execution', 'REQUIREMENT_EXECUTIONS_REMOVED'],
    ['actor', 'REQUIREMENT_EXECUTIONS_REMOVED'],
    ['variant', 'REQUIREMENT_EXECUTIONS_REMOVED'],
  ] as const)('既存契約の%s変更を可視化する', (field, expected) => {
    const { ledger: head, contract, requirement } = fixture();
    const base = structuredClone(head);
    if (field === 'classification') contract.classification = 'read';
    if (field === 'expectation') requirement.expectation = '応答だけを確認する';
    if (field === 'basis') requirement.basis = ['docs/changed.md'];
    if (field === 'layer') requirement.layers.pop();
    if (field === 'execution') requirement.executions.pop();
    if (field === 'actor' || field === 'variant') {
      const execution = requirement.executions[0];
      if (isNil(execution)) throw new Error('fixture不足');
      if (field === 'actor') execution.actorBindings = [];
      else execution.variant = 'anonymous';
    }
    expect(kinds(base, head)).toContain(expected);
  });

  it('観点削除と契約削除を不足件数から独立して検出する', () => {
    const { ledger: head, contract } = fixture();
    const base = structuredClone(head);
    contract.requirements = [];
    expect(kinds(base, head)).toContain('REQUIREMENT_REMOVED');
    head.contracts = [];
    expect(kinds(base, head)).toContain('CONTRACT_REMOVED');
  });

  it('NAは新規契約でも理由を要求し、既存NAの根拠変更も検出する', () => {
    const { ledger: head, contract } = fixture();
    const base = structuredClone(head);
    contract.notApplicable.push({
      aspect: 'authorization',
      reason: '公開処理',
      reference: 'docs/auth.md',
    });
    expect(kinds(base, head)).toContain('NOT_APPLICABLE_ADDED_OR_CHANGED');
    const withExemption = structuredClone(head);
    contract.notApplicable = [
      {
        aspect: 'authorization',
        reason: '認可を対象外へ変更',
        reference: 'docs/changed.md',
      },
    ];
    expect(kinds(withExemption, head)).toContain(
      'NOT_APPLICABLE_ADDED_OR_CHANGED',
    );
    head.contracts = [{ ...contract, target: 'action:other' }];
    base.contracts = [];
    expect(kinds(base, head)).toContain('NOT_APPLICABLE_ADDED_OR_CHANGED');
    head.contracts = [];
    expect(comparePolicy(base, head)).toEqual([]);
  });

  it('例外の追加・内容変更を検出し、例外削除は許容する', () => {
    const { ledger: head } = fixture();
    const base = structuredClone(head);
    head.exceptions.push({
      id: 'deferred-save',
      deficiency: deficiency(),
      reason: '環境移行待ち',
      tracker: 'issue:1',
      reviewCondition: 'Batch 9完了時',
    });
    expect(kinds(base, head)).toContain('EXCEPTION_ADDED_OR_CHANGED');
    const withException = structuredClone(head);
    const exception = head.exceptions[0];
    if (isNil(exception)) throw new Error('fixture不足');
    exception.reviewCondition = '将来見直す';
    expect(kinds(withException, head)).toContain('EXCEPTION_ADDED_OR_CHANGED');
    head.exceptions = [];
    expect(comparePolicy(withException, head)).toEqual([]);
  });

  it.each([
    ['roles', 'CASE_ROLES_REMOVED'],
    ['checks', 'CASE_CHECKS_REMOVED'],
    ['executions', 'CASE_EXECUTIONS_REMOVED'],
    ['testBindings', 'CASE_BINDINGS_REMOVED'],
  ] as const)('caseの%s縮小を検出する', (field, expected) => {
    const { ledger: head, item } = fixture();
    const base = structuredClone(head);
    item[field].pop();
    expect(kinds(base, head)).toContain(expected);
  });

  it('caseの降格とfixture/layer/group差替えを検出する', () => {
    const { ledger: head, item } = fixture();
    item.status = 'implemented';
    const base = structuredClone(head);
    item.status = 'planned';
    expect(kinds(base, head)).toContain('CASE_DOWNGRADED');
    for (const change of [
      { fixture: 'other' },
      { layer: 'storybook' as const },
      { executionGroup: 'partial' },
    ]) {
      Object.assign(item, change);
      expect(kinds(base, head)).toContain('CASE_CONTEXT_CHANGED');
    }
  });

  it('scenarioとcaseの削除を検出する', () => {
    const { ledger: head, scenario } = fixture();
    const base = structuredClone(head);
    scenario.cases = [];
    expect(kinds(base, head)).toEqual(
      expect.arrayContaining(['SCENARIO_CASES_REMOVED', 'CASE_REMOVED']),
    );
    head.scenarios = [];
    expect(kinds(base, head)).toContain('SCENARIO_REMOVED');
  });

  it('profileとfixtureの縮小・削除を検出する', () => {
    const { ledger: head, profile, actorFixture } = fixture();
    const base = structuredClone(head);
    profile.layer = 'storybook';
    profile.executions.pop();
    actorFixture.actors.pop();
    expect(kinds(base, head)).toEqual(
      expect.arrayContaining([
        'PROFILE_LAYER_CHANGED',
        'PROFILE_EXECUTIONS_REMOVED',
        'FIXTURE_ACTORS_REMOVED',
      ]),
    );
    head.profiles = [];
    head.fixtures = [];
    expect(kinds(base, head)).toEqual(
      expect.arrayContaining(['PROFILE_REMOVED', 'FIXTURE_REMOVED']),
    );
  });

  it('serial groupの途中caseと依存groupの削除を検出する', () => {
    const { ledger: head } = fixture();
    const group = {
      id: 'lifecycle',
      caseIds: ['create', 'confirm'],
      dependsOn: ['prepare'],
    };
    head.executionGroups = [group];
    const base = structuredClone(head);
    group.caseIds.pop();
    group.dependsOn = [];
    expect(kinds(base, head)).toEqual(
      expect.arrayContaining([
        'GROUP_CASES_REMOVED',
        'GROUP_DEPENDENCIES_REMOVED',
      ]),
    );
    head.executionGroups = [];
    expect(kinds(base, head)).toContain('GROUP_REMOVED');
  });

  it('将来schemaVersionを拡張した場合も差分理由が必要になる', () => {
    const { ledger: head } = fixture();
    const base = structuredClone(head);
    // 現在のloaderはversion 2を拒否する。将来の型拡張時の比較条件を先に固定する。
    Object.assign(head, { schemaVersion: 2 });
    expect(kinds(base, head)).toEqual(['SCHEMA_CHANGED']);
  });

  it('delta IDは正規化済みの変更全体に依存し、入力を変更しない', () => {
    const { ledger: head, requirement } = fixture();
    const base = structuredClone(head);
    requirement.executions.pop();
    const before = structuredClone({ base, head });
    const deltas = comparePolicy(base, head);
    expect(
      deltas.every((delta) => policyDeltaSchema.safeParse(delta).success),
    ).toBe(true);
    expect({ base, head }).toEqual(before);
    const reordered = structuredClone(head);
    reordered.profiles.reverse();
    expect(comparePolicy(base, reordered)).toEqual(deltas);
    requirement.expectation = '変更後の期待';
    const current = comparePolicy(base, head);
    expect(current.length).toBeGreaterThan(deltas.length);
    expect(validatePolicyMigrations(current, explain(deltas))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_POLICY_MIGRATION' }),
      ]),
    );
  });

  it('移行理由の不足・重複・不要な記録を拒否する', () => {
    const { ledger: head, requirement } = fixture();
    const base = structuredClone(head);
    requirement.executions.pop();
    const deltas = comparePolicy(base, head);
    const migrations = explain(deltas);
    expect(validatePolicyMigrations(deltas, migrations)).toEqual([]);
    expect(validatePolicyMigrations(deltas, [])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_POLICY_MIGRATION' }),
      ]),
    );
    expect(
      validatePolicyMigrations(deltas, [...migrations, ...migrations]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DUPLICATE_POLICY_MIGRATION' }),
      ]),
    );
    expect(validatePolicyMigrations([], migrations)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'UNUSED_POLICY_MIGRATION' }),
      ]),
    );
    requirement.executions = [];
    expect(
      validatePolicyMigrations(comparePolicy(base, head), migrations),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'UNUSED_POLICY_MIGRATION' }),
        expect.objectContaining({ code: 'MISSING_POLICY_MIGRATION' }),
      ]),
    );
  });

  it('空理由・参照先なし・包括承認fieldを受理しない', () => {
    const migration = {
      deltaId: 'a'.repeat(64),
      reason: '仕様変更',
      reference: 'issue:1',
    };
    for (const input of [
      { ...migration, reason: '  ' },
      { ...migration, reference: '' },
      { ...migration, allowBaselineGrowth: true },
    ])
      expect(policyMigrationSchema.safeParse(input).success).toBe(false);
  });

  it('policyの理由が揃っていても新規不足のbaseline追加は許可しない', () => {
    const { ledger: head, contract } = fixture();
    const base = structuredClone(head);
    contract.classification = 'read';
    const deltas = comparePolicy(base, head);
    expect(validatePolicyMigrations(deltas, explain(deltas))).toEqual([]);
    const current = buildPendingItems([deficiency()], []);
    expect(
      checkBaseline({
        base: { schemaVersion: 1, items: [] },
        head: { schemaVersion: 1, items: current },
        current,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'NEW_PENDING_ITEM' }),
      ]),
    );
  });
});

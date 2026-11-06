import { isNil } from 'ramda';
import { z } from 'zod';

import { createHash } from 'node:crypto';

import type { Ledger, LedgerIssue } from '../../e2e/ledger/schema';

const text = z.string().trim().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const jsonValueSchema = z.json();
export const policyDeltaSchema = z.strictObject({
  id: hash,
  kind: z.enum([
    'SCHEMA_CHANGED',
    'CONTRACT_REMOVED',
    'CLASSIFICATION_CHANGED',
    'REQUIREMENT_REMOVED',
    'REQUIREMENT_TEXT_CHANGED',
    'REQUIREMENT_LAYERS_REMOVED',
    'REQUIREMENT_EXECUTIONS_REMOVED',
    'NOT_APPLICABLE_ADDED_OR_CHANGED',
    'EXCEPTION_ADDED_OR_CHANGED',
    'SCENARIO_REMOVED',
    'SCENARIO_CASES_REMOVED',
    'CASE_REMOVED',
    'CASE_DOWNGRADED',
    'CASE_CONTEXT_CHANGED',
    'CASE_ROLES_REMOVED',
    'CASE_CHECKS_REMOVED',
    'CASE_EXECUTIONS_REMOVED',
    'CASE_BINDINGS_REMOVED',
    'PROFILE_REMOVED',
    'PROFILE_LAYER_CHANGED',
    'PROFILE_EXECUTIONS_REMOVED',
    'FIXTURE_REMOVED',
    'FIXTURE_ACTORS_REMOVED',
    'GROUP_REMOVED',
    'GROUP_CASES_REMOVED',
    'GROUP_DEPENDENCIES_REMOVED',
  ]),
  subject: text,
  before: z.unknown(),
  after: z.unknown(),
});
export const policyMigrationSchema = z.strictObject({
  deltaId: hash,
  reason: text,
  reference: text,
});

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

// 台帳の配列は集合として扱い、記述順やobjectのキー順で理由を要求しない。
const normalize = (value: JsonValue): JsonValue => {
  if (Array.isArray(value))
    return value
      .map(normalize)
      .sort((left, right) =>
        compare(JSON.stringify(left), JSON.stringify(right)),
      );
  if (isNil(value) || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => compare(left, right))
      .map(([key, entry]) => [key, normalize(entry)]),
  );
};
const canonical = (value: unknown) =>
  JSON.stringify(normalize(jsonValueSchema.parse(value)));

/** 件数減少とは独立して、要件・免除・実行条件を弱め得る変更を列挙する。 */
export const comparePolicy = (base: Ledger, head: Ledger): PolicyDelta[] => {
  const deltas: PolicyDelta[] = [];
  const changed = (
    kind: PolicyDelta['kind'],
    subject: string,
    before: unknown,
    after: unknown,
  ) => {
    if (canonical(before) === canonical(after)) return;
    const content = {
      kind,
      subject,
      before: normalize(jsonValueSchema.parse(before)),
      after: normalize(jsonValueSchema.parse(after)),
    };
    deltas.push({
      id: createHash('sha256').update(canonical(content)).digest('hex'),
      ...content,
    });
  };
  const shrunk = (
    kind: PolicyDelta['kind'],
    subject: string,
    before: unknown[],
    after: unknown[],
  ) => {
    const current = new Set(after.map(canonical));
    if (before.some((value) => !current.has(canonical(value))))
      changed(kind, subject, before, after);
  };
  const existing = <T>(
    before: T[],
    after: T[],
    key: (value: T) => string,
    removed: PolicyDelta['kind'],
    inspect: (old: T, current: T, subject: string) => void,
  ) => {
    const current = new Map(after.map((value) => [key(value), value]));
    for (const old of before) {
      const subject = key(old);
      const next = current.get(subject);
      if (isNil(next)) changed(removed, subject, old, null);
      else inspect(old, next, subject);
    }
  };

  changed('SCHEMA_CHANGED', 'ledger', base.schemaVersion, head.schemaVersion);
  existing(
    base.contracts,
    head.contracts,
    (value) => value.target,
    'CONTRACT_REMOVED',
    (old, next, target) => {
      changed(
        'CLASSIFICATION_CHANGED',
        target,
        old.classification,
        next.classification,
      );
      existing(
        old.requirements,
        next.requirements,
        (value) => `${target}#${value.aspect}`,
        'REQUIREMENT_REMOVED',
        (requirement, current, subject) => {
          changed(
            'REQUIREMENT_TEXT_CHANGED',
            subject,
            { expectation: requirement.expectation, basis: requirement.basis },
            { expectation: current.expectation, basis: current.basis },
          );
          shrunk(
            'REQUIREMENT_LAYERS_REMOVED',
            subject,
            requirement.layers,
            current.layers,
          );
          shrunk(
            'REQUIREMENT_EXECUTIONS_REMOVED',
            subject,
            requirement.executions,
            current.executions,
          );
        },
      );
    },
  );
  for (const contract of head.contracts) {
    const old = base.contracts.find(
      (value) => value.target === contract.target,
    );
    for (const exemption of contract.notApplicable) {
      changed(
        'NOT_APPLICABLE_ADDED_OR_CHANGED',
        `${contract.target}#${exemption.aspect}`,
        old?.notApplicable.find((value) => value.aspect === exemption.aspect) ??
          null,
        exemption,
      );
    }
  }
  for (const exception of head.exceptions)
    changed(
      'EXCEPTION_ADDED_OR_CHANGED',
      exception.id,
      base.exceptions.find((value) => value.id === exception.id) ?? null,
      exception,
    );

  existing(
    base.scenarios,
    head.scenarios,
    (value) => value.scenarioId,
    'SCENARIO_REMOVED',
    (old, next, subject) => {
      shrunk(
        'SCENARIO_CASES_REMOVED',
        subject,
        old.cases.map((value) => value.caseId),
        next.cases.map((value) => value.caseId),
      );
    },
  );
  existing(
    base.scenarios.flatMap((value) => value.cases),
    head.scenarios.flatMap((value) => value.cases),
    (value) => value.caseId,
    'CASE_REMOVED',
    (old, next, subject) => {
      if (old.status === 'implemented' && next.status === 'planned')
        changed('CASE_DOWNGRADED', subject, old.status, next.status);
      changed(
        'CASE_CONTEXT_CHANGED',
        subject,
        {
          layer: old.layer,
          fixture: old.fixture,
          executionGroup: old.executionGroup ?? null,
        },
        {
          layer: next.layer,
          fixture: next.fixture,
          executionGroup: next.executionGroup ?? null,
        },
      );
      shrunk('CASE_ROLES_REMOVED', subject, old.roles, next.roles);
      shrunk('CASE_CHECKS_REMOVED', subject, old.checks, next.checks);
      shrunk(
        'CASE_EXECUTIONS_REMOVED',
        subject,
        old.executions,
        next.executions,
      );
      shrunk(
        'CASE_BINDINGS_REMOVED',
        subject,
        old.testBindings,
        next.testBindings,
      );
    },
  );
  existing(
    base.profiles,
    head.profiles,
    (value) => value.id,
    'PROFILE_REMOVED',
    (old, next, subject) => {
      changed('PROFILE_LAYER_CHANGED', subject, old.layer, next.layer);
      shrunk(
        'PROFILE_EXECUTIONS_REMOVED',
        subject,
        old.executions,
        next.executions,
      );
    },
  );
  existing(
    base.fixtures,
    head.fixtures,
    (value) => value.id,
    'FIXTURE_REMOVED',
    (old, next, subject) => {
      shrunk('FIXTURE_ACTORS_REMOVED', subject, old.actors, next.actors);
    },
  );
  existing(
    base.executionGroups,
    head.executionGroups,
    (value) => value.id,
    'GROUP_REMOVED',
    (old, next, subject) => {
      shrunk('GROUP_CASES_REMOVED', subject, old.caseIds, next.caseIds);
      shrunk(
        'GROUP_DEPENDENCIES_REMOVED',
        subject,
        old.dependsOn,
        next.dependsOn,
      );
    },
  );
  return deltas.sort((left, right) => compare(left.id, right.id));
};

/** 説明をexact deltaへ結び付ける。理由があってもbaseline追加を許可しない。 */
export const validatePolicyMigrations = (
  deltas: PolicyDelta[],
  migrations: PolicyMigration[],
): LedgerIssue[] => {
  const issues: LedgerIssue[] = [];
  const required = new Set(
    deltas.map((delta) => policyDeltaSchema.parse(delta).id),
  );
  const explained = new Set<string>();
  for (const input of migrations) {
    const migration = policyMigrationSchema.parse(input);
    if (explained.has(migration.deltaId))
      issues.push({
        code: 'DUPLICATE_POLICY_MIGRATION',
        subject: migration.deltaId,
        message: '同じpolicy deltaへの移行理由が重複しています。',
      });
    if (!required.has(migration.deltaId))
      issues.push({
        code: 'UNUSED_POLICY_MIGRATION',
        subject: migration.deltaId,
        message: '現在のpolicy deltaに対応しない移行理由です。',
      });
    explained.add(migration.deltaId);
  }
  for (const id of required)
    if (!explained.has(id))
      issues.push({
        code: 'MISSING_POLICY_MIGRATION',
        subject: id,
        message: '契約・免除・実行条件の変更には理由と参照先が必要です。',
      });
  return issues.sort((left, right) =>
    compare(`${left.code}:${left.subject}`, `${right.code}:${right.subject}`),
  );
};

type JsonValue = z.infer<typeof jsonValueSchema>;
type PolicyDelta = z.infer<typeof policyDeltaSchema>;
type PolicyMigration = z.infer<typeof policyMigrationSchema>;
export type { PolicyDelta, PolicyMigration };
